import { useMemo, useState, type ReactNode } from 'react'
import type { HistoryEntry } from '../../api/types'
import { attendanceDayClass, attendanceStatusLabel, formatDate } from '../../utils/format'
import { IconChevronRight } from '../ui/Icons'
import { AttendanceLegend } from './AttendanceDay'
import { PARENT_CARD } from './parentUi'

type Period = 'month' | 'quarter' | 'all'

const PERIODS: { id: Period; label: string; days: number | null; prev: string; same: string }[] = [
  { id: 'month', label: 'Месяц', days: 30, prev: 'прошлым месяцем', same: 'Посещаемость как в прошлом месяце' },
  { id: 'quarter', label: '3 месяца', days: 91, prev: 'прошлыми 3 месяцами', same: 'Посещаемость как за прошлые 3 месяца' },
  { id: 'all', label: 'Всё время', days: null, prev: '', same: '' },
]

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const attended = (e: HistoryEntry) => e.status === 'PRESENT' || e.status === 'MAKEUP'
const pad = (n: number) => String(n).padStart(2, '0')
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const monthOf = (iso: string) => iso.slice(0, 7)
const parse = (iso: string) => new Date(`${iso}T12:00:00`)

function shiftDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return isoDay(d)
}

function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

function monthTitle(month: string, short = false) {
  const label = parse(`${month}-15`).toLocaleDateString('ru-RU', short ? { month: 'short' } : { month: 'long', year: 'numeric' })
  const clean = label.replace(' г.', '').replace('.', '')
  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

function summarize(list: HistoryEntry[]) {
  const counted = list.filter((e) => e.status !== 'GUEST')
  const present = counted.filter(attended).length
  const absent = counted.filter((e) => e.status === 'ABSENT').length
  return { present, absent, total: counted.length, rate: counted.length ? Math.round((present / counted.length) * 100) : null }
}

function streaks(history: HistoryEntry[]) {
  const asc = [...history].filter((e) => e.status !== 'GUEST').sort((a, b) => a.date.localeCompare(b.date))
  let best = 0
  let run = 0
  for (const e of asc) {
    run = attended(e) ? run + 1 : 0
    best = Math.max(best, run)
  }
  let missedInRow = 0
  for (let i = asc.length - 1; i >= 0 && asc[i].status === 'ABSENT'; i--) missedInRow++
  return { current: run, best, missedInRow }
}

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

function Card({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className={PARENT_CARD}>
      <h2 className="font-bold text-text">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-text-secondary">{hint}</p>}
      {children}
    </section>
  )
}

function MonthCalendar({ history }: { history: HistoryEntry[] }) {
  const current = monthOf(isoDay(new Date()))
  const earliest = history.length ? history.reduce((min, e) => (e.date < min ? e.date : min), history[0].date).slice(0, 7) : current
  const [month, setMonth] = useState(() => (history[0] ? monthOf(history[0].date) : current))
  const byDay = useMemo(() => {
    const map = new Map<string, HistoryEntry[]>()
    for (const e of history) map.set(e.date, [...(map.get(e.date) ?? []), e])
    return map
  }, [history])

  const [y, m] = month.split('-').map(Number)
  const first = new Date(y, m - 1, 1)
  const offset = (first.getDay() + 6) % 7
  const days = new Date(y, m, 0).getDate()
  const today = isoDay(new Date())
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  const monthStats = summarize(history.filter((e) => monthOf(e.date) === month))

  return (
    <Card title="Календарь посещений">
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth((v) => shiftMonth(v, -1))}
          disabled={month <= earliest}
          aria-label="Предыдущий месяц"
          className="flex size-9 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted disabled:opacity-30"
        >
          <IconChevronRight size={18} className="rotate-180" />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-text">{monthTitle(month)}</p>
          <p className="text-[11px] text-text-secondary">
            {monthStats.total ? `посещено ${monthStats.present} из ${monthStats.total}` : 'отметок нет'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMonth((v) => shiftMonth(v, 1))}
          disabled={month >= current}
          aria-label="Следующий месяц"
          className="flex size-9 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted disabled:opacity-30"
        >
          <IconChevronRight size={18} />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <span key={d} className="pb-1 text-[11px] font-semibold text-text-muted">
            {d}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day == null) return <span key={`e${i}`} />
          const iso = `${month}-${pad(day)}`
          const entries = byDay.get(iso)
          const entry = entries?.find((e) => e.status === 'ABSENT') ?? entries?.[0]
          return (
            <span
              key={iso}
              title={entries?.map((e) => `${e.groupName}: ${attendanceStatusLabel(e.status)}`).join(', ')}
              className={`flex aspect-square items-center justify-center rounded-lg text-xs font-semibold ${
                entry ? attendanceDayClass(entry.status) : iso === today ? 'ring-1 ring-brand-green text-text' : 'text-text-muted'
              }`}
            >
              {day}
            </span>
          )
        })}
      </div>
      <AttendanceLegend />
    </Card>
  )
}

