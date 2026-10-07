export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export function childShortName(firstName: string, age: number): string {
  const nick = firstName === 'Михаил' ? 'Миша' : firstName
  return `${nick}, ${age} ${ageLabel(age)}`
}

function ageLabel(age: number): string {
  const mod10 = age % 10
  const mod100 = age % 100
  if (mod100 >= 11 && mod100 <= 14) return 'лет'
  if (mod10 === 1) return 'год'
  if (mod10 >= 2 && mod10 <= 4) return 'года'
  return 'лет'
}

export function paymentStatusUi(status: 'PAID' | 'OVERDUE' | 'PENDING', dueDate?: string) {
  switch (status) {
    case 'PAID':
      return { label: 'Оплачено', className: 'bg-[#e8f7ef] text-[#20a464]' }
    case 'OVERDUE':
      return { label: 'Просрочено', className: 'bg-[#fff0f1] text-[#d94b55]' }
    default:
      return {
        label: dueDate ? `До ${formatShortDate(dueDate)}` : 'Ожидает',
        className: 'bg-[#fff7dc] text-[#d7a62a]',
      }
  }
}

export function attendanceDayClass(status: 'PRESENT' | 'ABSENT' | 'MAKEUP' | 'GUEST') {
  if (status === 'ABSENT') return 'bg-[#fff0f1] text-[#d94b55]'
  if (status === 'MAKEUP') return 'bg-[#eef4ff] text-[#3b5bdb]'
  if (status === 'GUEST') return 'bg-[#fff7dc] text-[#d7a62a]'
  return 'bg-[#e8f7ef] text-[#20a464]'
}

export function parentTrainingIntentLabel(intent: 'CONFIRMED' | 'DECLINED' | 'PENDING' | null | undefined) {
  switch (intent) {
    case 'CONFIRMED':
      return { label: 'Будет', className: 'bg-[#e8f7ef] text-[#1f7a4d]' }
    case 'DECLINED':
      return { label: 'Не будет', className: 'bg-[#fff0f1] text-[#d94b55]' }
    case 'PENDING':
      return { label: 'Не ответил', className: 'bg-surface-muted text-text-muted' }
    default:
      return { label: 'Нет отметки', className: 'bg-surface-muted text-text-muted' }
  }
}

export function attendanceStatusLabel(status: 'PRESENT' | 'ABSENT' | 'MAKEUP' | 'GUEST') {
  switch (status) {
    case 'PRESENT':
      return 'Был'
    case 'ABSENT':
      return 'Нет'
    case 'MAKEUP':
      return 'Отработка'
    case 'GUEST':
      return 'Гость'
  }
}

const NEXT_BELT: Record<string, string> = {
  белый: 'жёлтого',
  желтый: 'оранжевого',
  жёлтый: 'оранжевого',
  оранжевый: 'зелёного',
  зеленый: 'синего',
  зелёный: 'синего',
  синий: 'коричневого',
  коричневый: 'чёрного',
  черный: 'мастера',
  чёрный: 'мастера',
}

export function nextBeltLabel(beltName: string): string {
  const key = beltName.trim().toLowerCase()
  return NEXT_BELT[key] ?? 'следующего пояса'
}

export function initialLetter(name: string): string {
  return (name.trim().charAt(0) || '?').toUpperCase()
}
