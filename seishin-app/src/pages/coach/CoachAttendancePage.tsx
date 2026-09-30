import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { coachApi } from '../../api/coach'
import type { AttendanceStatus, GroupSummary } from '../../api/types'
import { ApiError } from '../../api/client'
import { CoachHero } from '../../components/coach/CoachHero'
import { CoachPageShell } from '../../components/coach/CoachPageShell'
import { CoachError, CoachLoading } from '../../components/coach/CoachScreenState'
import { IconArrowLeft, IconCheck } from '../../components/ui/Icons'
import { attendanceDayClass, attendanceStatusLabel } from '../../utils/format'

const STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'MAKEUP', 'GUEST']

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

export function CoachAttendancePage() {
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [groupId, setGroupId] = useState<number | ''>('')
  const [sessionDate, setSessionDate] = useState(todayIso())
  const [startTime, setStartTime] = useState('17:00')
  const [statuses, setStatuses] = useState<Record<number, AttendanceStatus>>({})
  const [studentNames, setStudentNames] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [sessionExists, setSessionExists] = useState(false)

  const loadGroups = useCallback(async () => {
    const [groupList, dashboard] = await Promise.all([coachApi.groups(), coachApi.dashboard()])
    setGroups(groupList)
    const next = dashboard.nextClass
    const defaultGroupId = next?.groupId ?? groupList[0]?.id ?? ''
    setGroupId(defaultGroupId)
    if (next?.date) setSessionDate(next.date)
    if (next?.startTime) setStartTime(timeInputValue(next.startTime))
  }, [])

  const loadAttendance = useCallback(async () => {
    if (!groupId) {
      setStatuses({})
      setStudentNames({})
      setSessionExists(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await coachApi.getAttendance(Number(groupId), sessionDate, normalizeTime(startTime))
      const nextStatuses: Record<number, AttendanceStatus> = {}
      const nextNames: Record<number, string> = {}
      for (const entry of data.entries) {
        nextStatuses[entry.studentId] = entry.status
        nextNames[entry.studentId] = entry.studentName
      }
      setStatuses(nextStatuses)
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
      title="Посещаемость"
      subtitle={selectedGroup ? `${selectedGroup.name} · ${studentIds.length} учеников` : 'Отметка занятия'}
      hero={
        <CoachHero eyebrow="Кабинет" title="Посещаемость" subtitle="Отметьте, кто был на тренировке">
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { value: studentIds.length, label: 'учеников' },
              { value: presentCount, label: 'отмечено' },
              { value: sessionExists ? '✓' : '—', label: 'сохранено' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/10 px-2 py-3 text-center">
                <p className="text-xl font-extrabold text-white">{loading ? '—' : stat.value}</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </CoachHero>
      }
    >
      <Link to="/coach" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text lg:hidden">
        <IconArrowLeft size={18} />
        Назад в кабинет
      </Link>

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
          <button type="button" onClick={markAllPresent} className="btn-secondary">
            Все присутствовали
          </button>
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
          <h2 className="section-title mb-4">Состав группы</h2>
          <ul className="space-y-3">
            {studentIds.map((studentId) => (
              <li
                key={studentId}
                className="flex flex-col gap-3 rounded-xl border border-border-light bg-surface-muted p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-text">{studentNames[studentId]}</p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    Статус: {attendanceStatusLabel(statuses[studentId] ?? 'PRESENT')}
                  </p>
                </div>
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
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="btn-coach mt-6 w-full sm:w-auto"
          >
            <IconCheck size={18} />
            {saving ? 'Сохранение…' : sessionExists ? 'Обновить посещаемость' : 'Сохранить посещаемость'}
          </button>
        </div>
      )}
    </CoachPageShell>
  )
}
