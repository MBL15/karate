import { useState } from 'react'
import type { ClassEvent, GroupSummary } from '../../../api/types'
import { IconChart, IconChevronRight } from '../../ui/Icons'
import { addDays, classKey, GROUP_TONES, plural, shortDate, toIso, type AttendanceSummary } from './helpers'

type Period = 7 | 30

const PERIODS: { id: Period; label: string }[] = [
  { id: 7, label: '7 дней' },
  { id: 30, label: '30 дней' },
]

export function StatsCard({
  now,
  groups,
  classes,
  summaries,
  since,
  onOpenTraining,
  onOpenGroup,
}: {
  now: Date
  groups: GroupSummary[]
  classes: ClassEvent[]
  summaries: Record<string, AttendanceSummary>
  since: string
  onOpenTraining: (event: ClassEvent) => void
  onOpenGroup: (groupId: number) => void
}) {
  const [period, setPeriod] = useState<Period>(30)
  const from = toIso(addDays(now, -(period - 1)))
  const past = classes
    .filter((e) => !e.upcoming && e.date >= from)
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
  const marked = past.filter((e) => summaries[classKey(e)]?.marked)
  const tracked = past.filter((e) => e.date >= since || summaries[classKey(e)]?.marked)
  const pending = tracked.length - marked.length
  const rate = (list: ClassEvent[]) => {
    let present = 0
    let total = 0
    for (const e of list) {
      const s = summaries[classKey(e)]
      if (!s?.marked) continue
      present += s.present
      total += s.total
    }
    return total ? Math.round((present / total) * 100) : null
  }
  const average = rate(past)
  const absences = marked.reduce((sum, e) => sum + (summaries[classKey(e)]?.absent ?? 0), 0)
  const toneOf = new Map(groups.map((g, i) => [g.id, GROUP_TONES[i % GROUP_TONES.length].fg]))
  const days = [...new Set(past.map((e) => e.date))].slice(-8).map((date) => {
    const events = past.filter((e) => e.date === date)
    const dayMarked = events.filter((e) => summaries[classKey(e)]?.marked)
    return {
      date,
      events,
      pct: rate(dayMarked),
      todo: events.some((e) => !summaries[classKey(e)]?.marked && e.date >= since),
    }
  })
  const multiGroupDay = days.some((d) => d.events.length > 1)

  return (
    <section className="mt-8" aria-labelledby="stats-title">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 id="stats-title" className="font-display text-lg font-bold tracking-tight text-text">
            Статистика
          </h2>
          <p className="text-xs text-text-secondary">По прошедшим тренировкам</p>
        </div>
        <div className="flex shrink-0 rounded-full bg-surface-subtle p-0.5 text-xs font-semibold">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              aria-pressed={period === p.id}
              className={`min-h-8 rounded-full px-3 transition ${period === p.id ? 'bg-white text-brand-blue shadow-sm' : 'text-text-secondary'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {past.length === 0 ? (
        <div className="flex items-center gap-3 rounded-3xl bg-white px-4 py-5 shadow-[var(--shadow-card)]">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-blue-light text-brand-blue">
            <IconChart size={20} />
          </span>
          <p className="text-sm text-text-secondary">Статистика появится после первой проведённой и отмеченной тренировки.</p>
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-4 shadow-[var(--shadow-card)]">
          <div className="grid grid-cols-3 gap-2">
            <Metric value={average != null ? `${average}%` : '—'} label="посещаемость" tone="text-brand-blue" />
            <Metric value={`${marked.length}/${tracked.length}`} label={`${plural(tracked.length, 'тренировка', 'тренировки', 'тренировок')} отмечено`} tone="text-text" />
            <Metric value={absences} label={plural(absences, 'пропуск', 'пропуска', 'пропусков')} tone="text-error" />
          </div>

          <p className="mt-4 text-xs font-semibold text-text-secondary">Последние тренировки</p>
          <div className="mt-2 flex h-32 items-stretch justify-center gap-2">
            {days.map((day) => (
              <div key={day.date} className="flex max-w-14 min-w-0 flex-1 flex-col items-center gap-1">
                <span
                  className={`text-[10px] font-semibold tabular-nums ${day.pct != null ? 'text-text-secondary' : day.todo ? 'text-[#d97706]' : 'text-transparent'}`}
                >
                  {day.pct != null ? `${day.pct}%` : '!'}
                </span>
                <div className="flex w-full flex-1 items-end gap-0.5 rounded-xl bg-surface-muted p-0.5">
                  {day.events.map((event) => {
                    const s = summaries[classKey(event)]
                    const pct = s?.marked && s.total ? Math.round((s.present / s.total) * 100) : null
                    const before = pct == null && event.date < since
                    return (
                      <button
                        key={classKey(event)}
                        type="button"
                        onClick={() => onOpenTraining(event)}
                        title={`${event.groupName} · ${pct != null ? `${pct}%` : before ? 'без отметок' : 'не отмечена'}`}
                        aria-label={`${event.groupName}, ${shortDate(event.date)}: ${pct != null ? `${pct}%` : before ? 'до начала работы в приложении' : 'не отмечена'}`}
                        className="flex h-full min-w-0 flex-1 items-end transition active:scale-95"
                      >
                        <span
                          className={`bar-grow block w-full rounded-[9px] ${pct != null ? '' : before ? 'bg-surface-subtle' : 'bg-[#fde7c2]'}`}
                          style={{
                            height: pct != null ? `${Math.max(pct, 6)}%` : '100%',
                            backgroundColor: pct != null ? (toneOf.get(event.groupId) ?? 'var(--color-brand-blue)') : undefined,
                          }}
                        />
                      </button>
                    )
                  })}
                </div>
                <span className="text-[9px] whitespace-nowrap text-text-muted">{shortDate(day.date)}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 space-y-0.5 text-[11px]">
            {multiGroupDay && <p className="text-text-muted">Один столбец — один день. Полоски внутри — группы, цвета как в списке ниже.</p>}
            {pending > 0 && <p className="text-[#b45309]">Оранжевые полоски — тренировки без отметок. Нажмите, чтобы отметить.</p>}
          </div>

          {groups.length > 0 && (
            <>
              <p className="mt-4 text-xs font-semibold text-text-secondary">По группам</p>
              <ul className="mt-1">
                {groups.map((g, i) => {
                  const own = past.filter((e) => e.groupId === g.id)
                  const pct = rate(own)
                  const tone = GROUP_TONES[i % GROUP_TONES.length]
                  return (
                    <li key={g.id}>
                      <button type="button" onClick={() => onOpenGroup(g.id)} className="flex w-full items-center gap-3 rounded-xl py-2 text-left transition active:bg-surface-muted">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: tone.fg }} aria-hidden />
                        <span className="w-24 shrink-0 truncate text-sm font-medium text-text">{g.name}</span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                          <span className="bar-grow block h-full rounded-full" style={{ width: `${pct ?? 0}%`, backgroundColor: tone.fg }} />
                        </span>
                        <span className="w-12 shrink-0 text-right text-xs font-semibold text-text tabular-nums">
                          {pct != null ? `${pct}%` : own.length ? '—' : 'нет'}
                        </span>
                        <IconChevronRight size={14} className="shrink-0 text-text-muted" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  )
}

function Metric({ value, label, tone }: { value: string | number; label: string; tone: string }) {
  return (
    <div className="rounded-2xl bg-surface-muted px-3 py-2.5">
      <p className={`text-lg leading-none font-bold tabular-nums ${tone}`}>{value}</p>
      <p className="mt-1 text-[11px] leading-tight text-text-secondary">{label}</p>
    </div>
  )
}
