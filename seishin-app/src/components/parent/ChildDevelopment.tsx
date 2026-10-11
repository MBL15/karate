import type { ReactNode } from 'react'
import type { Achievement, HistoryEntry, ParentChildHome } from '../../api/types'
import { activityGrid, isAttended, localIso, monthLabel, pathStats } from '../../utils/athletePath'
import type { ChildCompetitionResult } from '../../utils/competitionResults'
import { formatDate } from '../../utils/format'
import { PROGRESS_WEIGHTS } from '../../utils/nextBeltProgress'
import { beltTitle, parentReadiness, type ReadinessFactor } from '../../utils/parentReadiness'
import { BadgeToken } from '../ui/BadgeToken'
import {
  IconActivity,
  IconAward,
  IconCalendar,
  IconChart,
  IconDumbbell,
  IconSparkles,
  IconTimer,
  IconTrophy,
  IconUsers,
} from '../ui/Icons'
import { BeltMark } from './ParentTopBar'
import { PARENT_CARD } from './parentUi'

const DAY = 86_400_000
const TRAINING_STEPS = [1, 10, 25, 50, 100, 200, 300, 500]
const BADGE_STEPS = [1, 5, 10, 25, 50]
const MONTH_STEPS = [1, 3, 6, 12, 24, 36]

function plural(n: number, one: string, few: string, many: string) {
  const m10 = Math.floor(n) % 10
  const m100 = Math.floor(n) % 100
  if (!Number.isInteger(n)) return few
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}

const num = (n: number) => String(n).replace('.', ',')
const isoDaysAgo = (days: number) => localIso(new Date(Date.now() - days * DAY))

function addMonths(iso: string, months: number) {
  const d = new Date(`${iso}T12:00:00`)
  d.setMonth(d.getMonth() + months)
  return localIso(d)
}

