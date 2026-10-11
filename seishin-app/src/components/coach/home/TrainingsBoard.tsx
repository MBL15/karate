import { useEffect, useRef, type ReactNode } from 'react'
import type { ClassEvent, SessionAttendance } from '../../../api/types'
import { IconBell, IconCalendar, IconCheck, IconMapPin, IconUsers } from '../../ui/Icons'
import { useStoredState } from '../../../hooks/useStoredState'
import { TOPICS_KEY, type TrainingTopics } from './TrainingTopic'
import { classKey, eventRange, GROUP_TONES, hhmm, minutesUntil, plural, toIso, untilLabel, weekdayLong, type AttendanceSummary } from './helpers'

export type TrainingTab = 'marks' | 'month' | 'parents'

const DAY_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

type DayState = 'none' | 'todo' | 'done' | 'planned' | 'before'

export function TrainingsBoard({
  now,
  days,
  selected,
  onSelect,
  classes,
  summaries,
  since,
  attendance,
  groupIndex,
  hasGroups,
  onOpen,
  onSchedule,
}: {
  now: Date
  days: string[]
  selected: string
  onSelect: (day: string) => void
  classes: ClassEvent[]
  summaries: Record<string, AttendanceSummary>
  since: string
  attendance: Record<string, SessionAttendance>
  groupIndex: (groupId: number) => number
  hasGroups: boolean
  onOpen: (event: ClassEvent, tab: TrainingTab) => void
  onSchedule: () => void
}) {
  const todayIso = toIso(now)
  const stripRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const strip = stripRef.current
    const active = strip?.querySelector<HTMLElement>('[data-today="true"]')
    if (strip && active) strip.scrollLeft = active.offsetLeft - strip.clientWidth / 2 + active.clientWidth / 2
  }, [])

  const byDay = new Map<string, ClassEvent[]>()
  for (const event of classes) byDay.set(event.date, [...(byDay.get(event.date) ?? []), event])

  const dayState = (day: string): DayState => {
    const list = byDay.get(day) ?? []
    if (list.length === 0) return 'none'
    const unmarked = list.filter((e) => !e.upcoming && !summaries[classKey(e)]?.marked)
    if (unmarked.length) return day < since ? 'before' : 'todo'
    if (list.every((e) => !e.upcoming)) return 'done'
    return 'planned'
  }

  const list = [...(byDay.get(selected) ?? [])].sort((a, b) => a.startTime.localeCompare(b.startTime))
  const relative = selected === todayIso ? 'Сегодня' : selected === toIso(new Date(now.getTime() + 86400000)) ? 'Завтра' : selected === toIso(new Date(now.getTime() - 86400000)) ? 'Вчера' : weekdayLong(selected)
  const dateLabel = new Date(`${selected}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })

  return (
    <section className="mt-6" aria-labelledby="trainings-title">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 id="trainings-title" className="font-display text-lg font-bold tracking-tight text-text">
            Тренировки
          </h2>
          <p className="text-xs text-text-secondary">Выберите день — отметьте посещаемость, оплату и значки</p>
        </div>
        {selected !== todayIso && (
          <button type="button" onClick={() => onSelect(todayIso)} className="shrink-0 rounded-full bg-brand-blue-light px-3 py-1.5 text-xs font-semibold text-brand-blue">
            К сегодня
          </button>
        )}
      </div>

      <div ref={stripRef} className="-mx-5 flex gap-1.5 overflow-x-auto scroll-smooth px-5 pb-2 [scrollbar-width:none] lg:-mx-8 lg:px-8" role="tablist" aria-label="Дни">
        {days.map((day) => {
          const date = new Date(`${day}T12:00:00`)
          const active = day === selected
          const isToday = day === todayIso
          const state = dayState(day)
          return (
            <button
              key={day}
              type="button"
              role="tab"
              aria-selected={active}
              data-today={isToday}
              onClick={() => onSelect(day)}
              className={`relative flex w-12 shrink-0 flex-col items-center rounded-2xl py-2 transition active:scale-95 ${
                active
                  ? 'bg-brand-blue text-white shadow-[var(--shadow-blue)]'
                  : isToday
                    ? 'bg-brand-blue-light text-brand-blue'
                    : day < todayIso
                      ? 'bg-surface-muted text-text-secondary'
                      : 'bg-white text-text shadow-[var(--shadow-card)]'
              }`}
            >
              <span className={`text-[10px] font-semibold uppercase ${active ? 'text-white/80' : ''}`}>{DAY_SHORT[date.getDay()]}</span>
              <span className="mt-0.5 text-base leading-none font-bold tabular-nums">{date.getDate()}</span>
              <span
                className={`mt-1.5 size-1.5 rounded-full ${
                  state === 'none'
                    ? 'bg-transparent'
                    : state === 'before'
                      ? active
                        ? 'bg-white/60'
                        : 'bg-text-muted/40'
                      : state === 'todo'
                      ? 'bg-[#f59e0b]'
                      : state === 'done'
                        ? active
                          ? 'bg-white'
                          : 'bg-brand-green'
                        : active
                          ? 'bg-white'
                          : 'bg-brand-blue'
                }`}
                aria-hidden
              />
            </button>
          )
        })}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-text-muted">
        <Legend cls="bg-[#f59e0b]" label="нужно отметить" />
        <Legend cls="bg-brand-green" label="отмечено" />
        <Legend cls="bg-brand-blue" label="впереди" />
      </div>

      <p className="mt-4 mb-2 text-sm font-semibold text-text">
        {relative}
        <span className="font-normal text-text-secondary">, {dateLabel}</span>
      </p>

      {list.length === 0 ? (
        <div className="flex items-center gap-3 rounded-3xl border border-dashed border-border bg-white px-4 py-5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-surface-muted text-text-muted">
            <IconCalendar size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text">Тренировок нет</p>
            <p className="text-xs text-text-secondary">
              {hasGroups ? 'Тренировки появляются по расписанию групп' : 'Сначала создайте группы и поставьте им расписание'}
            </p>
          </div>
          <button type="button" onClick={onSchedule} className="shrink-0 text-sm font-semibold text-brand-blue">
            Расписание
          </button>
        </div>
      ) : (
        <ul className="tool-stagger space-y-3">
          {list.map((event) => (
            <li key={classKey(event)}>
              <TrainingCard
                event={event}
                now={now}
                summary={summaries[classKey(event)]}
                session={attendance[classKey(event)]}
                before={event.date < since}
                tone={GROUP_TONES[groupIndex(event.groupId) % GROUP_TONES.length]}
                onOpen={(tab) => onOpen(event, tab)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`size-1.5 rounded-full ${cls}`} aria-hidden />
      {label}
    </span>
  )
}

function TrainingCard({
  event,
  now,
  summary,
  session,
  before,
  tone,
  onOpen,
}: {
  event: ClassEvent
  now: Date
  summary?: AttendanceSummary
  session?: SessionAttendance
  before: boolean
  tone: { bg: string; fg: string }
  onOpen: (tab: TrainingTab) => void
}) {
  const [topics] = useStoredState<TrainingTopics>(TOPICS_KEY, {})
  const topic = topics[classKey(event)]
  const minutes = minutesUntil(event, now)
  const marked = Boolean(summary?.marked)
  const total = summary?.total || event.studentCount
  const confirmed = session?.entries.filter((e) => e.parentIntent === 'CONFIRMED').length ?? 0
  const declined = session?.entries.filter((e) => e.parentIntent === 'DECLINED').length ?? 0
  const status = event.upcoming
    ? { text: untilLabel(minutes), cls: 'bg-brand-blue-light text-brand-blue' }
    : marked
      ? { text: 'Отмечено', cls: 'bg-brand-green-light text-brand-green' }
      : before
        ? { text: 'Без отметок', cls: 'bg-surface-muted text-text-muted' }
        : event.today && minutes > -120
          ? { text: 'Идёт сейчас', cls: 'bg-[#fff4e0] text-[#d97706]' }
          : { text: 'Не отмечена', cls: 'bg-[#fff4e0] text-[#d97706]' }
  const percent = marked && total ? Math.round(((summary?.present ?? 0) / total) * 100) : 0

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-card)]">
      <button type="button" onClick={() => onOpen('marks')} className="block w-full p-4 text-left transition active:bg-surface-muted">
        <div className="flex items-start gap-3">
          <div className="flex w-14 shrink-0 flex-col items-center rounded-2xl py-2" style={{ backgroundColor: tone.bg, color: tone.fg }}>
            <span className="text-base leading-none font-bold tabular-nums">{hhmm(event.startTime)}</span>
            {event.endTime && <span className="mt-1 text-[10px] font-medium tabular-nums opacity-80">до {hhmm(event.endTime)}</span>}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-[17px] font-bold text-text">{event.groupName}</p>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${status.cls}`}>{status.text}</span>
            </div>
            <p className="flex items-center gap-1 truncate text-xs text-text-secondary">
              <IconMapPin size={12} />
              {event.location || 'Зал клуба'} · {eventRange(event)}
            </p>
            {event.upcoming ? (
              <p className="mt-2 text-xs text-text-secondary">
                Родители: <span className="font-semibold text-brand-green">будут {confirmed}</span> · <span className="font-semibold text-error">нет {declined}</span> ·
                ждём {Math.max(total - confirmed - declined, 0)}
              </p>
            ) : marked ? (
              <>
                <p className="mt-2 text-xs text-text-secondary">
                  Пришли <span className="font-semibold text-text">{summary?.present ?? 0}</span> из {total} · {percent}%
                </p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e7f6ee]">
                  <div className="bar-grow h-full rounded-full bg-[#3dae6b]" style={{ width: `${percent}%` }} />
                </div>
              </>
            ) : before ? (
              <p className="mt-2 text-xs text-text-muted">До начала работы в приложении — можно отметить при желании</p>
            ) : (
              <p className="mt-2 text-xs font-semibold text-[#d97706]">
                {total} {plural(total, 'ученик', 'ученика', 'учеников')} ждут отметки
              </p>
            )}
            {topic?.title && (
              <p className="mt-1.5 truncate text-xs text-text-secondary">
                {event.upcoming ? 'План' : 'Тема'}: <span className="font-semibold text-text">{topic.title}</span>
              </p>
            )}
          </div>
        </div>
      </button>

      <div className="grid grid-cols-3 border-t border-border-light">
        <Action
          label={event.upcoming ? 'Состав' : marked ? 'Отметки' : 'Отметить'}
          icon={event.upcoming ? <IconUsers size={16} /> : <IconCheck size={16} />}
          highlight={!event.upcoming && !marked && !before}
          onClick={() => onOpen('marks')}
        />
        <Action label="Оплата" icon={<span className="text-[15px] leading-none font-bold">₽</span>} onClick={() => onOpen('month')} />
        <Action label="Родителям" icon={<IconBell size={16} />} onClick={() => onOpen('parents')} />
      </div>
    </div>
  )
}

function Action({ label, icon, highlight, onClick }: { label: string; icon: ReactNode; highlight?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-11 items-center justify-center gap-1.5 border-r border-border-light text-[13px] font-semibold transition last:border-r-0 active:bg-surface-muted ${
        highlight ? 'bg-[#fff8ec] text-[#d97706]' : 'text-brand-blue'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
