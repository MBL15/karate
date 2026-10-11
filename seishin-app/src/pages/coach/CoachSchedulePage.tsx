import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { dropAutoSchedule } from '../../api/autoSchedule'
import { coachApi } from '../../api/coach'
import type { ClassEvent, Competition, GroupSummary, ScheduleSlot, TrainingReminder } from '../../api/types'
import { ApiError } from '../../api/client'
import { CoachPageShell } from '../../components/coach/CoachPageShell'
import { CoachError, CoachLoading } from '../../components/coach/CoachScreenState'
import { ScheduleSheet } from '../../components/coach/ScheduleSheet'
import { useStoredState } from '../../hooks/useStoredState'
import { EMPTY_GROUP_EDITS, GROUP_EDITS_KEY, type GroupEdits } from '../../utils/groupEdits'

type EventKind = 'training' | 'competition' | 'attestation'

const KIND_META: Record<EventKind, { label: string; color: string; soft: string }> = {
  training: { label: 'Тренировка', color: '#2563eb', soft: '#eaf1fe' },
  competition: { label: 'Турнир', color: '#f59e0b', soft: '#fff4e0' },
  attestation: { label: 'Аттестация', color: '#16a34a', soft: '#e8f7ee' },
}

function competitionKind(competition: Competition): EventKind {
  return /аттестац/i.test(competition.name) ? 'attestation' : 'competition'
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const WEEKDAY_OPTIONS = [
  { value: 1, label: 'Понедельник' },
  { value: 2, label: 'Вторник' },
  { value: 3, label: 'Среда' },
  { value: 4, label: 'Четверг' },
  { value: 5, label: 'Пятница' },
  { value: 6, label: 'Суббота' },
  { value: 7, label: 'Воскресенье' },
]

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

function formatTime(value?: string | null) {
  if (!value) return ''
  return value.slice(0, 5)
}

function formatDateLabel(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function timeRange(event: { startTime: string; endTime?: string | null }) {
  const start = formatTime(event.startTime)
  const end = formatTime(event.endTime)
  return end ? `${start}–${end}` : start
}

export function CoachSchedulePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const today = new Date()
  const todayIso = toIsoDate(today.getFullYear(), today.getMonth(), today.getDate())
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(todayIso)
  const [slots, setSlots] = useState<ScheduleSlot[]>([])
  const [events, setEvents] = useState<ClassEvent[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [reminders, setReminders] = useState<TrainingReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [sheet, setSheet] = useState<{ key: number; editSlot: ScheduleSlot | null }>({ key: 0, editSlot: null })
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [edits] = useStoredState<GroupEdits>(GROUP_EDITS_KEY, EMPTY_GROUP_EDITS)
  const [scheduleReviewed] = useStoredState('schedule-reviewed', false)

  const openSheet = (editSlot: ScheduleSlot | null = null) => {
    setSheet({ key: Date.now(), editSlot })
    setSheetOpen(true)
  }

  const monthFrom = toIsoDate(year, month, 1)
  const monthTo = toIsoDate(year, month, new Date(year, month + 1, 0).getDate())

  const request = useRef(0)
  const hiddenRef = useRef(edits.hidden)
  hiddenRef.current = edits.hidden
  const reviewedRef = useRef(scheduleReviewed)
  reviewedRef.current = scheduleReviewed

  const load = useCallback(async () => {
    const id = ++request.current
    setLoading(true)
    setError(null)
    try {
      let [schedule, classes, groupList, competitionList] = await Promise.all([
        coachApi.schedule(),
        coachApi.classes(monthFrom, monthTo),
        coachApi.groups(),
        coachApi.competitions().catch(() => [] as Competition[]),
      ])
      if (await dropAutoSchedule(schedule, groupList.map((g) => g.id), reviewedRef.current)) {
        ;[schedule, classes] = await Promise.all([coachApi.schedule(), coachApi.classes(monthFrom, monthTo)])
      }
      if (id !== request.current) return
      const visible = (groupId: number) => !hiddenRef.current.includes(groupId)
      setSlots(schedule.filter((s) => visible(s.groupId)))
      setEvents(classes.filter((e) => visible(e.groupId)))
      setCompetitions(competitionList)
      setGroups(groupList)
    } catch (e) {
      if (id !== request.current) return
      setError(e instanceof ApiError ? e.message : 'Ошибка загрузки расписания')
    } finally {
      if (id === request.current) setLoading(false)
    }
  }, [monthFrom, monthTo])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (searchParams.get('add') !== 'slot') return
    setSheet({ key: Date.now(), editSlot: null })
    setSheetOpen(true)
    const next = new URLSearchParams(searchParams)
    next.delete('add')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7

  const eventsByDate = useMemo(() => {
    const map: Record<string, ClassEvent[]> = {}
    for (const event of events) {
      if (!map[event.date]) map[event.date] = []
      map[event.date].push(event)
    }
    return map
  }, [events])

  const competitionsByDate = useMemo(() => {
    const map: Record<string, Competition[]> = {}
    for (const competition of competitions) {
      const date = competition.eventDate.slice(0, 10)
      if (!map[date]) map[date] = []
      map[date].push(competition)
    }
    return map
  }, [competitions])

  const selectedEvents = eventsByDate[selectedDate] ?? []
  const selectedCompetitions = competitionsByDate[selectedDate] ?? []

  const slotsByWeekday = useMemo(() => {
    const map: Record<number, ScheduleSlot[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] }
    for (const slot of slots) {
      map[slot.weekday]?.push(slot)
    }
    return map
  }, [slots])

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  })

  const removeSlot = async (id: number) => {
    try {
      await coachApi.deleteSchedule(id)
      setMessage('Слот убран из расписания')
      await load()
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Не удалось удалить слот')
    }
  }

  const remind = async (scheduleId?: number) => {
    setSending(true)
    try {
      const list = await coachApi.sendTrainingReminders({
        date: selectedDate,
        scheduleId,
      })
      setReminders(list)
      setMessage(
        list.length
          ? `Подготовлено текстов: ${list.length}. Автоотправка родителям появится после обновления сервера`
          : 'Нет родителей для напоминания',
      )
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Не удалось подготовить напоминания')
    } finally {
      setSending(false)
    }
  }

  return (
    <CoachPageShell
      title="Календарь"
      subtitle="Тренировки, турниры и аттестации клуба"
      back={{ to: '/coach/tools', label: 'Инструменты' }}
      headerActions={
        <div className="grid w-full grid-cols-3 gap-2">
          {!loading && groups.filter((g) => !edits.hidden.includes(g.id)).length === 0 ? (
            <Link to="/coach/students?add=group" className="btn-coach px-2 text-sm whitespace-nowrap">
              + Группа
            </Link>
          ) : (
            <button type="button" onClick={() => openSheet()} className="btn-coach px-2 text-sm whitespace-nowrap">
              + Тренировка
            </button>
          )}
          <Link to="/coach/competitions?add=competition" className="btn-secondary px-2 text-sm whitespace-nowrap">
            + Турнир
          </Link>
          <Link to="/coach/competitions?add=competition&kind=attestation" className="btn-secondary px-2 text-sm whitespace-nowrap">
            + Аттестация
          </Link>
        </div>
      }
    >
      {loading && slots.length === 0 ? (
        <CoachLoading />
      ) : error ? (
        <>
          <CoachError message={error} />
          <button type="button" onClick={() => void load()} className="btn-coach">
            Повторить
          </button>
        </>
      ) : (
        <>
      {message && <p className="alert-success">{message}</p>}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-border-light bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex items-center justify-between">
            <button type="button" onClick={() => shiftMonth(-1)} className="flex size-10 items-center justify-center rounded-full bg-surface-muted text-text-secondary transition hover:text-text active:scale-95" aria-label="Предыдущий месяц">
              <span aria-hidden="true">‹</span>
            </button>
            <p key={monthLabel} className="pop-in text-lg font-bold capitalize text-text" aria-live="polite">{monthLabel}</p>
            <button type="button" onClick={() => shiftMonth(1)} className="flex size-10 items-center justify-center rounded-full bg-surface-muted text-text-secondary transition hover:text-text active:scale-95" aria-label="Следующий месяц">
              <span aria-hidden="true">›</span>
            </button>
          </div>

          <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-text-secondary" aria-label="Обозначения">
            {(Object.keys(KIND_META) as EventKind[]).map((kind) => (
              <li key={kind} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: KIND_META[kind].color }} aria-hidden />
                {KIND_META[kind].label}
              </li>
            ))}
          </ul>

          <div key={`${year}-${month}`} className="pop-in grid grid-cols-7 gap-1 text-center text-xs font-medium text-text-secondary">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-2">{day}</div>
            ))}
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const iso = toIsoDate(year, month, day)
              const dayEvents = eventsByDate[iso] ?? []
              const dayCompetitions = competitionsByDate[iso] ?? []
              const kinds: EventKind[] = []
              if (dayEvents.length) kinds.push('training')
              if (dayCompetitions.some((c) => competitionKind(c) === 'competition')) kinds.push('competition')
              if (dayCompetitions.some((c) => competitionKind(c) === 'attestation')) kinds.push('attestation')
              const highlight = kinds.includes('attestation') ? 'attestation' : kinds.includes('competition') ? 'competition' : null
              const selected = selectedDate === iso
              const isToday = iso === todayIso
              const labels = kinds.map((kind) => KIND_META[kind].label.toLowerCase()).join(', ')
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => {
                    setSelectedDate(iso)
                    setReminders([])
                  }}
                  aria-pressed={selected}
                  aria-label={`${day} ${monthLabel}${isToday ? ', сегодня' : ''}${labels ? `, ${labels}` : ''}`}
                  className={`relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl text-sm transition duration-200 active:scale-95 ${
                    selected
                      ? 'bg-brand-blue font-semibold text-white shadow-[var(--shadow-blue)]'
                      : isToday
                        ? 'font-bold text-brand-blue ring-2 ring-brand-blue/30 ring-inset'
                        : 'text-text hover:bg-surface-muted'
                  }`}
                  style={!selected && highlight ? { backgroundColor: KIND_META[highlight].soft } : undefined}
                >
                  {day}
                  <span className="flex h-1.5 gap-0.5" aria-hidden>
                    {kinds.map((kind) => (
                      <span
                        key={kind}
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: selected ? '#fff' : KIND_META[kind].color }}
                      />
                    ))}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-border-light bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold capitalize text-text">{formatDateLabel(selectedDate)}</h2>
              <p className="mt-1 text-sm text-text-secondary">
                {selectedEvents.length + selectedCompetitions.length
                  ? `Событий: ${selectedEvents.length + selectedCompetitions.length}`
                  : 'В этот день событий нет'}
              </p>
            </div>
            <button
              type="button"
              disabled={sending || selectedEvents.length === 0}
              onClick={() => void remind()}
              className="btn-coach shrink-0"
            >
              Напомнить
            </button>
          </div>

          {selectedEvents.length + selectedCompetitions.length === 0 ? (
            <p className="rounded-2xl bg-surface-muted px-4 py-6 text-sm text-text-secondary">
              Выберите день с цветной точкой или добавьте тренировку в расписание.
            </p>
          ) : (
            <ul key={selectedDate} className="tool-stagger space-y-2.5">
              {selectedCompetitions.map((competition) => {
                const meta = KIND_META[competitionKind(competition)]
                return (
                  <li
                    key={`c-${competition.id}`}
                    className="rounded-2xl border-l-4 p-4"
                    style={{ borderColor: meta.color, backgroundColor: meta.soft }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: meta.color }}>
                      {meta.label}
                    </p>
                    <p className="mt-1 font-semibold text-text">{competition.name}</p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {competition.location || 'Место не указано'} · заявок: {competition.registrations.length}
                    </p>
                    <Link to="/coach/competitions" className="mt-2 inline-block text-sm font-semibold hover:underline" style={{ color: meta.color }}>
                      Открыть
                    </Link>
                  </li>
                )
              })}
              {selectedEvents.map((event) => (
                <li
                  key={`${event.scheduleId}-${event.date}`}
                  className="rounded-2xl border-l-4 p-4"
                  style={{ borderColor: KIND_META.training.color, backgroundColor: KIND_META.training.soft }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">Тренировка</p>
                  <p className="mt-1 font-semibold text-text">{event.groupName}</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {timeRange(event)}
                    {event.location ? ` · ${event.location}` : ''}
                    {` · ${event.studentCount} уч.`}
                  </p>
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() => void remind(event.scheduleId)}
                    className="mt-3 text-sm font-semibold text-brand-blue hover:underline"
                  >
                    Подготовить напоминание родителям
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-3xl border border-border-light bg-white p-5 shadow-[var(--shadow-card)]">
        <h2 className="mb-3 text-lg font-bold text-text">Недельное расписание</h2>
        <ul className="divide-y divide-border-light">
          {WEEKDAY_OPTIONS.filter((day) => (slotsByWeekday[day.value] ?? []).length > 0).map((day) => (
            <li key={day.value} className="flex gap-4 py-3">
              <span className="w-10 shrink-0 pt-2 text-sm font-semibold text-text-secondary">{WEEKDAYS[day.value - 1]}</span>
              <ul className="flex-1 space-y-2">
                {(slotsByWeekday[day.value] ?? []).map((slot) => (
                  <li key={slot.id} className="flex items-center gap-3 rounded-2xl bg-brand-blue-light/50 px-3.5 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-text">
                        {timeRange(slot)} · {slot.groupName}
                      </p>
                      {slot.location && <p className="truncate text-xs text-text-secondary">{slot.location}</p>}
                    </div>
                    {groups.some((g) => g.id === slot.groupId) ? (
                    <>
                    <button
                      type="button"
                      onClick={() => openSheet(slot)}
                      className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-brand-blue transition hover:bg-white"
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeSlot(slot.id)}
                      className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-error transition hover:bg-error-bg"
                    >
                      Удалить
                    </button>
                    </>
                    ) : (
                      <span className="shrink-0 text-[11px] text-text-muted">другой тренер</span>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        {slots.length === 0 && <p className="text-sm text-text-secondary">Регулярных тренировок пока нет.</p>}
        {slots.length > 0 && (
          <p className="mt-2 text-xs text-text-muted">
            Без занятий: {WEEKDAY_OPTIONS.filter((day) => (slotsByWeekday[day.value] ?? []).length === 0).map((day) => WEEKDAYS[day.value - 1]).join(', ') || '—'}
          </p>
        )}
      </section>

      {reminders.length > 0 && (
        <section className="card p-6">
          <h2 className="section-title mb-4">Тексты напоминаний</h2>
          <ul className="space-y-3">
            {reminders.map((item, index) => (
              <li key={`${item.studentId}-${item.time}-${index}`} className="rounded-xl bg-surface-muted p-4">
                <p className="font-semibold text-text">{item.studentName}</p>
                <p className="mt-1 text-sm text-text-secondary">
                  {item.parentName ?? 'Родитель не привязан'}
                  {item.parentPhone ? ` · ${item.parentPhone}` : ''}
                </p>
                <p className="mt-2 text-sm text-text">{item.message}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
        </>
      )}
      <ScheduleSheet
        key={sheet.key}
        open={sheetOpen}
        groups={groups.filter((g) => !edits.hidden.includes(g.id))}
        slots={slots}
        editSlot={sheet.editSlot}
        onClose={() => setSheetOpen(false)}
        onChanged={(text, close) => {
          setMessage(text)
          if (close) setSheetOpen(false)
          void load()
        }}
      />
    </CoachPageShell>
  )
}
