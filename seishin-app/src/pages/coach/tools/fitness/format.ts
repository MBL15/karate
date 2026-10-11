import { sideLabel, type WorkoutItem } from './generator'

export function plural(n: number, one: string, few: string, many: string) {
  const n10 = n % 10
  const n100 = n % 100
  if (n10 === 1 && n100 !== 11) return one
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few
  return many
}

export function clock(totalSeconds: number) {
  const s = Math.max(0, Math.ceil(totalSeconds))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export function approxMinutes(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = Math.round(totalSeconds % 60)
  return s ? `${m} мин ${s} сек` : `${m} мин`
}

export function setsLabel(sets: number) {
  return `${sets} ${plural(sets, 'подход', 'подхода', 'подходов')}`
}

export function volumeLabel(item: WorkoutItem) {
  if (item.reps != null) {
    const base = `${item.reps} ${plural(item.reps, 'повторение', 'повторения', 'повторений')}`
    return item.exercise.perSide ? `${item.reps} ${sideLabel(item.exercise)}` : base
  }
  return item.exercise.perSide ? `${item.seconds} сек ${sideLabel(item.exercise)}` : `${item.seconds} секунд`
}
