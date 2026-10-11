import type { Competition } from '../api/types'
import type { BeltNorms, BeltStep, BeltSystem, StudentBelt } from './beltSystem'
import { normsOf } from './beltSystem'

export const PROGRESS_WEIGHTS = { sessions: 50, badges: 30, competitions: 20 } as const

export type ProgressPart = { key: keyof BeltNorms; label: string; done: number; need: number; weight: number }

export type NextBeltProgress = {
  next: BeltStep | null
  percent: number
  parts: ProgressPart[]
}

export function nextLevel(system: BeltSystem, currentId: string | null | undefined): BeltStep | null {
  if (!currentId) return system.levels[0] ?? null
  const i = system.levels.findIndex((l) => l.id === currentId)
  return i < 0 ? (system.levels[0] ?? null) : (system.levels[i + 1] ?? null)
}

/** Норма 0 означает «не требуется»: вес такой части делится между остальными. */
export function nextBeltProgress(
  system: BeltSystem,
  currentId: string | null | undefined,
  done: Record<keyof BeltNorms, number>,
): NextBeltProgress {
  const norms = normsOf(system)
  const parts: ProgressPart[] = [
    { key: 'sessions', label: 'Тренировки', done: done.sessions, need: norms.sessions, weight: PROGRESS_WEIGHTS.sessions },
    { key: 'badges', label: 'Значки', done: done.badges, need: norms.badges, weight: PROGRESS_WEIGHTS.badges },
    { key: 'competitions', label: 'Соревнования', done: done.competitions, need: norms.competitions, weight: PROGRESS_WEIGHTS.competitions },
  ]
  const active = parts.filter((p) => p.need > 0)
  const totalWeight = active.reduce((sum, p) => sum + p.weight, 0)
  const percent =
    totalWeight === 0 ? 100 : active.reduce((sum, p) => sum + (Math.min(p.done, p.need) / p.need) * p.weight, 0) / totalWeight * 100
  return { next: nextLevel(system, currentId), percent: Math.round(percent), parts }
}

/** Значки и соревнования считаются с даты присвоения текущего пояса. */
export function studentProgress(
  system: BeltSystem,
  record: StudentBelt | null,
  student: { id: number; sessionsCompleted?: number | null },
  badges: { date: string }[],
  competitions: Competition[],
  today: string,
): NextBeltProgress {
  const since = record?.since ?? ''
  return nextBeltProgress(system, record?.levelId, {
    sessions: student.sessionsCompleted ?? 0,
    badges: badges.filter((b) => b.date >= since).length,
    competitions: competitions.filter(
      (c) =>
        c.eventDate >= since &&
        c.eventDate <= today &&
        c.registrations.some((r) => r.studentId === student.id && r.rsvpStatus === 'CONFIRMED'),
    ).length,
  })
}
