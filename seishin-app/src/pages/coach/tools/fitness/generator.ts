import { CATEGORIES, exerciseById, type Category, type Exercise } from './exercises'

export type Minutes = 5 | 10 | 15

export type WorkoutItem = {
  exercise: Exercise
  sets: number
  reps: number | null
  seconds: number | null
  rest: number
  note?: string
}

export type Workout = {
  title: string
  minutes: Minutes
  totalSeconds: number
  load: 'Лёгкая' | 'Средняя' | 'Высокая'
  items: WorkoutItem[]
  finisher: { name: string; description: string; seconds: number }
  insights: string[]
}

export type GeneratorInput = {
  categories: Category[]
  exerciseIds: string[]
  minutes: Minutes
  seed: number
}

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const MAX_EXERCISES: Record<Minutes, number> = { 5: 3, 10: 5, 15: 6 }
const FINISHER: Record<Minutes, number> = { 5: 30, 10: 45, 15: 60 }

const sideWord: Record<Category, string> = {
  core: 'на каждую сторону',
  legs: 'на каждую ногу',
  arms: 'на каждую руку',
}

export function sideLabel(exercise: Exercise) {
  return sideWord[exercise.category]
}

export function workSeconds(item: WorkoutItem) {
  const base = item.reps != null ? item.reps * item.exercise.secondsPerRep : (item.seconds ?? 0)
  return Math.round(base * (item.exercise.perSide ? 2 : 1))
}

function itemSeconds(item: WorkoutItem) {
  return item.sets * workSeconds(item) + item.sets * item.rest
}

export function totalSeconds(items: WorkoutItem[], finisher: number) {
  return items.reduce((sum, item) => sum + itemSeconds(item), 0) + finisher
}

function initial(exercise: Exercise): WorkoutItem {
  const d = exercise.difficulty
  const rest = d === 3 ? 40 : d === 2 ? 30 : 20
  if (exercise.mode === 'reps') {
    const reps = exercise.perSide ? ({ 3: 6, 2: 8, 1: 10 } as const)[d] : ({ 3: 8, 2: 12, 1: 15 } as const)[d]
    return { exercise, sets: 2, reps, seconds: null, rest }
  }
  const seconds = exercise.perSide ? ({ 3: 20, 2: 20, 1: 25 } as const)[d] : ({ 3: 25, 2: 30, 1: 35 } as const)[d]
  return { exercise, sets: 2, reps: null, seconds, rest }
}

function limits(item: WorkoutItem, count: number) {
  const easy = item.exercise.difficulty === 1
  return {
    maxSets: count === 1 ? 12 : count === 2 ? 7 : count <= 4 ? 5 : 4,
    maxReps: item.exercise.perSide ? (easy ? 16 : 12) : easy ? 25 : item.exercise.difficulty === 3 ? 15 : 20,
    minReps: item.exercise.perSide ? 5 : 6,
    maxSeconds: easy ? 60 : 45,
    minSeconds: 15,
  }
}

function pickBalanced(pool: Exercise[], cap: number, random: () => number) {
  if (pool.length <= cap) return pool
  const byCategory = new Map<Category, Exercise[]>()
  for (const ex of [...pool].sort(() => random() - 0.5)) {
    byCategory.set(ex.category, [...(byCategory.get(ex.category) ?? []), ex])
  }
  const picked: Exercise[] = []
  while (picked.length < cap) {
    for (const list of byCategory.values()) {
      const next = list.shift()
      if (next && picked.length < cap) picked.push(next)
    }
  }
  return picked
}

function orderExercises(list: Exercise[], random: () => number) {
  const jitter = new Map(list.map((ex) => [ex.id, random()]))
  const sorted = [...list].sort(
    (a, b) =>
      b.difficulty - a.difficulty ||
      Number(Boolean(b.explosive)) - Number(Boolean(a.explosive)) ||
      (jitter.get(a.id) ?? 0) - (jitter.get(b.id) ?? 0),
  )
  const ordered: Exercise[] = []
  while (sorted.length) {
    const last = ordered[ordered.length - 1]
    const index = sorted.findIndex((ex) => ex.category !== last?.category && ex.difficulty >= sorted[0].difficulty - 1)
    ordered.push(sorted.splice(index >= 0 ? index : 0, 1)[0])
  }
  return ordered
}

