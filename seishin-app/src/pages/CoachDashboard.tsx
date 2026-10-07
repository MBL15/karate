import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { coachApi } from '../api/coach'
import type { ClassEvent, CoachDashboard as CoachDashboardData, SessionAttendance } from '../api/types'
import { ApiError } from '../api/client'
import { LogoutButton } from '../components/auth/LogoutButton'
import { CoachError, CoachLoading } from '../components/coach/CoachScreenState'
import { IconArrowRight, IconClipboard, IconTrophy, IconUsers } from '../components/ui/Icons'
import { useAuth } from '../context/AuthContext'

type Range = 'groups' | 'today' | 'week'

const tones = [
  { tile: 'bg-[#f8e7b0] text-[#a16207]' },
  { tile: 'bg-[#dbe7fb] text-[#1d4e89]' },
  { tile: 'bg-[#eadcfd] text-[#6d28d9]' },
]

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toIso(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function startOfWeek(date: Date) {
  const copy = new Date(date)
  const day = (copy.getDay() + 6) % 7
  copy.setDate(copy.getDate() - day)
  return copy
}

function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

function formatTime(value?: string | null) {
  if (!value) return ''
  return value.slice(0, 5)
}

function timeRange(event: ClassEvent) {
  const start = formatTime(event.startTime)
  const end = formatTime(event.endTime)
  return end ? `${start} – ${end}` : start
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatDay(iso: string) {
  return capitalize(
    new Date(`${iso}T12:00:00`).toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
  )
}

function greeting(date: Date) {
  const hour = date.getHours()
  if (hour < 12) return 'Доброе утро'
  if (hour < 18) return 'Добрый день'
  return 'Добрый вечер'
}

function plural(n: number, one: string, few: string, many: string) {
  const n10 = n % 10
  const n100 = n % 100
  if (n10 === 1 && n100 !== 11) return one
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few
  return many
}

function classKey(event: ClassEvent) {
  return `${event.groupId}-${event.date}-${event.startTime}`
}

function attendanceLink(event: ClassEvent) {
  const params = new URLSearchParams({
    groupId: String(event.groupId),
    date: event.date,
    time: formatTime(event.startTime),
  })
  return `/coach/attendance?${params.toString()}`
}

function parentWillAttendCount(session: SessionAttendance | undefined) {
  if (!session) return 0
  return session.entries.filter((entry) => entry.parentIntent === 'CONFIRMED').length
}

function parentPendingCount(session: SessionAttendance | undefined, total: number) {
  if (!session) return total
  return session.entries.filter((entry) => entry.parentIntent == null || entry.parentIntent === 'PENDING').length
}

export function CoachDashboard() {
  const { user } = useAuth()
  const [range, setRange] = useState<Range>('today')
  const [accountOpen, setAccountOpen] = useState(false)
  const [dashboard, setDashboard] = useState<CoachDashboardData | null>(null)
  const [classes, setClasses] = useState<ClassEvent[]>([])
  const [attendance, setAttendance] = useState<Record<string, SessionAttendance>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const today = useMemo(() => new Date(), [])
  const todayIso = toIso(today)
  const weekFrom = toIso(startOfWeek(today))
  const weekTo = toIso(addDays(startOfWeek(today), 6))

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [dash, weekClasses] = await Promise.all([
        coachApi.dashboard(),
        coachApi.classes(weekFrom, weekTo),
      ])
      setDashboard(dash)
      setClasses(weekClasses)
      const sessions = await Promise.all(
        weekClasses.map(async (event) => {
          const session = await coachApi.getAttendance(event.groupId, event.date, event.startTime)
          return [classKey(event), session] as const
        }),
      )
      setAttendance(Object.fromEntries(sessions))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [todayIso, weekFrom, weekTo])

  useEffect(() => {
    void load()
  }, [load])

  const visibleClasses = classes.filter((event) => (range === 'week' ? true : event.date === todayIso))
  const classesByDate = visibleClasses.reduce<Record<string, ClassEvent[]>>((map, event) => {
    if (!map[event.date]) map[event.date] = []
    map[event.date].push(event)
    return map
  }, {})

  const unmarkedStudents = classes
    .filter((event) => event.date === todayIso)
    .reduce((sum, event) => {
      const session = attendance[classKey(event)]
      if (event.upcoming) {
        return sum + parentPendingCount(session, event.studentCount)
      }
      return session?.sessionId ? sum : sum + event.studentCount
    }, 0)

  const pendingPayments = dashboard?.pendingPayments ?? 0
  const pendingRsvps = dashboard?.pendingCompetitionRsvps ?? 0
  const firstName = user?.name.split(' ')[0] ?? 'Тренер'

  const sendReminders = async () => {
    try {
      const res = await coachApi.sendPaymentReminders()
      setNotice(`Отправлено напоминаний: ${res.length}`)
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : 'Не удалось отправить напоминания')
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-6 pt-[max(1.5rem,var(--safe-top-effective))] lg:max-w-3xl lg:px-8 lg:pt-8">
      <header className="coach-mobile-hero flex items-start justify-between gap-4">
        <div className="relative z-10 min-w-0">
          <p className="font-display text-[1.65rem] leading-tight font-semibold tracking-tight text-white lg:text-text">
            {greeting(today)},
            <br />
            {firstName}
          </p>
          {dashboard?.joinCode && (
            <p className="mt-3 inline-flex items-center rounded-xl border border-[#f0d078]/45 bg-white/10 px-3 py-1.5 font-mono text-lg font-bold tracking-[0.28em] text-[#f6e7b0] lg:border-brand-green/30 lg:bg-brand-green-light lg:text-navy-950">
              <span className="sr-only">Код клуба </span>
              {dashboard.joinCode}
            </p>
          )}
          <p className="mt-1 text-sm text-white/75 lg:text-text-secondary">{dashboard?.clubName ?? 'Клуб'}</p>
        </div>
        <div className="relative z-10">
          <button
            type="button"
            aria-expanded={accountOpen}
            aria-haspopup="menu"
            aria-label="Аккаунт тренера"
            onClick={() => setAccountOpen((open) => !open)}
            className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(160deg,#f6e7b0,#c4961a)] font-display text-base font-semibold text-navy-950 shadow-[0_8px_18px_rgb(184_134_11_/_0.35)] ring-2 ring-white/80"
          >
            <span className="sr-only">{user?.name}</span>
            {firstName.slice(0, 1).toUpperCase()}
          </button>
          {accountOpen && (
            <div
              role="menu"
              className="absolute right-0 z-20 mt-2 w-52 rounded-2xl border border-[#ebe6dc] bg-white p-3 shadow-[var(--shadow-elevated)]"
            >
              <p className="px-1 text-sm font-semibold text-text">{user?.name}</p>
              <p className="px-1 text-xs text-text-secondary">Главный тренер</p>
              <LogoutButton className="mt-3" label="Выйти" />
            </div>
          )}
        </div>
      </header>

      <div className="mt-5 grid grid-cols-3 rounded-full border border-white/80 bg-white p-1 shadow-[var(--shadow-card)]" role="tablist" aria-label="Период">
        {(
          [
            ['groups', 'Группы'],
            ['today', 'Сегодня'],
            ['week', 'Неделя'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={range === id}
            onClick={() => setRange(id)}
            className={`min-h-11 cursor-pointer rounded-full text-sm font-semibold transition duration-200 ${
              range === id
                ? 'bg-[#f0d078] text-navy-950 shadow-[0_6px_16px_rgb(184_134_11_/_0.28)]'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6">
          <CoachLoading />
        </div>
      ) : error || !dashboard ? (
        <div className="mt-6">
          <CoachError message={error ?? 'Ошибка загрузки'} onRetry={() => void load()} />
        </div>
      ) : (
        <>
          {notice && (
            <p className="alert-success mt-4" role="status">
              {notice}
            </p>
          )}

          {range === 'groups' ? (
            <section className="mt-5 space-y-3" aria-label="Группы">
              {dashboard.groups.length === 0 ? (
                <p className="flex flex-col items-center gap-3 rounded-2xl border border-white/80 bg-white px-4 py-8 text-center text-sm text-text-secondary shadow-[var(--shadow-card)]">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-green-light text-[#a16207]">
                    <IconUsers size={22} />
                  </span>
                  Групп пока нет
                </p>
              ) : (
                dashboard.groups.map((group) => (
                  <Link
                    key={group.id}
                    to={`/coach/students?group=${group.id}`}
                    className="panel flex items-center gap-3"
                  >
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-[#dbe7fb] text-[#1d4e89]">
                      <IconUsers size={20} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-text">{group.name}</span>
                      <span className="mt-0.5 block text-sm text-text-secondary">
                        {group.studentCount} {plural(group.studentCount, 'ученик', 'ученика', 'учеников')}
                      </span>
                    </span>
                    <IconArrowRight size={16} className="text-text-muted" />
                  </Link>
                ))
              )}
            </section>
          ) : (
            <section className="mt-5" aria-label={range === 'today' ? 'Занятия сегодня' : 'Занятия недели'}>
              {range === 'today' && (
                <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">{formatDay(todayIso)}</h2>
              )}
              {visibleClasses.length === 0 ? (
                <p className="mt-3 flex flex-col items-center gap-3 rounded-2xl border border-white/80 bg-white px-4 py-8 text-center text-sm text-text-secondary shadow-[var(--shadow-card)]">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-green-light text-[#a16207]">
                    <IconUsers size={22} />
                  </span>
                  {range === 'today' ? 'Сегодня занятий нет' : 'На этой неделе занятий нет'}
                </p>
              ) : (
                <div className="mt-3 space-y-5">
                  {Object.keys(classesByDate).map((date) => (
                    <div key={date}>
                      {range === 'week' && (
                        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">{formatDay(date)}</h2>
                      )}
                      <ul className="space-y-3">
                        {classesByDate[date].map((event, index) => {
                          const session = attendance[classKey(event)]
                          const total = event.studentCount
                          const upcomingClass = event.upcoming
                          const marked = !upcomingClass && Boolean(session?.sessionId)
                          const present = upcomingClass
                            ? parentWillAttendCount(session)
                            : marked
                              ? session!.entries.filter((entry) => entry.status !== 'ABSENT').length
                              : 0
                          const percent = total > 0 ? Math.round((present / total) * 100) : 0
                          const tone = tones[index % tones.length]
                          return (
                            <li key={classKey(event)}>
                              <Link
                                to={attendanceLink(event)}
                                className="panel block"
                              >
                                <div className="flex items-start gap-3">
                                  <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${tone.tile}`}>
                                    <IconUsers size={20} />
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                      <p className="text-sm font-semibold text-text">{timeRange(event)}</p>
                                      <p className="shrink-0 text-sm font-semibold text-text">
                                        {upcomingClass || marked ? `${present} / ${total}` : total}
                                      </p>
                                    </div>
                                    <p className="mt-0.5 font-semibold text-text">{event.groupName}</p>
                                    <p className="text-sm text-text-secondary">{event.location || 'Зал клуба'}</p>
                                    <div className="mt-3">
                                      <div
                                        className="h-1.5 overflow-hidden rounded-full bg-[#e7f6ee]"
                                        role="progressbar"
                                        aria-valuenow={percent}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-label={
                                          upcomingClass
                                            ? `Будут ${present} из ${total} по ответам родителей`
                                            : marked
                                              ? `Присутствуют ${present} из ${total}`
                                              : 'Посещаемость не отмечена'
                                        }
                                      >
                                        <div className="h-full rounded-full bg-[#3dae6b]" style={{ width: `${percent}%` }} />
                                      </div>
                                      <p className="mt-1.5 text-xs text-text-muted">
                                        {upcomingClass ? 'будут (родители)' : marked ? 'присутствуют' : 'ещё не отмечено'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="mt-8" aria-labelledby="attention-title">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="attention-title" className="font-display text-base font-semibold tracking-tight text-text">
                Что требует внимания
              </h2>
              <Link to="/coach/attendance" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-text-secondary">
                Все
                <IconArrowRight size={14} />
              </Link>
            </div>
            <ul className="space-y-2">
              {pendingPayments > 0 && (
                <li>
                  <button
                    type="button"
                    onClick={() => void sendReminders()}
                    className="panel flex w-full items-center gap-3 py-3 text-left"
                  >
                    <span className="flex size-10 items-center justify-center rounded-xl bg-[#fde8e8] text-[#d94b55]">
                      <IconClipboard size={18} />
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-medium text-text">
                      {pendingPayments} {plural(pendingPayments, 'задолженность', 'задолженности', 'задолженностей')}
                    </span>
                    <IconArrowRight size={16} className="text-text-muted" />
                  </button>
                </li>
              )}
              {unmarkedStudents > 0 && (
                <li>
                  <Link
                    to="/coach/attendance"
                    className="panel flex items-center gap-3 py-3"
                  >
                    <span className="flex size-10 items-center justify-center rounded-xl bg-[#fff4d6] text-[#b8860b]">
                      <IconUsers size={18} />
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-medium text-text">
                      {unmarkedStudents}{' '}
                      {plural(unmarkedStudents, 'спортсмен не отметился', 'спортсмена не отметились', 'спортсменов не отметились')}
                    </span>
                    <IconArrowRight size={16} className="text-text-muted" />
                  </Link>
                </li>
              )}
              {pendingRsvps > 0 && (
                <li>
                  <Link
                    to="/coach/competitions"
                    className="panel flex items-center gap-3 py-3"
                  >
                    <span className="flex size-10 items-center justify-center rounded-xl bg-[#dbe7fb] text-[#1d4e89]">
                      <IconTrophy size={18} />
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-medium text-text">
                      {pendingRsvps} {plural(pendingRsvps, 'заявка ожидает подтверждения', 'заявки ожидают подтверждения', 'заявок ожидают подтверждения')}
                    </span>
                    <IconArrowRight size={16} className="text-text-muted" />
                  </Link>
                </li>
              )}
              {pendingPayments === 0 && unmarkedStudents === 0 && pendingRsvps === 0 && (
                <li className="rounded-[1.25rem] border border-white/80 bg-white px-4 py-4 text-sm text-text-secondary shadow-[var(--shadow-card)]">
                  Сейчас всё спокойно
                </li>
              )}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
