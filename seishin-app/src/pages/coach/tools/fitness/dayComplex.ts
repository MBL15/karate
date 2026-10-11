import { exerciseById } from './exercises'
import { totalSeconds, type Workout, type WorkoutItem } from './generator'

export type ComplexAuthor = { name: string; initials: string; role: string; quote: string }

export type AuthoredComplex = { author: ComplexAuthor; workout: Workout }

function item(id: string, sets: number, volume: { reps: number } | { seconds: number }, rest: number, note: string): WorkoutItem {
  return {
    exercise: exerciseById[id],
    sets,
    reps: 'reps' in volume ? volume.reps : null,
    seconds: 'seconds' in volume ? volume.seconds : null,
    rest,
    note,
  }
}

const items: WorkoutItem[] = [
  item('jump-squat', 3, { reps: 10 }, 40, 'Приземляйся мягко на носки и сразу уходи в следующий прыжок.'),
  item('bulgarian', 2, { reps: 8 }, 40, 'Вес на передней ноге, корпус чуть наклони вперёд.'),
  item('mae-geri', 2, { reps: 10 }, 30, 'Колено выше пояса, удар подушечкой стопы, нога быстро возвращается.'),
  item('squat', 3, { reps: 12 }, 30, 'Три секунды вниз, вверх — резко.'),
  item('jumping', 2, { seconds: 40 }, 20, 'Лёгкий ритм, как в стойке перед схваткой.'),
]

const FINISHER_SECONDS = 60

export const DAY_COMPLEX: AuthoredComplex = {
  author: {
    name: 'Мехман Рзаев',
    initials: 'МР',
    role: 'Спортсмен, автор комплекса',
    quote: 'Сильные ноги — это быстрый вход и устойчивая стойка. Делай технично, скорость придёт сама.',
  },
  workout: {
    title: 'Взрывные ноги',
    minutes: 15,
    totalSeconds: totalSeconds(items, FINISHER_SECONDS),
    load: 'Высокая',
    items,
    finisher: {
      name: 'Растяжка ног и дыхание',
      description: 'Медленно, глубокий вдох носом — длинный выдох ртом',
      seconds: FINISHER_SECONDS,
    },
    insights: [],
  },
}
