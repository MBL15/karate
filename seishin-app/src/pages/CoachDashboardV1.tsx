import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ComponentType } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { coachApi } from '../api/coach'
import type {
  ClassEvent,
  CoachDashboard as CoachDashboardData,
  Competition,
  ScheduleSlot,
  SessionAttendance,
  StudentSummary,
} from '../api/types'
import { ApiError } from '../api/client'
import { LogoutButton } from '../components/auth/LogoutButton'
import { CoachError, CoachLoading } from '../components/coach/CoachScreenState'
import { CoachSetupCard } from '../components/coach/CoachSetupCard'
import { useCoachCreate } from '../components/coach/coachCreateContext'
import { GroupQuickSheet } from '../components/coach/GroupQuickSheet'
import { ScheduleSheet } from '../components/coach/ScheduleSheet'
import { GroupSheet, type GroupTab } from '../components/coach/home/GroupSheet'
import { GroupsTab, type LastTraining } from '../components/coach/home/GroupsTab'
import { addDays, classKey, GROUP_TONES, plural, toIso } from '../components/coach/home/helpers'
import { TodayTab } from '../components/coach/home/TodayTab'
import { TrainingSheet } from '../components/coach/home/TrainingSheet'
import { WeekTab } from '../components/coach/home/WeekTab'
import { IconAward, IconCalendar, IconCheck, IconChevronRight, IconClipboard, IconTrophy, IconUsers } from '../components/ui/Icons'
import { useAuth } from '../context/AuthContext'
import { useStoredState } from '../hooks/useStoredState'
import { pendingTaskCount, TASKS_KEY, type CoachTask } from '../utils/coachTasks'
import { applyGroupEdits, EMPTY_GROUP_EDITS, GROUP_EDITS_KEY, type GroupEdits } from '../utils/groupEdits'
import { resizeImage } from '../utils/image'
import { isAutoSchedule } from '../utils/schedule'

type Range = 'groups' | 'today' | 'week'

function greeting(date: Date) {
  const hour = date.getHours()
  if (hour < 12) return 'Доброе утро'
  if (hour < 18) return 'Добрый день'
  return 'Добрый вечер'
}

type AttentionItem = {
  key: string
  label: string
  hint: string
  count: number
  icon: ComponentType<{ size?: number; className?: string }>
  tone: string
  to?: string
  onClick?: () => void
}

type GroupView = { id: number; tab: GroupTab; key: number; open: boolean }
type ScheduleState = { key: number; groupId: number | null; editSlot: ScheduleSlot | null; returnTo: number | null }

