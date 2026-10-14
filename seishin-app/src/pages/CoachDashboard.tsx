import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ComponentType } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { coachApi } from '../api/coach'
import type {
  ClassEvent,
  CoachDashboard as CoachDashboardData,
  Competition,
  Payment,
  ScheduleSlot,
  SessionAttendance,
  StudentSummary,
} from '../api/types'
import { ApiError } from '../api/client'
import { CoachError, CoachLoading } from '../components/coach/CoachScreenState'
import { CoachSetupCard } from '../components/coach/CoachSetupCard'
import { useCoachCreate } from '../components/coach/coachCreateContext'
import { GroupQuickSheet } from '../components/coach/GroupQuickSheet'
import { ScheduleSheet } from '../components/coach/ScheduleSheet'
import { CoachHeroCard } from '../components/coach/home/CoachHeroCard'
import { GroupSheet, type GroupTab } from '../components/coach/home/GroupSheet'
import { MissingSheet, type MissingStudent } from '../components/coach/home/MissingSheet'
import {
  addDays,
  classKey,
  GROUP_TONES,
  MARKS_KEY,
  markOf,
  monthLabel,
  PAID_KEY,
  paidKey,
  plural,
  shortDate,
  summarizeAttendance,
  toIso,
  type AttendanceSummary,
  type LocalMarks,
  type PaidMonths,
} from '../components/coach/home/helpers'
import { ScheduleBoard } from '../components/coach/home/ScheduleBoard'
import { StatsCard } from '../components/coach/home/StatsCard'
import { TrainingSheet } from '../components/coach/home/TrainingSheet'
import { TrainingsBoard, type TrainingTab } from '../components/coach/home/TrainingsBoard'
import { IconAward, IconCalendar, IconCheck, IconChevronRight, IconClipboard, IconTrophy, IconUsers } from '../components/ui/Icons'
import { useAuth } from '../context/AuthContext'
import { useStoredState } from '../hooks/useStoredState'
import { pendingTaskCount, TASKS_KEY, type CoachTask } from '../utils/coachTasks'
import { applyGroupEdits, EMPTY_GROUP_EDITS, GROUP_EDITS_KEY, type GroupEdits } from '../utils/groupEdits'
import { PhotoCrop } from '../components/ui/PhotoCrop'
import { isAutoSchedule } from '../utils/schedule'
import { dropAutoSchedule } from '../api/autoSchedule'

const STATS_DAYS = 30
const STRIP_BACK = 7
const STRIP_AHEAD = 7

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
type TrainingView = { event: ClassEvent; tab: TrainingTab }

