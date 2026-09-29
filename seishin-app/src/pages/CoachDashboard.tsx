import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { coachApi } from '../api/coach'
import type { CoachDashboard, Payment, StudentSummary } from '../api/types'
import { ApiError } from '../api/client'
import { CoachPageShell } from '../components/coach/CoachPageShell'
import { CoachError, CoachLoading } from '../components/coach/CoachScreenState'
import { IconArrowRight, IconCalendar, IconCheck, IconTrophy, IconUsers } from '../components/ui/Icons'
import { ProgressBar } from '../components/ui/ProgressBar'
import { useAuth } from '../context/AuthContext'
import { formatDate, paymentStatusUi } from '../utils/format'

function formatTime(value?: string | null) {
  if (!value) return ''
  return value.slice(0, 5)
}

function ClubOverviewPanel({
  dashboard,
  groupName,
}: {
  dashboard: CoachDashboard
  groupName: string
}) {
  return (
    <div className="card p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Сводка клуба</p>
      <h2 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-text">{groupName}</h2>
      <p className="mt-2 text-sm text-text-secondary">
        {dashboard.totalStudents} учеников · {dashboard.totalGroups} групп
      </p>
      {dashboard.nextClass && (
        <div className="mt-5 rounded-2xl bg-surface-muted px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Ближайшая тренировка</p>
          <p className="mt-2 font-semibold text-text">
            {new Date(`${dashboard.nextClass.date}T12:00:00`).toLocaleDateString('ru-RU', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {[
              formatTime(dashboard.nextClass.startTime) +
                (dashboard.nextClass.endTime ? `–${formatTime(dashboard.nextClass.endTime)}` : ''),
              dashboard.nextClass.groupName,
              dashboard.nextClass.location,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      )}
    </div>
  )
}

export function CoachDashboard() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState<CoachDashboard | null>(null)
  const [students, setStudents] = useState<StudentSummary[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [competitionName, setCompetitionName] = useState<string | null>(null)
  const [competitionId, setCompetitionId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [actionIsError, setActionIsError] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
  const [inviteCode, setInviteCode] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [dash, studs, pays, comps] = await Promise.all([
        coachApi.dashboard(),
        coachApi.students(),
        coachApi.payments(),
        coachApi.competitions(),
      ])
      setDashboard(dash)
      setStudents(studs)
      setPayments(pays)
      setSelectedStudentId(studs[0]?.id ?? null)
      const comp = comps[0]
      setCompetitionName(comp?.name ?? null)
      setCompetitionId(comp?.id ?? null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const group = dashboard?.groups[0]
  const subtitle = group
    ? `${group.name} · ${dashboard?.totalStudents ?? 0} учеников`
    : `${dashboard?.totalStudents ?? 0} учеников`

  const pendingPayments = payments.filter((p) => p.status !== 'PAID').length
  const pendingRsvps = dashboard?.pendingCompetitionRsvps ?? 0
  const needsAttention = pendingPayments > 0 || pendingRsvps > 0

  const paymentForStudent = (studentId: number) =>
    payments.find((p) => p.studentId === studentId && p.status !== 'PAID')

  const showAction = (message: string, isError = false) => {
    setActionMsg(message)
    setActionIsError(isError)
  }

  const markAllPresent = async () => {
    if (!group || students.length === 0) return
    try {
      const today = new Date().toISOString().slice(0, 10)
      await coachApi.markAttendance({
        groupId: group.id,
        sessionDate: today,
        startTime: '17:00:00',
        entries: students.map((s) => ({ studentId: s.id, status: 'PRESENT' as const })),
      })
      showAction('Посещаемость сохранена')
    } catch (e) {
      showAction(e instanceof ApiError ? e.message : 'Ошибка', true)
    }
  }

  const createInvite = async () => {
    try {
      const res = await coachApi.createInviteCode()
      setInviteCode(res.code)
      showAction(`Код клуба для родителей: ${res.code}`)
    } catch (e) {
      showAction(e instanceof ApiError ? e.message : 'Ошибка', true)
    }
  }

  const sendReminders = async () => {
    try {
      const res = await coachApi.sendPaymentReminders()
      showAction(`Отправлено напоминаний: ${res.length}`)
    } catch (e) {
      showAction(e instanceof ApiError ? e.message : 'Ошибка', true)
    }
  }

  const exportCompetition = async () => {
    if (!competitionId) return
    try {
      await coachApi.exportCompetition(competitionId)
      showAction('Excel-файл скачан')
    } catch (e) {
      showAction(e instanceof Error ? e.message : 'Ошибка экспорта', true)
    }
  }

  const headerActions = (
    <>
      <button type="button" onClick={createInvite} className="btn-on-dark">
        Код клуба
      </button>
      <button type="button" onClick={markAllPresent} className="btn-coach">
        Отметить посещаемость
      </button>
    </>
  )

  return (
    <CoachPageShell
      title="Кабинет"
      subtitle={subtitle}
      hero={
        <div className="hero-app rounded-b-[1.75rem] px-5 pb-8 pt-5">
          <div className="mb-6 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Karate Hub</p>
            <h2 className="mt-2 text-2xl font-extrabold leading-tight text-white">
              {user?.name.split(' ')[0] ?? 'Тренер'}
            </h2>
            <p className="mt-1 text-sm leading-snug text-white/70">{subtitle}</p>
          </div>

          {dashboard && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { value: dashboard.totalStudents, label: 'учеников' },
                { value: dashboard.totalGroups, label: 'групп' },
                { value: pendingPayments, label: 'оплат' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/10 px-2 py-4 text-center sm:px-3"
                >
                  <p className="text-xl font-extrabold leading-none text-white sm:text-2xl">{stat.value}</p>
                  <p className="mt-2 text-[10px] font-semibold uppercase leading-none tracking-wider text-white/70">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">{headerActions}</div>
        </div>
      }
    >
      {loading ? (
        <CoachLoading />
      ) : error || !dashboard ? (
        <CoachError message={error ?? 'Ошибка загрузки'} />
      ) : (
        <>
          {actionMsg && (
            <p className={actionIsError ? 'alert-error' : 'alert-success'} role="status">
              {actionMsg}
            </p>
          )}
          {inviteCode && (
            <p className="alert-info font-mono">
              Invite-код: <strong>{inviteCode}</strong>
            </p>
          )}

          <div className="hidden lg:block">
            <ClubOverviewPanel dashboard={dashboard} groupName={group?.name ?? 'Karate Hub'} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Link to="/coach/students" className="card p-5 transition hover:border-brand-blue/30">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-xl bg-brand-blue-light text-brand-blue">
                  <IconUsers size={18} />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Ученики</span>
              </div>
              <p className="text-sm font-bold text-text">{dashboard.totalStudents} в группах</p>
              <p className="mt-1 text-sm text-text-secondary">{group?.name ?? 'Состав и группы'}</p>
            </Link>

            <Link to="/coach/schedule" className="card p-5 transition hover:border-brand-blue/30">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-xl bg-brand-green-light text-brand-green">
                  <IconCalendar size={18} />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Занятия</span>
              </div>
              {dashboard.nextClass ? (
                <>
                  <p className="text-sm font-bold text-text">{dashboard.nextClass.groupName}</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {formatDate(dashboard.nextClass.date)} · {formatTime(dashboard.nextClass.startTime)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-text">Расписание</p>
                  <p className="mt-1 text-sm text-text-secondary">Календарь и напоминания</p>
                </>
              )}
            </Link>

            <Link to="/coach/awards" className="card p-5 transition hover:border-brand-blue/30">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-xl bg-warning-bg text-warning">
                  <IconTrophy size={18} />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Награды</span>
              </div>
              <p className="text-sm font-bold text-text">Значки и пояса</p>
              <p className="mt-1 text-sm text-text-secondary">Выдача достижений ученикам</p>
            </Link>
          </div>

          {(needsAttention || competitionName) && (
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-text-secondary">
                Требует внимания
              </h3>

              {pendingPayments > 0 && (
                <div className="card relative mb-4 overflow-hidden border-warning/30 bg-warning-bg p-5 lg:p-6">
                  <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-warning/20 text-warning">
                      <IconCheck size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="mb-2 inline-block rounded bg-warning px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        Оплаты
                      </span>
                      <h4 className="text-base font-bold text-text lg:text-lg">
                        {pendingPayments} неоплаченных взносов
                      </h4>
                      <button
                        type="button"
                        onClick={sendReminders}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-warning py-2.5 text-sm font-semibold text-white transition hover:bg-warning/90 sm:w-auto sm:px-6"
                      >
                        Напомнить родителям
                        <IconArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {competitionName && (
                <div className="card relative overflow-hidden border-warning/30 bg-warning-bg p-5 lg:p-6">
                  <IconTrophy className="pointer-events-none absolute -top-4 -right-4 text-warning opacity-10" size={120} />
                  <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-warning/20 text-warning">
                      <IconTrophy size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="mb-2 inline-block rounded bg-warning px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        Соревнование
                      </span>
                      <h4 className="text-base font-bold text-text lg:text-lg">{competitionName}</h4>
                      {pendingRsvps > 0 && (
                        <p className="mt-1 text-sm text-text-secondary">{pendingRsvps} ответов ждут подтверждения</p>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          to="/coach/competitions"
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-warning px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-warning/90"
                        >
                          Открыть детали
                          <IconArrowRight size={16} />
                        </Link>
                        <button
                          type="button"
                          onClick={exportCompetition}
                          className="btn-secondary"
                        >
                          Экспорт Excel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="card p-5 lg:p-6">
            <h2 className="section-title mb-4">Ученики и оплаты</h2>
            <div className="grid gap-2 lg:grid-cols-2">
              {students.map((s) => {
                const pay = paymentForStudent(s.id)
                const ui = pay ? paymentStatusUi(pay.status, pay.dueDate) : paymentStatusUi('PAID')
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedStudentId(s.id)}
                    className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                      selectedStudentId === s.id ? 'bg-brand-blue-light ring-1 ring-brand-blue/20' : 'hover:bg-surface-muted'
                    }`}
                  >
                    <span className="flex size-10 items-center justify-center rounded-full bg-brand-blue-light text-sm font-bold text-brand-blue">
                      {s.firstName[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-text">
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {s.beltName} · {Math.round(s.progressPercent)}% к аттестации
                      </p>
                      <div className="mt-2 lg:hidden">
                        <ProgressBar value={s.progressPercent} showPercent={false} variant="green" />
                      </div>
                    </div>
                    <span className={`badge ${ui.className.includes('d94b55') ? 'badge-error' : ui.className.includes('d7a62a') ? 'badge-warning' : 'badge-success'}`}>
                      {ui.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {(dashboard.birthdayStudents ?? []).length > 0 && (
            <div className="card p-5 lg:p-6">
              <h2 className="section-title mb-3">Дни рождения ({dashboard.upcomingBirthdays})</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {dashboard.birthdayStudents.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-2 text-sm">
                    <span>🎁</span>
                    <span className="font-medium text-text">
                      {s.firstName} {s.lastName}
                    </span>
                    <span className="text-text-muted">· {s.age} лет</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </CoachPageShell>
  )
}