/** Прежняя главная тренера (вкладки «Группы / Сегодня / Неделя»). Не подключена к маршрутам, хранится как заготовка. */
export function CoachDashboardV1() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const openCreate = useCoachCreate()
  const [range, setRange] = useState<Range>('groups')
  const [accountOpen, setAccountOpen] = useState(false)
  const [dashboard, setDashboard] = useState<CoachDashboardData | null>(null)
  const [rawMembers, setRawMembers] = useState<Record<number, StudentSummary[]>>({})
  const [allStudents, setAllStudents] = useState<StudentSummary[]>([])
  const [classes, setClasses] = useState<ClassEvent[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [attendance, setAttendance] = useState<Record<string, SessionAttendance>>({})
  const [slots, setSlots] = useState<ScheduleSlot[]>([])
  const [lastTraining, setLastTraining] = useState<Record<number, LastTraining>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [schedule, setSchedule] = useState<ScheduleState>({ key: 0, groupId: null, editSlot: null, returnTo: null })
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [createSheet, setCreateSheet] = useState({ key: 0, open: false })
  const [groupView, setGroupView] = useState<GroupView | null>(null)
  const [training, setTraining] = useState<ClassEvent | null>(null)
  const [scheduleReviewed, setScheduleReviewed] = useStoredState('schedule-reviewed', false)
  const [removingAuto, setRemovingAuto] = useState(false)
  const [photo, setPhoto] = useStoredState<string | null>('coach-photo', null)
  const [edits, setEdits] = useStoredState<GroupEdits>(GROUP_EDITS_KEY, EMPTY_GROUP_EDITS)
  const [tasks] = useStoredState<CoachTask[]>(TASKS_KEY, [])
  const fileRef = useRef<HTMLInputElement>(null)

  const today = useMemo(() => new Date(), [])
  const todayIso = toIso(today)
  const weekEnd = toIso(addDays(today, 6))
  const pastFrom = toIso(addDays(today, -42))

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const [dash, clubClasses, clubSchedule, comps, students] = await Promise.all([
        coachApi.dashboard(),
        coachApi.classes(pastFrom, weekEnd).catch(() => [] as ClassEvent[]),
        coachApi.schedule().catch(() => [] as ScheduleSlot[]),
        coachApi.competitions().catch(() => [] as Competition[]),
        coachApi.students().catch(() => [] as StudentSummary[]),
      ])
      const own = new Set((dash.groups ?? []).map((g) => g.id))
      const ownClasses = clubClasses.filter((event) => own.has(event.groupId))
      setDashboard(dash)
      setClasses(ownClasses)
      setSlots(clubSchedule)
      setCompetitions(comps)
      setAllStudents(students)

      const latest = new Map<number, ClassEvent>()
      for (const event of ownClasses) {
        if (event.upcoming || event.date > todayIso) continue
        const prev = latest.get(event.groupId)
        if (!prev || `${event.date}${event.startTime}` > `${prev.date}${prev.startTime}`) latest.set(event.groupId, event)
      }
      const todayClasses = ownClasses.filter((event) => event.date === todayIso)
      const [memberEntries, sessions, lastSessions] = await Promise.all([
        Promise.all((dash.groups ?? []).map(async (g) => [g.id, await coachApi.groupStudents(g.id).catch(() => [] as StudentSummary[])] as const)),
        Promise.all(
          todayClasses.map(async (event) => [classKey(event), await coachApi.getAttendance(event.groupId, event.date, event.startTime).catch(() => null)] as const),
        ),
        Promise.all(
          [...latest.values()].map(async (event) => {
            const session = await coachApi.getAttendance(event.groupId, event.date, event.startTime).catch(() => null)
            return [event.groupId, { event, session }] as const
          }),
        ),
      ])
      setRawMembers(Object.fromEntries(memberEntries))
      setAttendance(Object.fromEntries(sessions.filter((entry): entry is readonly [string, SessionAttendance] => entry[1] != null)))
      setLastTraining(Object.fromEntries(lastSessions))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [todayIso, weekEnd, pastFrom])

  useEffect(() => {
    void load()
  }, [load])

  const { groups, members, pool } = useMemo(
    () => applyGroupEdits(dashboard?.groups ?? [], rawMembers, edits, allStudents),
    [dashboard, rawMembers, edits, allStudents],
  )

  const groupOf = useMemo(() => {
    const map = new Map<number, string>()
    for (const g of groups) for (const s of members[g.id]) map.set(s.id, g.name)
    return map
  }, [groups, members])

  const visibleClasses = useMemo(() => {
    const ids = new Set(groups.map((g) => g.id))
    return classes.filter((event) => ids.has(event.groupId))
  }, [classes, groups])

  const todayClasses = visibleClasses.filter((event) => event.date === todayIso)
  const weekClasses = visibleClasses.filter((event) => event.date >= todayIso && event.date <= weekEnd)
  const nextEvent = weekClasses.find((event) => event.date > todayIso) ?? null

  const refreshTraining = async (event: ClassEvent) => {
    const session = await coachApi.getAttendance(event.groupId, event.date, event.startTime).catch(() => null)
    if (!session) return
    setAttendance((map) => ({ ...map, [classKey(event)]: session }))
    setLastTraining((map) => {
      const current = map[event.groupId]
      if (event.upcoming || (current && `${current.event.date}${current.event.startTime}` > `${event.date}${event.startTime}`)) return map
      return { ...map, [event.groupId]: { event, session } }
    })
  }

  const setMembers = (next: Record<number, number[]>) => setEdits((e) => ({ ...e, members: { ...e.members, ...next } }))

  const removeFrom = (groupId: number, studentId: number) =>
    setMembers({ [groupId]: members[groupId].filter((s) => s.id !== studentId).map((s) => s.id) })

  const addTo = (groupId: number, studentId: number) => {
    const next: Record<number, number[]> = {}
    for (const g of groups) {
      if (g.id !== groupId && members[g.id].some((s) => s.id === studentId)) {
        next[g.id] = members[g.id].filter((s) => s.id !== studentId).map((s) => s.id)
      }
    }
    next[groupId] = [...members[groupId].map((s) => s.id), studentId]
    setMembers(next)
  }

  const deleteGroup = (groupId: number) => {
    const name = groups.find((g) => g.id === groupId)?.name
    setEdits((e) => {
      const rest = { ...e.members }
      delete rest[groupId]
      return { hidden: [...e.hidden, groupId], members: rest }
    })
    setGroupView(null)
    setNotice(`Группа «${name ?? ''}» удалена`)
  }

  const pendingPayments = dashboard?.pendingPayments ?? 0
  const pendingRsvps = dashboard?.pendingCompetitionRsvps ?? 0
  const birthdays = dashboard?.upcomingBirthdays ?? 0
  const fullName = user?.name || 'Тренер'
  const initials = fullName
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
  const dueTasks = pendingTaskCount(tasks)
  const unscheduled = groups.filter((g) => !slots.some((s) => s.groupId === g.id))
  const ownSlots = slots.filter((s) => groups.some((g) => g.id === s.groupId))
  const autoSchedule = !scheduleReviewed && isAutoSchedule(ownSlots)
  const showSetup = Boolean(dashboard) && (groups.length === 0 || unscheduled.length > 0 || autoSchedule || (dashboard?.totalStudents ?? 0) === 0)
  const unmarkedTrainings = todayClasses.filter((event) => !event.upcoming && !attendance[classKey(event)]?.sessionId).length

  const openCreateGroups = () => setCreateSheet({ key: Date.now(), open: true })

  const openGroup = (id: number, tab: GroupTab = 'stats') => setGroupView({ id, tab, key: Date.now(), open: true })

  const closeGroup = () => setGroupView((view) => (view ? { ...view, open: false } : view))

  const openSchedule = (groupId: number | null = null, editSlot: ScheduleSlot | null = null, returnTo: number | null = null) => {
    if (groups.length === 0) {
      openCreateGroups()
      return
    }
    setSchedule({ key: Date.now(), groupId, editSlot, returnTo })
    setScheduleOpen(true)
  }

  const closeSchedule = () => {
    setScheduleOpen(false)
    if (schedule.returnTo != null) openGroup(schedule.returnTo, 'schedule')
  }

  const removeAutoSchedule = async () => {
    setRemovingAuto(true)
    try {
      for (const slot of ownSlots) await coachApi.deleteSchedule(slot.id)
      setScheduleReviewed(true)
      setNotice('Пример убран — поставьте своё расписание для каждой группы')
      await load(true)
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : 'Не удалось убрать пример')
    } finally {
      setRemovingAuto(false)
    }
  }

  const sendReminders = async () => {
    try {
      const res = await coachApi.sendPaymentReminders()
      setNotice(`Отправлено напоминаний: ${res.length}`)
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : 'Не удалось отправить напоминания')
    }
  }

  const copyCode = async () => {
    if (!dashboard?.joinCode) return
    await navigator.clipboard.writeText(dashboard.joinCode).catch(() => undefined)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  const onPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    setAccountOpen(false)
    if (!file) return
    const data = await resizeImage(file, 320, true).catch(() => null)
    if (data) setPhoto(data)
  }

  const attention: AttentionItem[] = [
    {
      key: 'unmarked',
      label: plural(unmarkedTrainings, 'Тренировка не отмечена', 'Тренировки не отмечены', 'Тренировок не отмечено'),
      hint: 'Отметьте, кто пришёл сегодня',
      count: unmarkedTrainings,
      icon: IconUsers,
      tone: 'bg-[#fff4e0] text-[#d97706]',
      onClick: () => setRange('today'),
    },
    {
      key: 'payments',
      label: 'Задолженности по оплате',
      hint: 'Нажмите, чтобы напомнить родителям',
      count: pendingPayments,
      icon: IconClipboard,
      tone: 'bg-[#fde8e8] text-[#d94b55]',
      onClick: () => void sendReminders(),
    },
    {
      key: 'rsvps',
      label: plural(pendingRsvps, 'Заявка ждёт подтверждения', 'Заявки ждут подтверждения', 'Заявок ждут подтверждения'),
      hint: 'Турниры и аттестации',
      count: pendingRsvps,
      icon: IconTrophy,
      tone: 'bg-brand-blue-light text-brand-blue',
      to: '/coach/competitions',
    },
    {
      key: 'unscheduled',
      label: plural(unscheduled.length, 'Группа без расписания', 'Группы без расписания', 'Групп без расписания'),
      hint: unscheduled.map((g) => g.name).join(', '),
      count: unscheduled.length,
      icon: IconCalendar,
      tone: 'bg-[#eaf1fe] text-[#1d4e89]',
      onClick: () => unscheduled[0] && openGroup(unscheduled[0].id, 'schedule'),
    },
    {
      key: 'tasks',
      label: 'Задачи на сегодня',
      hint: 'Из чек-листа тренера',
      count: dueTasks,
      icon: IconCheck,
      tone: 'bg-[#f3e8ff] text-[#7c3aed]',
      to: '/coach/tools/checklists',
    },
    {
      key: 'birthdays',
      label: plural(birthdays, 'День рождения скоро', 'Дня рождения скоро', 'Дней рождения скоро'),
      hint: 'Не забудьте поздравить',
      count: birthdays,
      icon: IconAward,
      tone: 'bg-brand-green-light text-brand-green',
      to: '/coach/students',
    },
  ].filter((item) => item.count > 0 && !(showSetup && item.key === 'unscheduled'))

  const viewGroup = groupView ? groups.find((g) => g.id === groupView.id) : undefined
  const viewIndex = viewGroup ? groups.indexOf(viewGroup) : 0
  const todayBadge = todayClasses.length

  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-6 pt-[max(1.5rem,var(--safe-top-effective))] lg:max-w-3xl lg:px-8 lg:pt-8">
      <header className="relative rounded-[1.75rem] bg-white p-4 shadow-[var(--shadow-card)]">
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.75rem]" aria-hidden>
          <span className="absolute -top-16 -right-12 size-44 rounded-full bg-brand-blue-light/70" />
        </span>
        <div className="relative flex items-center gap-4">
          <div className="relative shrink-0">
            <button
              type="button"
              aria-expanded={accountOpen}
              aria-haspopup="menu"
              aria-label="Фото и аккаунт"
              onClick={() => setAccountOpen((open) => !open)}
              className="group relative flex size-[4.5rem] items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] font-display text-2xl font-semibold text-white shadow-[var(--shadow-blue)] ring-4 ring-white transition active:scale-95"
            >
              {photo ? <img src={photo} alt="" className="size-full object-cover" /> : initials}
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label={photo ? 'Сменить фото' : 'Загрузить фото'}
              className="absolute -right-0.5 -bottom-0.5 flex size-7 items-center justify-center rounded-full border-2 border-white bg-brand-blue text-white shadow-md transition active:scale-90"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onPhoto(e)} />
            {accountOpen && <div className="fixed inset-0 z-10" onClick={() => setAccountOpen(false)} aria-hidden />}
            {accountOpen && (
              <div role="menu" className="pop-in absolute top-full left-0 z-20 mt-2 w-56 rounded-2xl border border-border-light bg-white p-2 shadow-[var(--shadow-elevated)]">
                <p className="px-2 pt-1 text-sm font-semibold text-text">{fullName}</p>
                <p className="px-2 text-xs text-text-secondary">Главный тренер</p>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => fileRef.current?.click()}
                  className="mt-2 flex min-h-10 w-full items-center rounded-xl px-2 text-left text-sm font-medium text-text hover:bg-surface-muted"
                >
                  {photo ? 'Сменить фото' : 'Загрузить фото'}
                </button>
                {photo && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setPhoto(null)
                      setAccountOpen(false)
                    }}
                    className="flex min-h-10 w-full items-center rounded-xl px-2 text-left text-sm font-medium text-error hover:bg-error-bg"
                  >
                    Убрать фото
                  </button>
                )}
                <div className="my-1 h-px bg-border-light" />
                <LogoutButton variant="menu" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-secondary">{greeting(today)},</p>
            <h1 className="mt-0.5 font-display text-[1.45rem] leading-tight font-bold tracking-tight text-text">{fullName}</h1>
            <p className="mt-1 flex items-center gap-1.5 truncate text-[13px] text-text-secondary">
              <span className="size-1.5 shrink-0 rounded-full bg-brand-green" aria-hidden />
              Главный тренер{dashboard?.clubName ? ` · ${dashboard.clubName}` : ''}
            </p>
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-surface-muted px-3 py-2.5">
            <p className="text-lg leading-none font-bold text-text tabular-nums">{dashboard?.totalStudents ?? '—'}</p>
            <p className="mt-1 text-[11px] text-text-secondary">{plural(dashboard?.totalStudents ?? 0, 'ученик', 'ученика', 'учеников')}</p>
          </div>
          <div className="rounded-2xl bg-surface-muted px-3 py-2.5">
            <p className="text-lg leading-none font-bold text-text tabular-nums">{groups.length || (dashboard ? 0 : '—')}</p>
            <p className="mt-1 text-[11px] text-text-secondary">{plural(groups.length, 'группа', 'группы', 'групп')}</p>
          </div>
          <button
            type="button"
            onClick={() => void copyCode()}
            disabled={!dashboard?.joinCode}
            className="rounded-2xl bg-brand-blue-light px-3 py-2.5 text-left transition active:scale-95"
          >
            <p className="font-mono text-lg leading-none font-bold tracking-[0.12em] text-brand-blue">{dashboard?.joinCode ?? '····'}</p>
            <p className="mt-1 text-[11px] text-brand-blue/80">{copied ? 'Скопировано' : 'код клуба'}</p>
          </button>
        </div>
      </header>

      {showSetup && dashboard && (
        <CoachSetupCard
          groups={groups}
          totalStudents={dashboard.totalStudents}
          slots={ownSlots}
          autoSchedule={autoSchedule}
          busy={removingAuto}
          onCreateGroups={openCreateGroups}
          onInvite={() => openCreate('invite')}
          onSchedule={(groupId) => openSchedule(groupId ?? null)}
          onKeepAuto={() => {
            setScheduleReviewed(true)
            setNotice('Расписание подтверждено. Изменить его можно в карточке группы или в календаре')
          }}
          onRemoveAuto={() => void removeAutoSchedule()}
        />
      )}

      <div className="mt-5 grid grid-cols-3 rounded-full bg-surface-subtle p-1" role="tablist" aria-label="Разделы главной">
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
            className={`relative min-h-10 cursor-pointer rounded-full text-sm font-semibold transition duration-200 ${
              range === id ? 'bg-brand-blue text-white shadow-[var(--shadow-blue)]' : 'text-text-secondary hover:text-text'
            }`}
          >
            {label}
            {id === 'today' && todayBadge > 0 && (
              <span
                className={`ml-1.5 inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold tabular-nums ${
                  range === id ? 'bg-white/25 text-white' : 'bg-brand-blue text-white'
                }`}
              >
                {todayBadge}
              </span>
            )}
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

          {range === 'groups' && (
            <GroupsTab
              groups={groups}
              members={members}
              slots={slots}
              lastTraining={lastTraining}
              onOpenGroup={openGroup}
              onCreateGroup={openCreateGroups}
            />
          )}
          {range === 'today' && (
            <TodayTab
              now={today}
              classes={todayClasses}
              attendance={attendance}
              memberCount={(groupId) => members[groupId]?.length ?? 0}
              nextEvent={nextEvent}
              onOpen={setTraining}
              onSchedule={() => openSchedule()}
            />
          )}
          {range === 'week' && (
            <WeekTab
              today={today}
              classes={weekClasses}
              competitions={competitions}
              tasks={tasks}
              onOpenTraining={setTraining}
              onSchedule={() => openSchedule()}
            />
          )}

          <section className="mt-8" aria-labelledby="attention-title">
            <h2 id="attention-title" className="mb-3 font-display text-base font-semibold tracking-tight text-text">
              Что требует внимания
            </h2>
            {attention.length === 0 ? (
              <div className="flex items-center gap-3 rounded-3xl bg-white px-4 py-4 shadow-[var(--shadow-card)]">
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-green-light text-brand-green">
                  <IconCheck size={18} />
                </span>
                <span className="text-sm text-text-secondary">Сейчас всё спокойно — важных дел нет</span>
              </div>
            ) : (
              <ul className="tool-stagger overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-card)]">
                {attention.map((item) => {
                  const Icon = item.icon
                  const content = (
                    <>
                      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${item.tone}`}>
                        <Icon size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-text">{item.label}</span>
                        {item.hint && <span className="block truncate text-xs text-text-secondary">{item.hint}</span>}
                      </span>
                      <span className="text-base font-bold text-text tabular-nums">{item.count}</span>
                      <IconChevronRight size={16} className="text-text-muted" />
                    </>
                  )
                  const cls = 'flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-muted active:bg-surface-muted'
                  return (
                    <li key={item.key} className="border-b border-border-light last:border-b-0">
                      {item.to ? (
                        <Link to={item.to} className={cls}>
                          {content}
                        </Link>
                      ) : (
                        <button type="button" onClick={item.onClick} className={cls}>
                          {content}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      )}

      {groupView && viewGroup && (
        <GroupSheet
          key={groupView.key}
          open={groupView.open}
          group={viewGroup}
          tone={GROUP_TONES[viewIndex % GROUP_TONES.length]}
          initialTab={groupView.tab}
          members={members[viewGroup.id] ?? []}
          pool={[...pool.values()]}
          groupOf={groupOf}
          slots={slots.filter((s) => s.groupId === viewGroup.id)}
          pastClasses={visibleClasses
            .filter((e) => e.groupId === viewGroup.id && !e.upcoming && e.date <= todayIso)
            .sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`))}
          onClose={closeGroup}
          onAdd={(id) => addTo(viewGroup.id, id)}
          onRemove={(id) => removeFrom(viewGroup.id, id)}
          onEditSlot={(slot) => {
            closeGroup()
            openSchedule(viewGroup.id, slot, viewGroup.id)
          }}
          onDelete={() => deleteGroup(viewGroup.id)}
          onOpenTraining={(event) => {
            closeGroup()
            setTraining(event)
          }}
          onNewStudent={() => navigate('/coach/students?add=student')}
        />
      )}

      {training && (
        <TrainingSheet
          key={classKey(training)}
          event={training}
          members={members[training.groupId] ?? []}
          onClose={() => setTraining(null)}
          onSaved={(message) => {
            setNotice(message)
            void refreshTraining(training)
          }}
        />
      )}

      <ScheduleSheet
        key={schedule.key}
        open={scheduleOpen}
        groups={groups}
        slots={slots}
        initialGroupId={schedule.groupId}
        editSlot={schedule.editSlot}
        onClose={closeSchedule}
        onChanged={(message, close) => {
          setNotice(message)
          setScheduleReviewed(true)
          if (close) closeSchedule()
          void load(true)
        }}
      />
      <GroupQuickSheet
        key={createSheet.key}
        open={createSheet.open}
        groups={dashboard?.groups ?? []}
        onClose={() => setCreateSheet((s) => ({ ...s, open: false }))}
        onCreated={() => void load(true)}
      />
    </div>
  )
}
