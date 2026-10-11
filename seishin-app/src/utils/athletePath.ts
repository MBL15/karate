import type { HistoryEntry } from '../api/types'

const DAY = 86_400_000
const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']
const WEEKDAYS_ACC = ['воскресеньям', 'понедельникам', 'вторникам', 'средам', 'четвергам', 'пятницам', 'субботам']

export const isAttended = (e: HistoryEntry) => e.status === 'PRESENT' || e.status === 'MAKEUP'

const toDate = (iso: string) => new Date(`${iso}T12:00:00`)
const dayDiff = (a: string, b: string) => Math.round((toDate(b).getTime() - toDate(a).getTime()) / DAY)

export function localIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function monthLabel(key: string) {
  const label = toDate(`${key}-15`).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }).replace(' г.', '')
  return label[0].toUpperCase() + label.slice(1)
}

export type PathStats = {
  attended: number
  longestStreak: number
  currentStreak: number
  bestMonth: { key: string; count: number } | null
  favoriteDay: { name: string; plural: string; share: number } | null
  longestBreak: { days: number; returned: string } | null
  thisYear: number
  lastYearSamePeriod: number
  favoriteGroup: string | null
  pace: { start: number; now: number } | null
}

/** Аналитика по истории посещений ребёнка (без гостевых визитов в другие группы). */
export function pathStats(history: HistoryEntry[], today = new Date()): PathStats {
  const own = history.filter((e) => e.status !== 'GUEST').sort((a, b) => a.date.localeCompare(b.date))
  const attended = own.filter(isAttended)

  let longestStreak = 0
  let run = 0
  for (const e of own) {
    run = isAttended(e) ? run + 1 : 0
    longestStreak = Math.max(longestStreak, run)
  }
  const currentStreak = run

  const byMonth = new Map<string, number>()
  const byDay = new Array(7).fill(0) as number[]
  const byGroup = new Map<string, number>()
  for (const e of attended) {
    byMonth.set(e.date.slice(0, 7), (byMonth.get(e.date.slice(0, 7)) ?? 0) + 1)
    byDay[toDate(e.date).getDay()] += 1
    byGroup.set(e.groupName, (byGroup.get(e.groupName) ?? 0) + 1)
  }
  let bestMonth: PathStats['bestMonth'] = null
  for (const [key, count] of byMonth) if (!bestMonth || count > bestMonth.count) bestMonth = { key, count }

  const topDay = byDay.indexOf(Math.max(...byDay))
  const favoriteDay =
    attended.length >= 4 ? { name: WEEKDAYS[topDay], plural: WEEKDAYS_ACC[topDay], share: Math.round((byDay[topDay] / attended.length) * 100) } : null

  let longestBreak: PathStats['longestBreak'] = null
  for (let i = 1; i < attended.length; i++) {
    const days = dayDiff(attended[i - 1].date, attended[i].date)
    if (days > 10 && (!longestBreak || days > longestBreak.days)) longestBreak = { days, returned: attended[i].date }
  }

  const year = today.getFullYear()
  const todayIso = localIso(today)
  const sameDayLastYear = `${year - 1}${todayIso.slice(4)}`
  const thisYear = attended.filter((e) => e.date.startsWith(String(year))).length
  const lastYearSamePeriod = attended.filter((e) => e.date.startsWith(String(year - 1)) && e.date <= sameDayLastYear).length

  let favoriteGroup: string | null = null
  if (byGroup.size > 1) favoriteGroup = [...byGroup.entries()].sort((a, b) => b[1] - a[1])[0][0]

  let pace: PathStats['pace'] = null
  const months = [...byMonth.keys()].sort()
  if (months.length >= 6) {
    const avg = (keys: string[]) => Math.round((keys.reduce((s, k) => s + (byMonth.get(k) ?? 0), 0) / keys.length) * 10) / 10
    pace = { start: avg(months.slice(0, 3)), now: avg(months.slice(-3)) }
  }

  return { attended: attended.length, longestStreak, currentStreak, bestMonth, favoriteDay, longestBreak, thisYear, lastYearSamePeriod, favoriteGroup, pace }
}

export type HeatCell = { date: string; status: 'attended' | 'missed' | 'none' | 'future' }

/** Сетка «неделя × день» за последние `weeks` недель, понедельник сверху. */
export function activityGrid(history: HistoryEntry[], weeks = 18, today = new Date()): HeatCell[][] {
  const byDate = new Map<string, 'attended' | 'missed'>()
  for (const e of history) {
    if (e.status === 'GUEST' && byDate.has(e.date)) continue
    byDate.set(e.date, isAttended(e) || e.status === 'GUEST' ? 'attended' : byDate.get(e.date) === 'attended' ? 'attended' : 'missed')
  }
  const start = new Date(today)
  start.setHours(12, 0, 0, 0)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - (weeks - 1) * 7)
  const todayIso = localIso(today)
  const grid: HeatCell[][] = []
  for (let w = 0; w < weeks; w++) {
    const col: HeatCell[] = []
    for (let d = 0; d < 7; d++) {
      const day = new Date(start)
      day.setDate(start.getDate() + w * 7 + d)
      const iso = localIso(day)
      col.push({ date: iso, status: iso > todayIso ? 'future' : (byDate.get(iso) ?? 'none') })
    }
    grid.push(col)
  }
  return grid
}
