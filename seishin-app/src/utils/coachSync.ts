import { coachApi } from '../api/coach'
import type { BadgeDefinition } from '../api/types'
import { COLORS, rankLabel, stepName, type BeltStep } from './beltSystem'

export function beltSortOrder(level: BeltStep) {
  if (level.rank === 'dan') return 100 + level.number
  return level.number
}

export function serverBeltName(level: BeltStep) {
  return `${rankLabel(level)} · ${stepName(level)}`
}

export async function syncAssignBelt(studentId: number, level: BeltStep) {
  return coachApi.assignBelt(studentId, {
    name: serverBeltName(level),
    color: COLORS[level.color].hex,
    sortOrder: beltSortOrder(level),
  })
}

export async function resolveBadgeId(badge: BadgeDefinition, cached?: BadgeDefinition[]) {
  if (badge.id > 0) return badge.id
  const list = cached ?? (await coachApi.badges())
  const key = badge.name.trim().toLowerCase()
  const found = list.find((b) => b.name.trim().toLowerCase() === key)
  if (!found) throw new Error(`Значок «${badge.name}» не найден на сервере`)
  return found.id
}

export const BADGE_EVENT_NOTE_PREFIX = 'kh-event:'

export function badgeEventNote(eventKey: string) {
  return `${BADGE_EVENT_NOTE_PREFIX}${eventKey}`
}
