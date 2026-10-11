/** На главной родителя мероприятия появляются за столько дней до начала; в «Событиях» — все. */
export const SOON_DAYS = 14

export function daysUntil(iso: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const day = new Date(`${iso}T00:00:00`)
  return Math.round((day.getTime() - today.getTime()) / 86_400_000)
}

export function isSoon(iso: string) {
  const n = daysUntil(iso)
  return n >= 0 && n <= SOON_DAYS
}

function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}

export function whenLabel(iso: string) {
  const n = daysUntil(iso)
  if (n <= 0) return 'сегодня'
  if (n === 1) return 'завтра'
  if (n < 60) return `через ${n} ${plural(n, 'день', 'дня', 'дней')}`
  const months = Math.round(n / 30)
  return `через ${months} ${plural(months, 'месяц', 'месяца', 'месяцев')}`
}

export function monthTitle(iso: string) {
  const d = new Date(`${iso}T12:00:00`)
  const title = d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }).replace(' г.', '')
  return title[0].toUpperCase() + title.slice(1)
}