function monthsBetween(fromIso: string, to = new Date()) {
  const from = new Date(`${fromIso}T12:00:00`)
  let m = (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth()
  if (to.getDate() < from.getDate()) m -= 1
  return Math.max(0, m)
}

function clubAge(months: number, sinceIso: string) {
  if (months < 1) {
    const days = Math.max(1, Math.round((Date.now() - new Date(`${sinceIso}T12:00:00`).getTime()) / DAY))
    return `${days} ${plural(days, 'день', 'дня', 'дней')}`
  }
  const years = Math.floor(months / 12)
  const rest = months % 12
  const parts = []
  if (years) parts.push(`${years} ${plural(years, 'год', 'года', 'лет')}`)
  if (rest) parts.push(`${rest} ${plural(rest, 'месяц', 'месяца', 'месяцев')}`)
  return parts.join(' ')
}

function trainingMinutes(home: ParentChildHome) {
  const t = home.nextTraining
  if (!t?.endTime) return 60
  const [sh, sm] = t.startTime.split(':').map(Number)
  const [eh, em] = t.endTime.split(':').map(Number)
  const minutes = eh * 60 + em - (sh * 60 + sm)
  return minutes >= 30 && minutes <= 240 ? minutes : 60
}

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className={PARENT_CARD}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-bold text-text">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

function Bar({ value, className }: { value: number; className: string }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
      <div className={`h-full rounded-full transition-[width] duration-700 ${className}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

function Ring({ value }: { value: number }) {
  const r = 30
  const c = 2 * Math.PI * r
  return (
    <span className="relative inline-flex size-[76px] shrink-0 items-center justify-center">
      <svg viewBox="0 0 76 76" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="38" cy="38" r={r} fill="none" strokeWidth="7" className="stroke-surface-muted" />
        <circle
          cx="38"
          cy="38"
          r={r}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          className="stroke-brand-green transition-[stroke-dashoffset] duration-700"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(100, value) / 100)}
        />
      </svg>
      <span className="text-lg font-extrabold text-text">{value}%</span>
    </span>
  )
}

const FACTOR_UI: Record<ReadinessFactor['key'], { icon: ReactNode; tile: string; bar: string }> = {
  sessions: { icon: <IconCalendar size={16} />, tile: 'bg-brand-green-light text-brand-green', bar: 'bg-brand-green' },
  badges: { icon: <IconAward size={16} />, tile: 'bg-warning-bg text-warning', bar: 'bg-warning' },
  competitions: { icon: <IconTrophy size={16} />, tile: 'bg-brand-blue-light text-brand-blue', bar: 'bg-brand-blue' },
}

function BeltCard({ home, history, achievements }: { home: ParentChildHome; history: HistoryEntry[]; achievements: Achievement[] }) {
  const { percent, factors } = parentReadiness(history, achievements, home.upcomingCompetitions ?? [])
  const clubScore = home.beltAssignmentMode === 'READINESS' && home.progressPercent != null ? Math.round(home.progressPercent) : null

  return (
    <Section title={home.maxRank ? 'Пояс' : 'К следующему поясу'}>
      <div className="mt-3 flex items-center gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="flex items-center gap-2 text-sm font-semibold text-text">
            <BeltMark color={home.beltColor} />
            {beltTitle(home.beltName)}
            <span className="text-xs font-normal text-text-muted">сейчас</span>
          </p>
          {home.maxRank ? (
            <p className="text-sm text-text-secondary">Высший пояс в системе клуба</p>
          ) : (
            <p className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
              <BeltMark color={home.nextBeltColor} />
              {beltTitle(home.nextBeltName)}
              <span className="text-xs font-normal text-text-muted">следующий</span>
            </p>
          )}
        </div>
        {!home.maxRank && <Ring value={percent} />}
      </div>

      {!home.maxRank && (
        <>
          <ul className="mt-4 space-y-3 border-t border-border-light pt-4">
            {factors.map((f) => {
              const ui = FACTOR_UI[f.key]
              return (
                <li key={f.key} className="flex items-center gap-3">
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${ui.tile}`}>{ui.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                      <span className="font-semibold text-text">{f.label}</span>
                      <span className="font-bold text-text tabular-nums">
                        {Math.min(f.done, f.need)} / {f.need}
                      </span>
                    </div>
                    <Bar value={(f.done / f.need) * 100} className={ui.bar} />
                  </div>
                </li>
              )
            })}
            {clubScore != null && (
              <li className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f3e8ff] text-[#7c3aed]">
                  <IconSparkles size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-semibold text-text">Готовность по данным клуба</span>
                    <span className="font-bold text-text">{clubScore}%</span>
                  </div>
                  <Bar value={clubScore} className="bg-[#7c3aed]" />
                </div>
              </li>
            )}
          </ul>
          <p className="mt-3 text-[11px] leading-relaxed text-text-muted">
            {home.beltAssignmentMode === 'MANUAL' ? `${home.progressLabel}. ` : ''}
            Готовность: тренировки {PROGRESS_WEIGHTS.sessions}%, значки {PROGRESS_WEIGHTS.badges}%, мероприятия {PROGRESS_WEIGHTS.competitions}%. Решение
            об аттестации принимает тренер.
          </p>
        </>
      )}
    </Section>
  )
}

type Fact = { key: string; icon: ReactNode; tile: string; value: string; text: string }
type PathEvent = { key: string; date: string; icon: ReactNode; tile: string; title: string; note?: string; badge?: string }

const HEAT: Record<string, string> = {
  attended: 'bg-brand-green',
  missed: 'bg-error/50',
  none: 'bg-surface-muted',
  future: 'bg-transparent',
}

