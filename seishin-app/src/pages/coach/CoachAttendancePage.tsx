import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { coachApi } from '../../api/coach'
import type { AttendanceStatus, GroupSummary } from '../../api/types'
import { ApiError } from '../../api/client'
import { CoachPageShell } from '../../components/coach/CoachPageShell'
import { CoachError, CoachLoading } from '../../components/coach/CoachScreenState'
import { IconArrowLeft, IconCheck } from '../../components/ui/Icons'
import { attendanceDayClass, attendanceStatusLabel, parentTrainingIntentLabel } from '../../utils/format'

const STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'MAKEUP', 'GUEST']

type ParentIntent = 'PENDING' | 'CONFIRMED' | 'DECLINED' | null

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function normalizeTime(value: string) {
  if (!value) return '17:00:00'
  return value.length === 5 ? `${value}:00` : value
}

function timeInputValue(value: string) {
  return normalizeTime(value).slice(0, 5)
}

function isUpcomingSession(sessionDate: string, startTime: string) {
  const today = todayIso()
  if (sessionDate > today) return true
  if (sessionDate < today) return false
  const [h, m] = startTime.split(':').map(Number)
  const sessionMinutes = h * 60 + (m || 0)
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return sessionMinutes > nowMinutes
}

export function CoachAttendancePage() {
  const [searchParams] = useSearchParams()
  const presetGroup = searchParams.get('groupId')
  const presetDate = searchParams.get('date')
  const presetTime = searchParams.get('time')
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [groupId, setGroupId] = useState<number | ''>(presetGroup ? Number(presetGroup) : '')
  const [sessionDate, setSessionDate] = useState(presetDate || todayIso())
  const [startTime, setStartTime] = useState(presetTime?.slice(0, 5) || '17:00')
  const [statuses, setStatuses] = useState<Record<number, AttendanceStatus>>({})
  const [parentIntents, setParentIntents] = useState<Record<number, ParentIntent>>({})
  const [studentNames, setStudentNames] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [sessionExists, setSessionExists] = useState(false)

  const upcoming = isUpcomingSession(sessionDate, startTime)

  const loadGroups = useCallback(async () => {
    const [groupList, dashboard] = await Promise.all([coachApi.groups(), coachApi.dashboard()])
    setGroups(groupList)
    if (presetGroup) return
    const next = dashboard.nextClass
    const defaultGroupId = next?.groupId ?? groupList[0]?.id ?? ''
    setGroupId(defaultGroupId)
    if (!presetDate && next?.date) setSessionDate(next.date)
    if (!presetTime && next?.startTime) setStartTime(timeInputValue(next.startTime))
  }, [presetDate, presetGroup, presetTime])

  const loadAttendance = useCallback(async () => {
    if (!groupId) {
      setStatuses({})
      setParentIntents({})
      setStudentNames({})
      setSessionExists(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await coachApi.getAttendance(Number(groupId), sessionDate, normalizeTime(startTime))
      const nextStatuses: Record<number, AttendanceStatus> = {}
      const nextIntents: Record<number, ParentIntent> = {}
      const nextNames: Record<number, string> = {}
      for (const entry of data.entries) {
        nextStatuses[entry.studentId] = entry.status
        nextNames[entry.studentId] = entry.studentName
        nextIntents[entry.studentId] = entry.parentIntent ?? null
      }
      setStatuses(nextStatuses)
      setParentIntents(nextIntents)
      setStudentNames(nextNames)
      setSessionExists(Boolean(data.sessionId))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [groupId, sessionDate, startTime])

  useEffect(() => {
    void loadGroups().catch((e) => {
      setError(e instanceof ApiError ? e.message : 'Ошибка загрузки')
      setLoading(false)
    })
  }, [loadGroups])

  useEffect(() => {
    if (groupId) void loadAttendance()
  }, [groupId, loadAttendance])

  const studentIds = useMemo(() => Object.keys(studentNames).map(Number), [studentNames])

  const presentCount = studentIds.filter((id) => statuses[id] === 'PRESENT' || statuses[id] === 'MAKEUP').length

  const intentCounts = useMemo(() => {
    let confirmed = 0
    let declined = 0
    let pending = 0
    for (const id of studentIds) {
      const intent = parentIntents[id]
      if (intent === 'CONFIRMED') confirmed += 1
      else if (intent === 'DECLINED') declined += 1
      else if (intent === 'PENDING') pending += 1
    }
    return { confirmed, declined, pending }
  }, [parentIntents, studentIds])

  const setStatus = (studentId: number, status: AttendanceStatus) => {
    setStatuses((prev) => ({ ...prev, [studentId]: status }))
  }

  const markAllPresent = () => {
    setStatuses((prev) => {
      const next = { ...prev }
      for (const id of studentIds) next[id] = 'PRESENT'
      return next
    })
  }

  const save = async () => {
    if (!groupId || studentIds.length === 0) return
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      await coachApi.markAttendance({
        groupId: Number(groupId),
        sessionDate,
        startTime: normalizeTime(startTime),
        entries: studentIds.map((studentId) => ({
          studentId,
          status: statuses[studentId] ?? 'PRESENT',
        })),
      })
      setSessionExists(true)
      setMessage('Посещаемость сохранена — родители увидят в дневнике')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const selectedGroup = groups.find((g) => g.id === groupId)

  return (
    <CoachPageShell
      title={upcoming ? 'Предстоящее занятие' : 'Посещаемость'}
      subtitle={
        upcoming
          ? 'Отметки «будет / не будет» приходят от родителей — только просмотр'
          : selectedGroup
            ? `${selectedGroup.name} · ${studentIds.length} учеников`
            : 'Факт посещения после занятия'
      }
    >
      <Link to="/coach" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text lg:hidden">
        <IconArrowLeft size={18} />
        Назад в кабинет
      </Link>

      <div className="grid grid-cols-3 gap-2">
        {upcoming
          ? [
              { value: intentCounts.confirmed, label: 'будут' },
              { value: intentCounts.declined, label: 'не будут' },
              { value: intentCounts.pending, label: 'не ответили' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white px-2 py-3 text-center shadow-[var(--shadow-card)]">
                <p className="text-xl font-bold text-text">{loading ? '—' : stat.value}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">{stat.label}</p>
              </div>
            ))
          : [
              { value: studentIds.length, label: 'учеников' },
              { value: presentCount, label: 'на месте' },
              { value: sessionExists ? 'да' : 'нет', label: 'сохранено' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white px-2 py-3 text-center shadow-[var(--shadow-card)]">
                <p className="text-xl font-bold text-text">{loading ? '—' : stat.value}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">{stat.label}</p>
              </div>
            ))}
      </div>

      {error && <p className="alert-error">{error}</p>}
      {message && <p className="alert-success">{message}</p>}

      <div className="card p-5 lg:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="attendance-group">
              Группа
            </label>
            <select
              id="attendance-group"
              value={groupId}
              onChange={(e) => setGroupId(Number(e.target.value))}
              className="input-coach"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} · {g.studentCount} уч.
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="attendance-date">
              Дата
            </label>
            <input
              id="attendance-date"
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="input-coach"
            />
          </div>
          <div>
            <label className="label" htmlFor="attendance-time">
              Время
            </label>
            <input
              id="attendance-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input-coach"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {!upcoming && (
            <button type="button" onClick={markAllPresent} className="btn-secondary">
              Все присутствовали
            </button>
          )}
          <button type="button" onClick={() => void loadAttendance()} className="btn-ghost">
            Обновить
          </button>
        </div>
      </div>

      {loading ? (
        <CoachLoading />
      ) : studentIds.length === 0 ? (
        <CoachError message="В группе пока нет учеников" />
      ) : (
        <div className="card p-5 lg:p-6">
          <h2 className="section-title mb-4">{upcoming ? 'Ответы родителей' : 'Состав группы'}</h2>
          <ul className="space-y-3">
            {studentIds.map((studentId) => {
              const intent = parentIntents[studentId]
              const intentUi = parentTrainingIntentLabel(intent)
              return (
                <li
                  key={studentId}
                  className="flex flex-col gap-3 rounded-xl border border-border-light bg-surface-muted p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-text">{studentNames[studentId]}</p>
                    {upcoming ? (
                      <p className="mt-0.5 text-xs text-text-secondary">Отметка из дневника родителя</p>
                    ) : (
                      <p className="mt-0.5 text-xs text-text-secondary">
                        Статус: {attendanceStatusLabel(statuses[studentId] ?? 'PRESENT')}
                      </p>
                    )}
                  </div>
                  {upcoming ? (
                    <span className={`rounded-xl px-3 py-2 text-xs font-semibold ${intentUi.className}`}>
                      {intentUi.label}
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {STATUSES.map((status) => {
                        const active = (statuses[studentId] ?? 'PRESENT') === status
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setStatus(studentId, status)}
                            className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                              active
                                ? attendanceDayClass(status)
                                : 'bg-surface text-text-muted hover:bg-surface-subtle'
                            }`}
                          >
                            {attendanceStatusLabel(status)}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          {!upcoming && (
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="btn-coach mt-6 w-full sm:w-auto"
            >
              <IconCheck size={18} />
              {saving ? 'Сохранение…' : sessionExists ? 'Обновить посещаемость' : 'Сохранить посещаемость'}
            </button>
          )}
        </div>
      )}
    </CoachPageShell>
  )
}