export function CoachDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const openCreate = useCoachCreate()
  const [dashboard, setDashboard] = useState<CoachDashboardData | null>(null)
  const [rawMembers, setRawMembers] = useState<Record<number, StudentSummary[]>>({})
  const [allStudents, setAllStudents] = useState<StudentSummary[]>([])
  const [classes, setClasses] = useState<ClassEvent[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [attendance, setAttendance] = useState<Record<string, SessionAttendance>>({})
  const [slots, setSlots] = useState<ScheduleSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [schedule, setSchedule] = useState<ScheduleState>({ key: 0, groupId: null, editSlot: null, returnTo: null })
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [createSheet, setCreateSheet] = useState({ key: 0, open: false })
  const [groupView, setGroupView] = useState<GroupView | null>(null)
  const [training, setTraining] = useState<TrainingView | null>(null)
  const [missingSheet, setMissingSheet] = useState({ key: 0, open: false })
  const [scheduleReviewed, setScheduleReviewed] = useStoredState('schedule-reviewed', false)
  const reviewedRef = useRef(scheduleReviewed)
  reviewedRef.current = scheduleReviewed
  const [removingAuto, setRemovingAuto] = useState(false)
  const [photo, setPhoto] = useStoredState<string | null>('coach-photo', null)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [edits, setEdits] = useStoredState<GroupEdits>(GROUP_EDITS_KEY, EMPTY_GROUP_EDITS)
  const [localMarks] = useStoredState<LocalMarks>(MARKS_KEY, {})
  const [paid] = useStoredState<PaidMonths>(PAID_KEY, {})
  const [tasks] = useStoredState<CoachTask[]>(TASKS_KEY, [])
  const [serverPayments, setServerPayments] = useState<Payment[]>([])

  const today = useMemo(() => new Date(), [])
  const todayIso = toIso(today)
  const [coachSince, setCoachSince] = useStoredState('coach-since', todayIso)

  useEffect(() => {
    setCoachSince((value) => value)
  }, [setCoachSince])
  const [selectedDay, setSelectedDay] = useState(todayIso)
  const rangeFrom = toIso(addDays(today, -Math.max(STATS_DAYS, STRIP_BACK)))
  const rangeTo = toIso(addDays(today, STRIP_AHEAD))
  const stripDays = useMemo(() => Array.from({ length: STRIP_BACK + STRIP_AHEAD + 1 }, (_, i) => toIso(addDays(today, i - STRIP_BACK))), [today])

  const load = useCallback(
    async (silent = false, checkAuto = true): Promise<void> => {
      if (!silent) setLoading(true)
      setError(null)
      try {
        const [dash, clubClasses, clubSchedule, comps, students, payments] = await Promise.all([
          coachApi.dashboard(),
          coachApi.classes(rangeFrom, rangeTo).catch(() => [] as ClassEvent[]),
          coachApi.schedule().catch(() => [] as ScheduleSlot[]),
          coachApi.competitions().catch(() => [] as Competition[]),
          coachApi.students().catch(() => [] as StudentSummary[]),
          coachApi.payments().catch(() => [] as Payment[]),
        ])
        setServerPayments(payments)
        const own = new Set((dash.groups ?? []).map((g) => g.id))
        if (checkAuto && (await dropAutoSchedule(clubSchedule, own, reviewedRef.current))) return load(silent, false)
        const ownClasses = clubClasses.filter((event) => own.has(event.groupId))
        setDashboard(dash)
        setClasses(ownClasses)
        setSlots(clubSchedule)
        setCompetitions(comps)
        setAllStudents(students)

        const tracked = ownClasses.filter((event) => !event.upcoming || event.date === todayIso)
        const [memberEntries, sessions] = await Promise.all([
          Promise.all((dash.groups ?? []).map(async (g) => [g.id, await coachApi.groupStudents(g.id).catch(() => [] as StudentSummary[])] as const)),
          Promise.all(
            tracked.map(async (event) => [classKey(event), await coachApi.getAttendance(event.groupId, event.date, event.startTime).catch(() => null)] as const),
          ),
        ])
        setRawMembers(Object.fromEntries(memberEntries))
        setAttendance(Object.fromEntries(sessions.filter((entry): entry is readonly [string, SessionAttendance] => entry[1] != null)))
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Ошибка загрузки')
      } finally {
        setLoading(false)
      }
    },
    [rangeFrom, rangeTo, todayIso],
  )

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

  const summaries = useMemo(() => {
    const map: Record<string, AttendanceSummary> = {}
    for (const event of visibleClasses) {
      const key = classKey(event)
      map[key] = summarizeAttendance(
        attendance[key],
        localMarks[key],
        (members[event.groupId] ?? []).map((s) => s.id),
      )
    }
    return map
  }, [visibleClasses, attendance, localMarks, members])
  const refreshTraining = async (event: ClassEvent) => {
    const session = await coachApi.getAttendance(event.groupId, event.date, event.startTime).catch(() => null)
    if (session) setAttendance((map) => ({ ...map, [classKey(event)]: session }))
  }

  const setMembers = (next: Record<number, number[]>) => setEdits((e) => ({ ...e, members: { ...e.members, ...next } }))

  const removeFrom = (groupId: number, studentId: number) =>
    setMembers({ [groupId]: members[groupId].filter((s) => s.id !== studentId).map((s) => s.id) })

  const addTo = (groupId: number, studentId: number) => {
    void (async () => {
      try {
        if (groupOf.has(studentId)) return
        await coachApi.addStudentToGroup(groupId, studentId)
        const next: Record<number, number[]> = {
          [groupId]: [...members[groupId].map((s) => s.id).filter((id) => id !== studentId), studentId],
        }
        setMembers(next)
        await load()
      } catch (e) {
        setNotice(e instanceof ApiError ? e.message : 'Не удалось добавить в группу')
      }
    })()
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

  const todayClasses = visibleClasses.filter((event) => event.date === todayIso)
  const weekAgo = toIso(addDays(today, -6))
  const unmarked = visibleClasses
    .filter((event) => !event.upcoming && event.date >= weekAgo && event.date >= coachSince && !summaries[classKey(event)]?.marked)
    .sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`))
  const waitingParents = todayClasses.filter((event) => {
    if (!event.upcoming) return false
    const session = attendance[classKey(event)]
    return Boolean(session?.entries.some((e) => !e.parentIntent || e.parentIntent === 'PENDING'))
  })
  const soonLimit = toIso(addDays(today, 30))
  const soonCompetitions = competitions
    .filter((c) => c.eventDate >= todayIso && c.eventDate <= soonLimit)
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
  const nextCompetition = soonCompetitions[0]
  const competitionHint = (() => {
    if (!nextCompetition) return ''
    const days = Math.round((new Date(`${nextCompetition.eventDate}T12:00:00`).getTime() - new Date(`${todayIso}T12:00:00`).getTime()) / 86400000)
    const when = days === 0 ? 'сегодня' : days === 1 ? 'завтра' : `через ${days} ${plural(days, 'день', 'дня', 'дней')}`
    const rest = soonCompetitions.length > 1 ? ` · и ещё ${soonCompetitions.length - 1}` : ''
    return `${nextCompetition.name} — ${when}, ${shortDate(nextCompetition.eventDate)}${rest}`
  })()

  const missing = useMemo(() => {
    const list: MissingStudent[] = []
    for (const g of groups) {
      const past = visibleClasses
        .filter((e) => e.groupId === g.id && !e.upcoming && summaries[classKey(e)]?.marked)
        .sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`))
      for (const s of members[g.id] ?? []) {
        let streak = 0
        for (const e of past) {
          const key = classKey(e)
          const mark = markOf(attendance[key], localMarks[key], s.id)
          if (mark === 'ABSENT') streak++
          else if (mark === 'PRESENT') break
        }
        if (streak >= 2) list.push({ student: s, groupId: g.id, groupName: g.name, streak })
      }
    }
    return list.sort((a, b) => b.streak - a.streak)
  }, [groups, members, visibleClasses, summaries, attendance, localMarks])

  const month = todayIso.slice(0, 7)
  const paidOnServer = new Set(
    serverPayments.filter((p) => p.status === 'PAID' && p.dueDate?.slice(0, 7) === month).map((p) => p.studentId),
  )
  const unpaid = groups.flatMap((g) =>
    (members[g.id] ?? []).filter((s) => !paid[paidKey(s.id, month)] && !paidOnServer.has(s.id)).map((s) => ({ groupId: g.id, student: s })),
  )
  const unpaidTraining = (() => {
    for (const groupId of new Set(unpaid.map((u) => u.groupId))) {
      const own = visibleClasses.filter((e) => e.groupId === groupId)
      const pick = own.filter((e) => e.date <= todayIso).at(-1) ?? own[0]
      if (pick) return pick
    }
    return null
  })()
  const pendingRsvps = competitions
    .filter((c) => c.eventDate >= todayIso)
    .reduce((sum, c) => sum + c.registrations.filter((r) => r.rsvpStatus === 'PENDING').length, 0)
  const birthdays = dashboard?.upcomingBirthdays ?? 0
  const fullName = user?.name || 'Тренер'
  const dueTasks = pendingTaskCount(tasks)
  const unscheduled = groups.filter((g) => !slots.some((s) => s.groupId === g.id))
  const emptyGroups = groups.filter((g) => (members[g.id] ?? []).length === 0)
  const withoutGroup = groups.length ? [...pool.values()].filter((s) => !groupOf.has(s.id) && !s.guest) : []
  const ownSlots = slots.filter((s) => groups.some((g) => g.id === s.groupId))
  const autoSchedule = !scheduleReviewed && isAutoSchedule(ownSlots)
  const showSetup = Boolean(dashboard) && (groups.length === 0 || unscheduled.length > 0 || autoSchedule || (dashboard?.totalStudents ?? 0) === 0)

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

  const openTraining = (event: ClassEvent, tab: TrainingTab = 'marks') => setTraining({ event, tab })

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

  const onPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) setCropFile(file)
  }

  const attention: AttentionItem[] = [
    {
      key: 'unmarked',
      label: plural(unmarked.length, 'Тренировка без отметок', 'Тренировки без отметок', 'Тренировок без отметок'),
      hint: unmarked[0] ? `За последнюю неделю · ближайшая: ${unmarked[0].groupName}` : '',
      count: unmarked.length,
      icon: IconUsers,
      tone: 'bg-[#fff4e0] text-[#d97706]',
      onClick: () => unmarked[0] && openTraining(unmarked[0], 'marks'),
    },
    {
      key: 'payments',
      label: `Оплата за ${monthLabel(month).split(' ')[0].toLowerCase()} не отмечена`,
      hint: unpaid
        .slice(0, 3)
        .map((u) => `${u.student.firstName} ${u.student.lastName}`)
        .join(', '),
      count: unpaidTraining ? unpaid.length : 0,
      icon: IconClipboard,
      tone: 'bg-[#fde8e8] text-[#d94b55]',
      onClick: () => unpaidTraining && openTraining(unpaidTraining, 'month'),
    },
    {
      key: 'missing',
      label: plural(missing.length, 'Ученик пропускает тренировки', 'Ученика пропускают тренировки', 'Учеников пропускают тренировки'),
      hint: missing
        .slice(0, 3)
        .map((m) => `${m.student.firstName} ${m.student.lastName[0] ?? ''}. — ${m.streak} подряд`)
        .join(', '),
      count: missing.length,
      icon: IconUsers,
      tone: 'bg-[#fff1f2] text-[#e11d48]',
      onClick: () => setMissingSheet({ key: Date.now(), open: true }),
    },
    {
      key: 'competitions',
      label: soonCompetitions.length > 1 ? 'Скоро соревнования' : 'Скоро соревнование',
      hint: competitionHint,
      count: soonCompetitions.length,
      icon: IconTrophy,
      tone: 'bg-[#fff4e0] text-[#d97706]',
      to: '/coach/competitions',
    },
    {
      key: 'parents',
      label: 'Родители не ответили',
      hint: `Про сегодняшние тренировки: ${waitingParents.map((e) => e.groupName).join(', ')}`,
      count: waitingParents.length,
      icon: IconUsers,
      tone: 'bg-brand-blue-light text-brand-blue',
      onClick: () => waitingParents[0] && openTraining(waitingParents[0], 'marks'),
    },
    {
      key: 'unscheduled',
      label: plural(unscheduled.length, 'Группа без расписания', 'Группы без расписания', 'Групп без расписания'),
      hint: unscheduled.map((g) => g.name).join(', '),
      count: unscheduled.length,
      icon: IconCalendar,
      tone: 'bg-[#eaf1fe] text-[#1d4e89]',
      onClick: () => unscheduled[0] && openSchedule(unscheduled[0].id),
    },
    {
      key: 'empty',
      label: plural(emptyGroups.length, 'Группа без учеников', 'Группы без учеников', 'Групп без учеников'),
      hint: emptyGroups.map((g) => g.name).join(', '),
      count: emptyGroups.length,
      icon: IconUsers,
      tone: 'bg-[#f3e8ff] text-[#7c3aed]',
      onClick: () => emptyGroups[0] && openGroup(emptyGroups[0].id, 'members'),
    },
    {
      key: 'nogroup',
      label: plural(withoutGroup.length, 'Ученик без группы', 'Ученика без группы', 'Учеников без группы'),
      hint: withoutGroup
        .slice(0, 3)
        .map((s) => `${s.firstName} ${s.lastName}`)
        .join(', '),
      count: withoutGroup.length,
      icon: IconUsers,
      tone: 'bg-[#e8f7ee] text-[#16a34a]',
      onClick: () => groups[0] && openGroup(groups[0].id, 'members'),
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
      hint: (dashboard?.birthdayStudents ?? []).map((s) => s.firstName).join(', ') || 'Не забудьте поздравить',
      count: birthdays,
      icon: IconAward,
      tone: 'bg-brand-green-light text-brand-green',
      to: '/coach/students',
    },
  ].filter((item) => item.count > 0 && !(showSetup && (item.key === 'unscheduled' || item.key === 'empty')))

  const viewGroup = groupView ? groups.find((g) => g.id === groupView.id) : undefined
  const viewIndex = viewGroup ? groups.indexOf(viewGroup) : 0
  const groupIndex = (groupId: number) => Math.max(groups.findIndex((g) => g.id === groupId), 0)

  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-6 pt-[max(1.5rem,var(--safe-top-effective))] lg:max-w-3xl lg:px-8 lg:pt-8">
      <CoachHeroCard
        now={today}
        name={fullName}
        clubName={dashboard?.clubName}
        photo={photo}
        joinCode={dashboard?.joinCode}
        onPhoto={(e) => void onPhoto(e)}
        onRemovePhoto={() => setPhoto(null)}
      />

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

          {showSetup && (
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
                setNotice('Расписание подтверждено. Изменить его можно в блоке «Расписание групп»')
              }}
              onRemoveAuto={() => void removeAutoSchedule()}
            />
          )}

          <TrainingsBoard
            now={today}
            days={stripDays}
            selected={selectedDay}
            onSelect={setSelectedDay}
            classes={visibleClasses.filter((event) => event.date >= stripDays[0])}
            summaries={summaries}
            since={coachSince}
            attendance={attendance}
            groupIndex={groupIndex}
            hasGroups={groups.length > 0}
            hasSchedule={ownSlots.length > 0}
            onOpen={openTraining}
            onSchedule={() => document.getElementById('schedule-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          />

          <StatsCard
            now={today}
            groups={groups}
            classes={visibleClasses}
            summaries={summaries}
            since={coachSince}
            onOpenTraining={(event) => openTraining(event, 'marks')}
            onOpenGroup={(id) => openGroup(id, 'stats')}
          />

          <ScheduleBoard
            groups={groups}
            slots={slots}
            memberCount={(groupId) => members[groupId]?.length ?? 0}
            todayWeekday={((today.getDay() + 6) % 7) + 1}
            onEdit={(groupId) => openSchedule(groupId)}
            onOpenMembers={(groupId) => openGroup(groupId, 'members')}
            onCreateGroup={openCreateGroups}
          />

          <section className="mt-8" aria-labelledby="attention-title">
            <h2 id="attention-title" className="mb-3 font-display text-lg font-bold tracking-tight text-text">
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

      {missingSheet.key > 0 && (
        <MissingSheet
          key={missingSheet.key}
          open={missingSheet.open}
          missing={missing}
          onClose={() => setMissingSheet((s) => ({ ...s, open: false }))}
          onOpenGroup={(groupId) => {
            setMissingSheet((s) => ({ ...s, open: false }))
            openGroup(groupId, 'members')
          }}
        />
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
            openTraining(event)
          }}
          onNewStudent={() => navigate('/coach/students?add=student')}
        />
      )}

      {training && (
        <TrainingSheet
          key={`${classKey(training.event)}-${training.tab}`}
          event={training.event}
          initialTab={training.tab}
          members={members[training.event.groupId] ?? []}
          onClose={() => setTraining(null)}
          onSaved={(message) => {
            setNotice(message)
            void refreshTraining(training.event)
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
      {cropFile && (
        <PhotoCrop
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onDone={(data) => {
            setPhoto(data)
            setCropFile(null)
          }}
        />
      )}
    </div>
  )
}
