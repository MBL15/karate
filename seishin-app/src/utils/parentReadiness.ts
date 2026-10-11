import type { Achievement, HistoryEntry, UpcomingCompetition } from '../api/types'
import { DEFAULT_NORMS } from './beltSystem'
import { PROGRESS_WEIGHTS } from './nextBeltProgress'

/** "7 кю" / "1 дан" из названия пояса, если тренер так его назвал. */
export function beltRank(beltName: string | null | undefined): string | null {
  const m = beltName?.match(/(\d+)\s*(кю|дан)/i)
  return m ? `${m[1]} ${m[2].toLowerCase()}` : null
}

export function beltTitle(beltName: string | null | undefined): string {
  const name = beltName?.trim()
  if (!name) return 'Пояс не назначен'
  return beltRank(name) ?? `${name} пояс`
}

export function attendedCount(history: HistoryEntry[]) {
  return history.filter((h) => h.status === 'PRESENT' || h.status === 'MAKEUP').length
}

/** Гостевые визиты в чужие группы не входят в посещаемость — как во вкладке «Посещения». */
export function attendanceRate(history: HistoryEntry[]) {
  const own = history.filter((h) => h.status !== 'GUEST')
  return own.length ? Math.round((attendedCount(own) / own.length) * 100) : 0
}

export function badgesEarned(achievements: Achievement[]) {
  return achievements.reduce((sum, a) => sum + a.earnedCount, 0)
}

export type ReadinessFactor = {
  key: 'sessions' | 'badges' | 'competitions'
  label: string
  unit: string
  done: number
  need: number
  weight: number
}

/** Веса как в карточке ученика у тренера (тренировки 50%, значки 30%, мероприятия 20%), но нормы — базовые: свои нормы клуба тренер хранит у себя. */
export function parentReadiness(
  history: HistoryEntry[],
  achievements: Achievement[],
  competitions: UpcomingCompetition[],
): { percent: number; factors: ReadinessFactor[] } {
  const factors: ReadinessFactor[] = [
    {
      key: 'sessions',
      label: 'Тренировки',
      unit: 'занятий',
      done: attendedCount(history),
      need: DEFAULT_NORMS.sessions,
      weight: PROGRESS_WEIGHTS.sessions,
    },
    {
      key: 'badges',
      label: 'Значки',
      unit: 'значков',
      done: badgesEarned(achievements),
      need: DEFAULT_NORMS.badges,
      weight: PROGRESS_WEIGHTS.badges,
    },
    {
      key: 'competitions',
      label: 'Мероприятия',
      unit: 'участий',
      done: competitions.filter((c) => c.rsvpStatus === 'CONFIRMED').length,
      need: DEFAULT_NORMS.competitions,
      weight: PROGRESS_WEIGHTS.competitions,
    },
  ]
  const total = factors.reduce((sum, f) => sum + f.weight, 0)
  const percent = factors.reduce((sum, f) => sum + (Math.min(f.done, f.need) / f.need) * f.weight, 0) / total * 100
  return { percent: Math.round(percent), factors }
}
