import type { BadgeDefinition, ClassEvent, Competition, SessionAttendance } from '../../../api/types'
import { studentTag, type StudentRef } from '../../../utils/beltSystem'

export function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function toIso(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

export function hhmm(value?: string | null) {
  return value ? value.slice(0, 5) : ''
}

export function eventRange(event: { startTime: string; endTime?: string | null }) {
  const end = hhmm(event.endTime)
  return end ? `${hhmm(event.startTime)} – ${end}` : hhmm(event.startTime)
}

export function shortDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', '')
}

export function weekdayLong(iso: string) {
  const label = new Date(`${iso}T12:00:00`).toLocaleDateString('ru-RU', { weekday: 'long' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function plural(n: number, one: string, few: string, many: string) {
  const n10 = n % 10
  const n100 = n % 100
  if (n10 === 1 && n100 !== 11) return one
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few
  return many
}

export function classKey(event: { groupId: number; date: string; startTime: string }) {
  return `${event.groupId}-${event.date}-${hhmm(event.startTime)}`
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function presentCount(session: SessionAttendance | null | undefined) {
  return session?.entries.filter((e) => e.status !== 'ABSENT').length ?? 0
}

export function isAttestation(competition: Competition) {
  return /аттестац/i.test(competition.name)
}

export function minutesUntil(event: ClassEvent, now: Date) {
  const [h, m] = event.startTime.split(':').map(Number)
  const start = new Date(`${event.date}T00:00:00`)
  start.setHours(h, m || 0, 0, 0)
  return Math.round((start.getTime() - now.getTime()) / 60000)
}

export function untilLabel(minutes: number) {
  if (minutes <= 0) return 'началась'
  if (minutes < 60) return `через ${minutes} мин`
  return `через ${Math.round(minutes / 60)} ч`
}

export const GROUP_TONES = [
  { bg: '#fff4e0', fg: '#d97706' },
  { bg: '#f3e8ff', fg: '#7c3aed' },
  { bg: '#eaf1fe', fg: '#2563eb' },
  { bg: '#e8f7ee', fg: '#16a34a' },
]

export const ABSENCE_REASONS = ['Болеет', 'Уважительная', 'Предупредили', 'Без причины'] as const

export const ABSENCE_KEY = 'absence-reasons'

export type AbsenceReasons = Record<string, string>

export const PAID_KEY = 'paid-months'

/** `${studentId}:${YYYY-MM}` → дата отметки оплаты (ISO) */
export type PaidMonths = Record<string, string>

export function paidKey(studentId: number, month: string) {
  return `${studentId}:${month}`
}

export const BADGES_KEY = 'issued-badges'

export type IssuedBadge = { studentId: number; badgeId: number; name: string; date: string; who?: string; eventKey?: string }

export const PRESET_BADGES: BadgeDefinition[] = [
  { id: -1, name: 'Дисциплина', description: 'Собранность и уважение на татами', cumulative: false, requiredCount: 0 },
  { id: -2, name: 'Техника', description: 'Чистое выполнение техники', cumulative: false, requiredCount: 0 },
  { id: -3, name: 'Старание', description: 'Работал в полную силу', cumulative: false, requiredCount: 0 },
  { id: -4, name: 'Прогресс', description: 'Заметный рост за тренировку', cumulative: false, requiredCount: 0 },
  { id: -5, name: 'Лидер', description: 'Помогал другим и вёл за собой', cumulative: false, requiredCount: 0 },
  { id: -6, name: 'Кумитэ', description: 'Лучший в спарринге', cumulative: false, requiredCount: 0 },
]

export function withPresetBadges(server: BadgeDefinition[]) {
  const taken = new Set(server.map((b) => b.name.trim().toLowerCase()))
  return [...server, ...PRESET_BADGES.filter((b) => !taken.has(b.name.toLowerCase()))]
}

export function badgesOf(log: IssuedBadge[], student: StudentRef) {
  const tag = studentTag(student)
  return log.filter((b) => b.studentId === student.id && (!b.who || b.who === tag))
}

export function monthLabel(month: string) {
  const label = new Date(`${month}-15T12:00:00`).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }).replace(' г.', '')
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number)
  const date = new Date(y, m - 1 + delta, 1)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

export const MARKS_KEY = 'attendance-marks'

export type LocalMarks = Record<string, Record<number, 'PRESENT' | 'ABSENT'>>

export type AttendanceSummary = { marked: boolean; present: number; absent: number; total: number }

export function summarizeAttendance(
  session: SessionAttendance | null | undefined,
  local: Record<number, 'PRESENT' | 'ABSENT'> | undefined,
  memberIds: number[],
): AttendanceSummary {
  const serverMarked = Boolean(session?.sessionId)
  const marked = serverMarked || Boolean(local && Object.keys(local).length)
  const ids = memberIds.length ? memberIds : (session?.entries.map((e) => e.studentId) ?? [])
  let present = 0
  let absent = 0
  for (const id of ids) {
    const status = local?.[id] ?? (serverMarked ? session?.entries.find((e) => e.studentId === id)?.status : undefined)
    if (!status) continue
    if (status === 'ABSENT') absent++
    else present++
  }
  return { marked, present, absent, total: ids.length }
}

export function markOf(
  session: SessionAttendance | null | undefined,
  local: Record<number, 'PRESENT' | 'ABSENT'> | undefined,
  studentId: number,
): 'PRESENT' | 'ABSENT' | null {
  const status = local?.[studentId] ?? (session?.sessionId ? session.entries.find((e) => e.studentId === studentId)?.status : undefined)
  if (!status) return null
  return status === 'ABSENT' ? 'ABSENT' : 'PRESENT'
}

export function reasonKey(event: { groupId: number; date: string; startTime: string }, studentId: number) {
  return `${classKey(event)}:${studentId}`
}
