export type Category = 'core' | 'legs' | 'arms'

export type Pose =
  | 'plank'
  | 'sideplank'
  | 'crunch'
  | 'bicycle'
  | 'twist'
  | 'legraise'
  | 'climber'
  | 'squat'
  | 'wallsit'
  | 'lunge'
  | 'jump'
  | 'bridge'
  | 'kick'
  | 'pushup'
  | 'dip'
  | 'punch'

export type Exercise = {
  id: string
  category: Category
  name: string
  description: string
  pose: Pose
  /** 1 — простое, 3 — самое требовательное */
  difficulty: 1 | 2 | 3
  mode: 'reps' | 'time'
  perSide?: boolean
  secondsPerRep: number
  explosive?: boolean
}

export const CATEGORIES: Record<Category, { label: string; hint: string; color: string; soft: string }> = {
  core: { label: 'Кор', hint: 'Пресс и мышцы корпуса', color: '#2563eb', soft: '#eaf1fe' },
  legs: { label: 'Ноги', hint: 'Сила и взрывная мощь', color: '#16a34a', soft: '#e8f7ee' },
  arms: { label: 'Руки', hint: 'Плечи, грудь, трицепс', color: '#f59e0b', soft: '#fff4e0' },
}

export const EXERCISES: Exercise[] = [
  { id: 'plank', category: 'core', name: 'Планка', description: 'Упор на предплечьях, тело — ровная линия', pose: 'plank', difficulty: 2, mode: 'time', secondsPerRep: 1 },
  { id: 'crunch', category: 'core', name: 'Скручивания', description: 'Подъём корпуса лёжа, поясница прижата', pose: 'crunch', difficulty: 1, mode: 'reps', secondsPerRep: 2 },
  { id: 'bicycle', category: 'core', name: 'Велосипед', description: 'Локоть к противоположному колену', pose: 'bicycle', difficulty: 2, mode: 'reps', perSide: true, secondsPerRep: 1.5 },
  { id: 'russian-twist', category: 'core', name: 'Русские скручивания', description: 'Сидя, повороты корпуса в стороны', pose: 'twist', difficulty: 2, mode: 'reps', perSide: true, secondsPerRep: 1.5 },
  { id: 'leg-raise', category: 'core', name: 'Подъём ног', description: 'Лёжа на спине, прямые ноги вверх', pose: 'legraise', difficulty: 2, mode: 'reps', secondsPerRep: 2.5 },
  { id: 'climber', category: 'core', name: 'Скалолаз', description: 'В упоре лёжа колени к груди в темпе', pose: 'climber', difficulty: 3, mode: 'time', secondsPerRep: 1, explosive: true },
  { id: 'side-plank', category: 'core', name: 'Боковая планка', description: 'Упор на одно предплечье, таз вверх', pose: 'sideplank', difficulty: 2, mode: 'time', perSide: true, secondsPerRep: 1 },
  { id: 'boat', category: 'core', name: 'Лодочка', description: 'Удержание V-позиции сидя', pose: 'twist', difficulty: 3, mode: 'time', secondsPerRep: 1 },

  { id: 'squat', category: 'legs', name: 'Приседания', description: 'Бёдра параллельно полу, спина прямая', pose: 'squat', difficulty: 2, mode: 'reps', secondsPerRep: 2.5 },
  { id: 'lunge', category: 'legs', name: 'Выпады', description: 'Шаг вперёд, колено над стопой', pose: 'lunge', difficulty: 2, mode: 'reps', perSide: true, secondsPerRep: 2.5 },
  { id: 'jump-squat', category: 'legs', name: 'Выпрыгивания', description: 'Присед и мощный прыжок вверх', pose: 'jump', difficulty: 3, mode: 'reps', secondsPerRep: 2.5, explosive: true },
  { id: 'bulgarian', category: 'legs', name: 'Болгарские приседания', description: 'Задняя нога на опоре, присед на одной', pose: 'lunge', difficulty: 3, mode: 'reps', perSide: true, secondsPerRep: 3 },
  { id: 'jumping', category: 'legs', name: 'Прыжки на месте', description: 'Лёгкие прыжки на носках в ритме', pose: 'jump', difficulty: 1, mode: 'time', secondsPerRep: 1 },
  { id: 'wall-sit', category: 'legs', name: 'Стульчик у стены', description: 'Удержание приседа спиной к стене', pose: 'wallsit', difficulty: 2, mode: 'time', secondsPerRep: 1 },
  { id: 'bridge', category: 'legs', name: 'Ягодичный мост', description: 'Лёжа, подъём таза вверх', pose: 'bridge', difficulty: 1, mode: 'reps', secondsPerRep: 2 },
  { id: 'mae-geri', category: 'legs', name: 'Мае-гери на месте', description: 'Прямой удар ногой вперёд, поочерёдно', pose: 'kick', difficulty: 2, mode: 'reps', perSide: true, secondsPerRep: 2, explosive: true },

  { id: 'pushup', category: 'arms', name: 'Отжимания', description: 'Классические, корпус ровный', pose: 'pushup', difficulty: 2, mode: 'reps', secondsPerRep: 2.5 },
  { id: 'pushup-narrow', category: 'arms', name: 'Отжимания с узкой постановкой рук', description: 'Ладони близко, акцент на трицепс', pose: 'pushup', difficulty: 3, mode: 'reps', secondsPerRep: 3 },
  { id: 'pushup-wide', category: 'arms', name: 'Отжимания с широкой постановкой рук', description: 'Ладони шире плеч, акцент на грудь', pose: 'pushup', difficulty: 2, mode: 'reps', secondsPerRep: 2.5 },
  { id: 'shoulder-taps', category: 'arms', name: 'Планка с касанием плеч', description: 'В упоре лёжа касание противоположного плеча', pose: 'plank', difficulty: 2, mode: 'time', secondsPerRep: 1 },
  { id: 'dips', category: 'arms', name: 'Обратные отжимания', description: 'Упор сзади на скамью, сгибание рук', pose: 'dip', difficulty: 1, mode: 'reps', secondsPerRep: 2.5 },
  { id: 'knuckle-pushup', category: 'arms', name: 'Отжимания на кулаках', description: 'Упор на первые две костяшки', pose: 'pushup', difficulty: 3, mode: 'reps', secondsPerRep: 3 },
  { id: 'shadow', category: 'arms', name: 'Бой с тенью', description: 'Серии прямых ударов руками в темпе', pose: 'punch', difficulty: 1, mode: 'time', secondsPerRep: 1, explosive: true },
  { id: 'pike-pushup', category: 'arms', name: 'Отжимания «домиком»', description: 'Таз вверх, акцент на плечи', pose: 'pushup', difficulty: 3, mode: 'reps', secondsPerRep: 3 },
]

export const exerciseById = Object.fromEntries(EXERCISES.map((e) => [e.id, e])) as Record<string, Exercise>
