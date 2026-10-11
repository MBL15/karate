import { Link } from 'react-router-dom'
import type { ClassEvent, Competition } from '../../../api/types'
import { taskActions, type CoachTask } from '../../../utils/coachTasks'
import { IconCalendar, IconCheck, IconChevronRight, IconTrophy, IconUsers } from '../../ui/Icons'
import { addDays, eventRange, isAttestation, plural, shortDate, toIso, weekdayLong } from './helpers'

type Item =
  | { kind: 'training'; key: string; time: string; event: ClassEvent }
  | { kind: 'competition'; key: string; time: string; competition: Competition }
  | { kind: 'task'; key: string; time: string; task: CoachTask }

export function WeekTab({
  today,
  classes,
  competitions,
  tasks,
  onOpenTraining,
  onSchedule,
}: {
  today: Date
  classes: ClassEvent[]
  competitions: Competition[]
  tasks: CoachTask[]
  onOpenTraining: (event: ClassEvent) => void
  onSchedule: () => void
}) {
  const days = Array.from({ length: 7 }, (_, i) => toIso(addDays(today, i)))
  const byDay = new Map<string, Item[]>(days.map((d) => [d, []]))

  for (const event of classes) byDay.get(event.date)?.push({ kind: 'training', key: `t-${event.groupId}-${event.date}-${event.startTime}`, time: event.startTime, event })
  for (const competition of competitions) byDay.get(competition.eventDate)?.push({ kind: 'competition', key: `c-${competition.id}`, time: '', competition })
  for (const task of tasks) if (!task.done) byDay.get(task.due)?.push({ kind: 'task', key: `k-${task.id}`, time: task.time ?? '99', task })
  for (const list of byDay.values()) list.sort((a, b) => a.time.localeCompare(b.time))

  const trainings = classes.length
  const events = competitions.filter((c) => byDay.has(c.eventDate)).length
  const openTasks = tasks.filter((t) => !t.done && byDay.has(t.due)).length

  return (
    <section className="mt-5" aria-label="Неделя">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-base font-semibold tracking-tight text-text">Ближайшие 7 дней</h2>
        <p className="text-xs text-text-secondary">
          {shortDate(days[0])} – {shortDate(days[6])}
        </p>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <Summary value={trainings} label={plural(trainings, 'тренировка', 'тренировки', 'тренировок')} cls="bg-brand-blue-light text-brand-blue" />
        <Summary value={events} label={plural(events, 'событие', 'события', 'событий')} cls="bg-[#fff4e0] text-[#d97706]" />
        <Summary value={openTasks} label={plural(openTasks, 'задача', 'задачи', 'задач')} cls="bg-[#f3e8ff] text-[#7c3aed]" />
      </div>

      <ol className="tool-stagger space-y-2">
        {days.map((day, index) => {
          const items = byDay.get(day) ?? []
          const label = index === 0 ? 'Сегодня' : index === 1 ? 'Завтра' : weekdayLong(day)
          return (
            <li key={day} className={`rounded-3xl bg-white p-3 shadow-[var(--shadow-card)] ${items.length === 0 ? 'opacity-70' : ''}`}>
              <div className="flex items-center gap-3 px-1">
                <span
                  className={`flex size-11 shrink-0 flex-col items-center justify-center rounded-2xl leading-none ${
                    index === 0 ? 'bg-brand-blue text-white' : 'bg-surface-muted text-text'
                  }`}
                >
                  <span className="text-base font-bold tabular-nums">{Number(day.slice(8))}</span>
                  <span className={`text-[9px] font-semibold uppercase ${index === 0 ? 'text-white/80' : 'text-text-muted'}`}>
                    {new Date(`${day}T12:00:00`).toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '')}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-text">{label}</p>
                  <p className="text-xs text-text-secondary">{items.length === 0 ? 'Свободный день' : `${items.length} ${plural(items.length, 'дело', 'дела', 'дел')}`}</p>
                </div>
              </div>
              {items.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {items.map((item) => (
                    <li key={item.key}>
                      <WeekItem item={item} onOpenTraining={onOpenTraining} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ol>

      {trainings === 0 && (
        <button type="button" onClick={onSchedule} className="mt-3 w-full text-center text-sm font-semibold text-brand-blue">
          На неделе нет тренировок — составить расписание
        </button>
      )}
      <Link to="/coach/schedule" className="mt-3 flex items-center justify-center gap-1 text-sm font-semibold text-brand-blue">
        Открыть календарь на месяц
        <IconChevronRight size={14} />
      </Link>
    </section>
  )
}

function Summary({ value, label, cls }: { value: number; label: string; cls: string }) {
  return (
    <div className={`rounded-2xl px-3 py-2.5 ${cls}`}>
      <p className="text-lg leading-none font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-[11px] opacity-80">{label}</p>
    </div>
  )
}

const rowCls = 'flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition hover:bg-surface-muted active:scale-[0.99]'

function WeekItem({ item, onOpenTraining }: { item: Item; onOpenTraining: (event: ClassEvent) => void }) {
  if (item.kind === 'training') {
    const { event } = item
    return (
      <button type="button" onClick={() => onOpenTraining(event)} className={rowCls}>
        <span className="h-9 w-1 shrink-0 rounded-full bg-brand-blue" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-text">{event.groupName}</span>
          <span className="block truncate text-xs text-text-secondary">
            {eventRange(event)}
            {event.location ? ` · ${event.location}` : ''}
          </span>
        </span>
        <IconUsers size={16} className="shrink-0 text-brand-blue" />
      </button>
    )
  }
  if (item.kind === 'competition') {
    const { competition } = item
    const attestation = isAttestation(competition)
    const color = attestation ? '#16a34a' : '#d97706'
    return (
      <Link to="/coach/competitions" className={rowCls}>
        <span className="h-9 w-1 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-text">{competition.name}</span>
          <span className="block truncate text-xs text-text-secondary">
            {attestation ? 'Аттестация' : 'Турнир'}
            {competition.location ? ` · ${competition.location}` : ''} · {competition.registrations.length}{' '}
            {plural(competition.registrations.length, 'участник', 'участника', 'участников')}
          </span>
        </span>
        <span className="shrink-0" style={{ color }}>
          {attestation ? <IconCalendar size={16} /> : <IconTrophy size={16} />}
        </span>
      </Link>
    )
  }
  const { task } = item
  const meta = taskActions[task.action]
  return (
    <Link to="/coach/tools/checklists" className={rowCls}>
      <span className="h-9 w-1 shrink-0 rounded-full bg-[#7c3aed]" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-text">{task.title}</span>
        <span className="block truncate text-xs text-text-secondary">
          {meta.short}
          {task.time ? ` · ${task.time}` : ''}
        </span>
      </span>
      <IconCheck size={16} className="shrink-0 text-[#7c3aed]" />
    </Link>
  )
}
