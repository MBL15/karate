import { isAutoSchedule } from '../utils/schedule'
import { coachApi } from './coach'
import type { ScheduleSlot } from './types'

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * The backend seeds a template schedule for the first group when a club has no slots.
 * Slots with marked trainings are a real schedule (e.g. the demo club) and are kept.
 */
const realSchedules = new Set<number>()

export async function dropAutoSchedule(
  slots: ScheduleSlot[],
  ownGroupIds: Iterable<number>,
  reviewed: boolean,
): Promise<boolean> {
  if (reviewed) return false
  const ids = new Set(ownGroupIds)
  const own = slots.filter((s) => ids.has(s.groupId))
  if (!isAutoSchedule(own) || realSchedules.has(own[0].groupId)) return false

  const groupId = own[0].groupId
  const today = new Date()
  const from = new Date(today)
  from.setDate(today.getDate() - 30)
  const past = (await coachApi.classes(iso(from), iso(today)).catch(() => []))
    .filter((e) => e.groupId === groupId && !e.upcoming)
  const sessions = await Promise.all(past.map((e) => coachApi.getAttendance(e.groupId, e.date, e.startTime).catch(() => null)))
  if (sessions.some((s) => s?.sessionId)) {
    realSchedules.add(groupId)
    return false
  }

  for (const slot of own) await coachApi.deleteSchedule(slot.id).catch(() => undefined)
  return true
}