export function AttendanceStats({ history }: { history: HistoryEntry[] }) {
  const [period, setPeriod] = useState<Period>('month')
  const config = PERIODS.find((p) => p.id === period)!

  const scoped = config.days == null ? history : history.filter((e) => e.date >= shiftDays(config.days!))
  const previous =
    config.days == null
      ? []
      : history.filter((e) => e.date >= shiftDays(config.days! * 2) && e.date < shiftDays(config.days!))
  const now = summarize(scoped)
  const before = summarize(previous)
  const trend = now.rate != null && before.rate != null ? now.rate - before.rate : null
  const streak = useMemo(() => streaks(history), [history])

  const currentMonth = monthOf(isoDay(new Date()))
  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(currentMonth, i - 5)).map((month) => ({
    month,
    ...summarize(history.filter((e) => monthOf(e.date) === month)),
  }))

  const weekdayCounts = WEEKDAYS.map((_, i) => scoped.filter((e) => attended(e) && (parse(e.date).getDay() + 6) % 7 === i).length)
  const weekdayMax = Math.max(1, ...weekdayCounts)

  const groups = [...new Set(scoped.map((e) => e.groupName))]
  const lastVisit = history.find(attended)

  if (history.length === 0) {
    return (
      <div className={`${PARENT_CARD} py-10 text-center`}>
        <p className="font-semibold text-text">Статистики пока нет</p>
        <p className="mt-1 text-sm text-text-secondary">Тренер ещё не отмечал занятия — после первых отметок здесь появятся графики</p>
      </div>
    )
  }

  const insight =
    streak.missedInRow >= 2
      ? { text: `${streak.missedInRow} ${plural(streak.missedInRow, 'занятие', 'занятия', 'занятий')} подряд пропущено. Если что-то случилось — предупредите тренера.`, cls: 'bg-error-bg text-error' }
      : streak.current >= 3
        ? { text: `${streak.current} ${plural(streak.current, 'тренировка', 'тренировки', 'тренировок')} подряд без пропусков — отличный ритм!`, cls: 'bg-brand-green-light text-brand-green' }
        : null

  return (
    <div className="space-y-3">
      <div role="tablist" aria-label="Период" className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={period === p.id}
            onClick={() => setPeriod(p.id)}
            className={`min-h-9 rounded-full px-4 text-sm font-semibold transition ${
              period === p.id ? 'bg-brand-green text-white' : 'bg-white text-text-secondary ring-1 ring-border-light'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Посещено', value: now.present, tone: 'text-brand-green' },
          { label: 'Пропущено', value: now.absent, tone: 'text-error' },
          { label: 'Посещаемость', value: now.rate != null ? `${now.rate}%` : '—', tone: 'text-text' },
        ].map((t) => (
          <div key={t.label} className={`${PARENT_CARD} px-3 text-center`}>
            <p className={`text-2xl font-extrabold tabular-nums ${t.tone}`}>{t.value}</p>
            <p className="mt-1 text-[11px] font-medium text-text-secondary">{t.label}</p>
          </div>
        ))}
      </div>

      {(trend != null || insight) && (
        <div className="space-y-2">
          {trend != null && (
            <p className="rounded-2xl bg-white px-4 py-3 text-sm text-text-secondary ring-1 ring-border-light">
              {trend === 0 ? (
                config.same
              ) : (
                <>
                  <b className={trend > 0 ? 'text-brand-green' : 'text-error'}>
                    {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}%
                  </b>{' '}
                  по сравнению с {config.prev}
                </>
              )}
            </p>
          )}
          {insight && <p className={`rounded-2xl px-4 py-3 text-sm font-semibold ${insight.cls}`}>{insight.text}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className={PARENT_CARD}>
          <p className="text-xs font-medium text-text-secondary">Серия сейчас</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-text">{streak.current}</p>
          <p className="text-[11px] text-text-muted">{plural(streak.current, 'занятие', 'занятия', 'занятий')} без пропусков</p>
        </div>
        <div className={PARENT_CARD}>
          <p className="text-xs font-medium text-text-secondary">Лучшая серия</p>
          <p className="mt-1 text-2xl font-extrabold tabular-nums text-text">{streak.best}</p>
          <p className="text-[11px] text-text-muted">
            {lastVisit ? `последнее посещение — ${formatDate(lastVisit.date)}` : 'посещений пока нет'}
          </p>
        </div>
      </div>

      <Card title="Посещаемость по месяцам" hint="Доля посещённых занятий">
        <div className="mt-4 flex h-36 items-end gap-2">
          {months.map((mo) => (
            <div key={mo.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[10px] font-semibold tabular-nums text-text-secondary">
                {mo.total ? `${mo.present}/${mo.total}` : ''}
              </span>
              <div className="flex w-full flex-1 items-end overflow-hidden rounded-lg bg-surface-muted">
                <div
                  className={`w-full rounded-lg transition-[height] duration-500 ${
                    mo.rate == null ? '' : mo.rate >= 75 ? 'bg-brand-green' : mo.rate >= 50 ? 'bg-warning' : 'bg-error'
                  }`}
                  style={{ height: `${mo.rate ?? 0}%` }}
                  title={mo.rate != null ? `${monthTitle(mo.month)}: ${mo.rate}%` : `${monthTitle(mo.month)}: нет отметок`}
                />
              </div>
              <span className={`text-[11px] font-semibold ${mo.month === currentMonth ? 'text-brand-green' : 'text-text-muted'}`}>
                {monthTitle(mo.month, true)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {now.present > 0 && (
        <Card title="В какие дни ходит" hint={`Посещения за ${config.id === 'all' ? 'всё время' : config.label.toLowerCase()}`}>
          <div className="mt-4 flex h-24 items-end gap-2">
            {WEEKDAYS.map((d, i) => (
              <div key={d} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[10px] font-semibold tabular-nums text-text-secondary">{weekdayCounts[i] || ''}</span>
                <div
                  className={`w-full rounded-md ${weekdayCounts[i] ? 'bg-brand-green/80' : 'bg-surface-muted'}`}
                  style={{ height: `${weekdayCounts[i] ? Math.max(12, (weekdayCounts[i] / weekdayMax) * 100) : 6}%` }}
                />
                <span className="text-[11px] font-semibold text-text-muted">{d}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {groups.length > 1 && (
        <Card title="По группам">
          <ul className="mt-3 space-y-3">
            {groups.map((g) => {
              const s = summarize(scoped.filter((e) => e.groupName === g))
              return (
                <li key={g}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-semibold text-text">{g}</span>
                    <span className="tabular-nums text-text-secondary">
                      {s.present}/{s.total} · {s.rate ?? 0}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                    <div className="h-full rounded-full bg-brand-green" style={{ width: `${s.rate ?? 0}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <MonthCalendar history={history} />
    </div>
  )
}
