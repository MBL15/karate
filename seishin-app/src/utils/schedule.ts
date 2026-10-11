export const WEEKDAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export function hhmm(value?: string | null) {
  return value ? value.slice(0, 5) : ''
}

const AUTO_SIGNATURE = '1-17:00-18:00,3-17:00-18:00,5-17:00-18:00,6-11:00-12:30'

export function isAutoSchedule(slots: { groupId: number; weekday: number; startTime: string; endTime?: string | null; location?: string | null }[]) {
  if (slots.length !== 4 || slots.some((s) => s.groupId !== slots[0].groupId)) return false
  const signature = slots
    .map((s) => `${s.weekday}-${hhmm(s.startTime)}-${hhmm(s.endTime)}`)
    .sort()
    .join(',')
  return signature === AUTO_SIGNATURE && slots.every((s) => s.location === 'Зал Karate Hub')
}

export function slotRange(slot: { startTime: string; endTime?: string | null }) {
  const end = hhmm(slot.endTime)
  return end ? `${hhmm(slot.startTime)} – ${end}` : hhmm(slot.startTime)
}