function ActivityMap({ history }: { history: HistoryEntry[] }) {
  const grid = activityGrid(history, 18)
  const months: { index: number; label: string }[] = []
  grid.forEach((col, i) => {
    const first = col.find((c) => c.date.endsWith('-01') || (i === 0 && c === col[0]))
    if (first && (months.length === 0 || i - months[months.length - 1].index >= 3)) months.push({ index: i, label: new Date(`${first.date}T12:00:00`).toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '') })
  })
  return (
    <div className="mt-3">
      <div className="relative mb-1 h-4 text-[10px] text-text-muted">
        {months.map((m) => (
          <span key={m.index} className="absolute" style={{ left: `${(m.index / grid.length) * 100}%` }}>
            {m.label}
          </span>
        ))}
      </div>
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${grid.length}, minmax(0, 1fr))` }}>
        {grid.map((col, w) => (
          <div key={w} className="grid gap-[3px]">
            {col.map((cell) => (
              <span
                key={cell.date}
                title={`${formatDate(cell.date)}${cell.status === 'attended' ? ' · тренировка' : cell.status === 'missed' ? ' · пропуск' : ''}`}
                className={`aspect-square rounded-[3px] ${HEAT[cell.status]}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-3 text-[11px] text-text-secondary">
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-[3px] bg-brand-green" /> тренировка
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-[3px] bg-error/50" /> пропуск
        </span>
        <span className="ml-auto">последние 18 недель</span>
      </div>
    </div>
  )
}