function fit(items: WorkoutItem[], budget: number) {
  let cursor = 0
  for (let guard = 0; guard < 400; guard++) {
    const total = totalSeconds(items, 0)
    const diff = budget - total
    if (Math.abs(diff) <= 10) return
    if (diff > 0) {
      let grown = false
      for (let step = 0; step < items.length && !grown; step++) {
        const item = items[(cursor + step) % items.length]
        const lim = limits(item, items.length)
        const setCost = workSeconds(item) + item.rest
        if (item.sets < lim.maxSets && setCost <= diff + 15) {
          item.sets += 1
          grown = true
        } else if (item.reps != null && item.reps < lim.maxReps) {
          item.reps = Math.min(lim.maxReps, item.reps + (item.exercise.difficulty === 3 ? 1 : 2))
          grown = true
        } else if (item.seconds != null && item.seconds < lim.maxSeconds) {
          item.seconds = Math.min(lim.maxSeconds, item.seconds + 5)
          grown = true
        }
      }
      cursor = (cursor + 1) % items.length
      if (!grown) return
    } else {
      const item = [...items].sort((a, b) => itemSeconds(b) - itemSeconds(a))[0]
      const lim = limits(item, items.length)
      if (item.sets > 2 && workSeconds(item) + item.rest <= -diff + 15) item.sets -= 1
      else if (item.reps != null && item.reps > lim.minReps) item.reps -= item.exercise.difficulty === 3 ? 1 : 2
      else if (item.seconds != null && item.seconds > lim.minSeconds) item.seconds -= 5
      else if (item.rest > 15) item.rest -= 5
      else if (item.sets > 1) item.sets -= 1
      else if (items.length > 1) items.splice(items.indexOf(item), 1)
      else return
    }
  }
}

const TITLES: Record<string, string[]> = {
  legs: ['Сильные ноги', 'Крепкие ноги'],
  'legs-explosive': ['Взрывные ноги', 'Пружинистые ноги'],
  core: ['Стальной кор', 'Крепкий пресс', 'Корпус-камень'],
  arms: ['Мощные руки', 'Сильный верх'],
  'arms-explosive': ['Ударные руки', 'Быстрые руки'],
  'core+legs': ['Кор и ноги', 'Устойчивость и сила'],
  'arms+core': ['Сильный корпус', 'Верх и кор'],
  'arms+legs': ['Сила и скорость', 'Руки и ноги'],
  'arms+core+legs': ['Всё тело', 'Боевая форма', 'Функциональный круг'],
}

const FINISHERS: Record<string, string> = {
  core: 'Растяжка «кобра» и дыхание',
  legs: 'Растяжка ног и дыхание',
  arms: 'Растяжка плеч и дыхание',
}

export function generateWorkout({ categories, exerciseIds, minutes, seed }: GeneratorInput): Workout {
  const random = rng(seed)
  const pool = exerciseIds.map((id) => exerciseById[id]).filter((ex) => ex && categories.includes(ex.category))
  const usedCategories = [...new Set(pool.map((ex) => ex.category))].sort() as Category[]
  const picked = pickBalanced(pool, MAX_EXERCISES[minutes], random)
  const ordered = orderExercises(picked, random)
  const items = ordered.map(initial)
  const finisherSeconds = FINISHER[minutes]
  fit(items, minutes * 60 - finisherSeconds)

  const explosive = items.filter((i) => i.exercise.explosive).length
  const avgDifficulty = items.reduce((s, i) => s + i.exercise.difficulty, 0) / Math.max(1, items.length)
  const load = avgDifficulty >= 2.5 || explosive >= 2 ? 'Высокая' : avgDifficulty >= 1.8 ? 'Средняя' : 'Лёгкая'

  const key = usedCategories.join('+')
  const titleKey = usedCategories.length === 1 && explosive > 0 && TITLES[`${key}-explosive`] ? `${key}-explosive` : key
  const titles = TITLES[titleKey] ?? ['Комплекс ОФП']
  const title = titles[Math.floor(random() * titles.length)]

  const first = items[0]?.exercise
  const last = items[items.length - 1]?.exercise
  const insights = [
    first ? `Начинаем с «${first.name}» — самое требовательное, пока есть силы` : '',
    items.length > 1 && last ? `«${last.name}» — в конце, как самое простое` : '',
    usedCategories.length > 1 ? 'Чередую группы мышц, чтобы мышцы успевали восстановиться' : '',
    pool.length > items.length ? `Взял ${items.length} из ${pool.length} упражнений — больше не уложить в ${minutes} минут` : '',
  ].filter(Boolean)

  return {
    title,
    minutes,
    totalSeconds: totalSeconds(items, finisherSeconds),
    load,
    items,
    finisher: {
      name: usedCategories.length === 1 ? FINISHERS[usedCategories[0]] : 'Заминка: растяжка и дыхание',
      description: 'Медленно, глубокий вдох носом — длинный выдох ртом',
      seconds: finisherSeconds,
    },
    insights,
  }
}

export function categoryLabels(categories: Category[]) {
  return categories.map((c) => CATEGORIES[c].label).join(' · ')
}