export function ChildDevelopment({
  home,
  history,
  achievements,
  results,
  recommendation,
}: {
  home: ParentChildHome
  history: HistoryEntry[]
  achievements: Achievement[]
  results: ChildCompetitionResult[]
  recommendation: string | null
}) {
  const own = history.filter((e) => e.status !== 'GUEST')
  const attendedAsc = own.filter(isAttended).sort((a, b) => a.date.localeCompare(b.date))
  const firstDate = own.reduce<string | null>((min, e) => (!min || e.date < min ? e.date : min), null)
  const months = firstDate ? monthsBetween(firstDate) : 0
  const badges = achievements.reduce((sum, a) => sum + a.earnedCount, 0)
  const planned = (home.upcomingCompetitions ?? []).filter((c) => c.rsvpStatus === 'CONFIRMED')
  const medals = results.filter((r) => r.place > 0).length
  const stats = pathStats(history)

  const recent = attendedAsc.filter((e) => e.date > isoDaysAgo(28)).length
  const before = attendedAsc.filter((e) => e.date > isoDaysAgo(56) && e.date <= isoDaysAgo(28)).length
  const recentAll = own.filter((e) => e.date > isoDaysAgo(28)).length
  const recentRate = recentAll ? Math.round((recent / recentAll) * 100) : null
  const perWeek = Math.round((recent / 4) * 10) / 10
  const recentBadges = achievements.filter((a) => a.lastIssuedAt && localIso(new Date(a.lastIssuedAt)) > isoDaysAgo(28))

  const trend =
    recent === 0 && before === 0
      ? null
      : recent > before
        ? { text: `На ${recent - before} ${plural(recent - before, 'тренировку', 'тренировки', 'тренировок')} больше, чем за прошлые 4 недели`, className: 'text-brand-green' }
        : recent < before
          ? { text: `На ${before - recent} ${plural(before - recent, 'тренировку', 'тренировки', 'тренировок')} меньше, чем за прошлые 4 недели`, className: 'text-warning' }
          : { text: 'Столько же, сколько за прошлые 4 недели', className: 'text-text-secondary' }

  const hours = Math.round((attendedAsc.length * trainingMinutes(home)) / 60)
  const facts: Fact[] = []
  if (stats.longestStreak >= 2) {
    facts.push({
      key: 'streak',
      icon: <IconActivity size={16} />,
      tile: 'bg-brand-green-light text-brand-green',
      value: `${stats.longestStreak} подряд`,
      text:
        stats.currentStreak === stats.longestStreak
          ? 'Рекордная серия без пропусков — и она продолжается'
          : `Рекордная серия без пропусков. Сейчас: ${stats.currentStreak}`,
    })
  }
  if (attendedAsc.length > 0) {
    facts.push({
      key: 'hours',
      icon: <IconTimer size={16} />,
      tile: 'bg-brand-blue-light text-brand-blue',
      value: `≈ ${hours} ${plural(hours, 'час', 'часа', 'часов')}`,
      text: 'на татами за всё время',
    })
  }
  if (stats.bestMonth && stats.bestMonth.count >= 2) {
    facts.push({
      key: 'month',
      icon: <IconTrophy size={16} />,
      tile: 'bg-[#fff4d6] text-[#b7791f]',
      value: monthLabel(stats.bestMonth.key),
      text: `Лучший месяц — ${stats.bestMonth.count} ${plural(stats.bestMonth.count, 'тренировка', 'тренировки', 'тренировок')}`,
    })
  }
  if (stats.favoriteDay) {
    facts.push({
      key: 'day',
      icon: <IconCalendar size={16} />,
      tile: 'bg-[#f3e8ff] text-[#7c3aed]',
      value: stats.favoriteDay.name[0].toUpperCase() + stats.favoriteDay.name.slice(1),
      text: `Любимый день — ${stats.favoriteDay.share}% тренировок по ${stats.favoriteDay.plural}`,
    })
  }
  if (stats.pace) {
    const faster = stats.pace.now > stats.pace.start
    facts.push({
      key: 'pace',
      icon: <IconChart size={16} />,
      tile: faster ? 'bg-brand-green-light text-brand-green' : 'bg-surface-muted text-text-secondary',
      value: `${num(stats.pace.now)} в месяц`,
      text: faster
        ? `Тренируется чаще, чем в начале (было ${num(stats.pace.start)})`
        : stats.pace.now < stats.pace.start
          ? `В начале было ${num(stats.pace.start)} в месяц`
          : 'Стабильный темп с самого начала',
    })
  }
  if (stats.thisYear > 0) {
    const diff = stats.thisYear - stats.lastYearSamePeriod
    facts.push({
      key: 'year',
      icon: <IconSparkles size={16} />,
      tile: 'bg-brand-blue-light text-brand-blue',
      value: `${stats.thisYear} в ${new Date().getFullYear()}`,
      text:
        stats.lastYearSamePeriod > 0
          ? diff >= 0
            ? `На ${diff} больше, чем к этой дате в прошлом году`
            : `На ${-diff} меньше, чем к этой дате в прошлом году`
          : 'Тренировок в этом году',
    })
  }
  if (stats.longestBreak) {
    facts.push({
      key: 'break',
      icon: <IconActivity size={16} />,
      tile: 'bg-surface-muted text-text-secondary',
      value: `${stats.longestBreak.days} ${plural(stats.longestBreak.days, 'день', 'дня', 'дней')}`,
      text: `Самый долгий перерыв, возвращение на татами — ${formatDate(stats.longestBreak.returned)}`,
    })
  }
  if (stats.favoriteGroup) {
    facts.push({
      key: 'group',
      icon: <IconUsers size={16} />,
      tile: 'bg-brand-green-light text-brand-green',
      value: stats.favoriteGroup,
      text: 'Группа, где больше всего тренировок',
    })
  }

  const nextStep = (steps: number[], value: number) => steps.find((s) => s > value) ?? null
  const goals = [
    { key: 't', next: nextStep(TRAINING_STEPS, attendedAsc.length), done: attendedAsc.length, word: (n: number) => plural(n, 'тренировка', 'тренировки', 'тренировок') },
    { key: 'b', next: nextStep(BADGE_STEPS, badges), done: badges, word: (n: number) => plural(n, 'значок', 'значка', 'значков') },
    { key: 'm', next: nextStep(MONTH_STEPS, months), done: months, word: (n: number) => `${plural(n, 'месяц', 'месяца', 'месяцев')} в клубе` },
  ].filter((g) => g.next != null) as { key: string; next: number; done: number; word: (n: number) => string }[]

  const path: PathEvent[] = []
  if (attendedAsc[0]) {
    path.push({
      key: 'first',
      date: attendedAsc[0].date,
      icon: <IconSparkles size={16} />,
      tile: 'bg-brand-blue-light text-brand-blue',
      title: 'Первая тренировка',
      note: attendedAsc[0].groupName,
    })
  }
  for (const step of TRAINING_STEPS.slice(1)) {
    const entry = attendedAsc[step - 1]
    if (!entry) break
    path.push({ key: `t${step}`, date: entry.date, icon: <IconCalendar size={16} />, tile: 'bg-brand-green-light text-brand-green', title: `${step}-я тренировка` })
  }
  if (firstDate) {
    for (const step of MONTH_STEPS) {
      if (step > months) break
      path.push({
        key: `m${step}`,
        date: addMonths(firstDate, step),
        icon: <IconSparkles size={16} />,
        tile: 'bg-brand-blue-light text-brand-blue',
        title: step % 12 === 0 ? `${step / 12} ${plural(step / 12, 'год', 'года', 'лет')} в клубе` : `${step} ${plural(step, 'месяц', 'месяца', 'месяцев')} в клубе`,
      })
    }
  }
  for (const a of achievements) {
    if (!a.lastIssuedAt || a.earnedCount === 0) continue
    path.push({
      key: `b${a.badgeId}`,
      date: localIso(new Date(a.lastIssuedAt)),
      icon: <IconAward size={16} />,
      tile: 'bg-warning-bg text-warning',
      title: a.earnedCount > 1 ? `Значок «${a.name}» ×${a.earnedCount}` : `Значок «${a.name}»`,
      note: a.description,
      badge: a.name,
    })
  }
  for (const r of results) {
    path.push({
      key: `r${r.competitionId}`,
      date: r.eventDate,
      icon: <IconTrophy size={16} />,
      tile: 'bg-[#fff4d6] text-[#b7791f]',
      title: r.place > 0 ? `${r.place} место — ${r.competitionName}` : `Участие — ${r.competitionName}`,
      note: r.category || undefined,
    })
  }
  path.sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="space-y-3">
      <section className={`${PARENT_CARD} bg-gradient-to-br from-brand-green-light/70 to-white`}>
        <p className="text-xs font-bold uppercase tracking-wider text-brand-green">В каратэ</p>
        {firstDate ? (
          <>
            <p className="mt-1 text-2xl font-extrabold text-text">{clubAge(months, firstDate)}</p>
            <p className="text-sm text-text-secondary">с {formatDate(firstDate)}</p>
          </>
        ) : (
          <p className="mt-1 text-sm text-text-secondary">История начнётся после первой отмеченной тренировки</p>
        )}
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            { value: attendedAsc.length, label: plural(attendedAsc.length, 'тренировка', 'тренировки', 'тренировок') },
            { value: badges, label: plural(badges, 'значок', 'значка', 'значков') },
            { value: planned.length + results.length, label: plural(planned.length + results.length, 'турнир', 'турнира', 'турниров') },
            { value: medals, label: plural(medals, 'медаль', 'медали', 'медалей') },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/80 px-1 py-2.5 ring-1 ring-border-light">
              <p className="text-xl font-extrabold text-text">{s.value}</p>
              <p className="truncate text-[11px] text-text-secondary">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <BeltCard home={home} history={history} achievements={achievements} />

      <Section title="Последние 4 недели" aside={<IconActivity size={18} className="text-text-muted" />}>
        {recentAll === 0 ? (
          <p className="mt-2 text-sm text-text-secondary">За последние 4 недели отметок не было.</p>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                { value: String(recent), label: 'тренировок' },
                { value: num(perWeek), label: 'в неделю' },
                { value: `${recentRate ?? '—'}%`, label: 'посещаемость' },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-surface-muted px-1 py-2.5">
                  <p className="text-xl font-extrabold text-text">{s.value}</p>
                  <p className="text-[11px] text-text-secondary">{s.label}</p>
                </div>
              ))}
            </div>
            {trend && <p className={`mt-3 text-sm font-semibold ${trend.className}`}>{trend.text}</p>}
          </>
        )}
        {recentBadges.length > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-warning-bg/60 px-3 py-2">
            <BadgeToken name={recentBadges[0].name} size="sm" />
            <p className="min-w-0 flex-1 text-sm text-text">
              Новые значки: <span className="font-semibold">{recentBadges.map((b) => b.name).join(', ')}</span>
            </p>
          </div>
        )}
      </Section>

      <Section title="Путь спортсмена" aside={<IconChart size={18} className="text-text-muted" />}>
        {attendedAsc.length === 0 && path.length === 0 ? (
          <p className="mt-2 text-sm text-text-secondary">
            После первых тренировок здесь появятся рекорды, интересные факты, карта активности и важные моменты.
          </p>
        ) : (
          <>
            {facts.length > 0 && (
              <>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-text-muted">Рекорды и факты</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {facts.map((f) => (
                    <div key={f.key} className="rounded-2xl bg-surface-muted p-3">
                      <span className={`flex size-7 items-center justify-center rounded-lg ${f.tile}`}>{f.icon}</span>
                      <p className="mt-2 truncate text-[15px] font-extrabold leading-tight text-text">{f.value}</p>
                      <p className="mt-0.5 text-[11px] leading-snug text-text-secondary">{f.text}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            <p className="mt-5 text-[11px] font-bold uppercase tracking-wider text-text-muted">Карта активности</p>
            <ActivityMap history={history} />

            {goals.length > 0 && (
              <>
                <p className="mt-5 text-[11px] font-bold uppercase tracking-wider text-text-muted">Следующие вехи</p>
                <ul className="mt-2 space-y-2">
                  {goals.map((g) => (
                    <li key={g.key} className="rounded-2xl border border-border-light px-3 py-2.5">
                      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                        <span className="font-semibold text-text">
                          {g.next} {g.word(g.next)}
                        </span>
                        <span className="text-xs text-text-secondary">осталось {g.next - g.done}</span>
                      </div>
                      <Bar value={(g.done / g.next) * 100} className="bg-brand-green" />
                    </li>
                  ))}
                </ul>
              </>
            )}

            {path.length > 0 && (
              <>
                <p className="mt-5 text-[11px] font-bold uppercase tracking-wider text-text-muted">Важные моменты</p>
                <ol className="relative mt-3 space-y-3 before:absolute before:top-2 before:bottom-2 before:left-[17px] before:w-px before:bg-border-light">
                  {path.slice(0, 20).map((e) => (
                    <li key={e.key} className="relative flex items-start gap-3">
                      <span className={`relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${e.tile}`}>
                        {e.icon}
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-sm font-semibold text-text">{e.title}</p>
                        <p className="truncate text-xs text-text-secondary">
                          {formatDate(e.date)}
                          {e.note ? ` · ${e.note}` : ''}
                        </p>
                      </div>
                      {e.badge && <BadgeToken name={e.badge} size="sm" />}
                    </li>
                  ))}
                </ol>
              </>
            )}
          </>
        )}
        <p className="mt-4 text-[11px] leading-snug text-text-muted">
          Даты аттестаций на пояса и места на турнирах появятся в ленте, когда тренер начнёт отмечать их на сервере.
        </p>
      </Section>

      <Section title="Оценка тренера" aside={<span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-bold text-text-muted">СКОРО</span>}>
        <p className="mt-1 text-xs leading-relaxed text-text-secondary">
          Тренер будет оценивать навыки после аттестаций и раз в месяц — здесь появится, как растут техника и физическая форма.
        </p>
        <ul className="mt-3 space-y-2.5">
          {[
            { label: 'Техника (кихон)', icon: <IconSparkles size={14} /> },
            { label: 'Ката', icon: <IconChart size={14} /> },
            { label: 'Кумитэ', icon: <IconTrophy size={14} /> },
            { label: 'Физподготовка', icon: <IconDumbbell size={14} /> },
            { label: 'Дисциплина и внимание', icon: <IconActivity size={14} /> },
          ].map((s) => (
            <li key={s.label} className="flex items-center gap-3 opacity-60">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-text-muted">{s.icon}</span>
              <span className="w-36 shrink-0 truncate text-sm text-text">{s.label}</span>
              <span className="h-1.5 flex-1 rounded-full bg-surface-muted" />
            </li>
          ))}
        </ul>
        {recommendation && (
          <p className="mt-4 rounded-xl bg-brand-green-light px-3 py-2.5 text-sm text-text">
            <span className="font-semibold">Тренер: </span>
            {recommendation}
          </p>
        )}
      </Section>
    </div>
  )
}
