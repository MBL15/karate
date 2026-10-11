export type ColorKey = 'white' | 'yellow' | 'orange' | 'red' | 'green' | 'lightblue' | 'blue' | 'purple' | 'brown' | 'black'

export const COLORS: Record<ColorKey, { name: string; stripeName: string; hex: string }> = {
  white: { name: 'Белый', stripeName: 'белой', hex: '#f8fafc' },
  yellow: { name: 'Жёлтый', stripeName: 'жёлтой', hex: '#facc15' },
  orange: { name: 'Оранжевый', stripeName: 'оранжевой', hex: '#f97316' },
  red: { name: 'Красный', stripeName: 'красной', hex: '#dc2626' },
  green: { name: 'Зелёный', stripeName: 'зелёной', hex: '#16a34a' },
  lightblue: { name: 'Голубой', stripeName: 'голубой', hex: '#38bdf8' },
  blue: { name: 'Синий', stripeName: 'синей', hex: '#2563eb' },
  purple: { name: 'Фиолетовый', stripeName: 'фиолетовой', hex: '#7c3aed' },
  brown: { name: 'Коричневый', stripeName: 'коричневой', hex: '#92400e' },
  black: { name: 'Чёрный', stripeName: 'чёрной', hex: '#111827' },
}

export const COLOR_KEYS = Object.keys(COLORS) as ColorKey[]

export type Rank = 'kyu' | 'dan'

export type BeltStep = { id: string; rank: Rank; number: number; color: ColorKey; stripe: ColorKey | null; name?: string }

export type StyleId = 'kyokushin' | 'shotokan' | 'goju' | 'wado' | 'shito' | 'custom'

export type BeltNorms = { sessions: number; badges: number; competitions: number }

export const DEFAULT_NORMS: BeltNorms = { sessions: 24, badges: 3, competitions: 1 }

export type BeltSystem = {
  id: string
  style: StyleId
  styleName?: string
  kyu: number
  dan: number
  levels: BeltStep[]
  norms?: BeltNorms
}

export function normsOf(system: Pick<BeltSystem, 'norms'>): BeltNorms {
  return { ...DEFAULT_NORMS, ...system.norms }
}

type PresetBelt = [ColorKey, ColorKey?]

export const STYLES: Record<StyleId, { label: string; kyu: PresetBelt[] }> = {
  kyokushin: {
    label: 'Киокушинкай',
    kyu: [
      ['orange'],
      ['orange', 'blue'],
      ['blue'],
      ['blue', 'yellow'],
      ['yellow'],
      ['yellow', 'green'],
      ['green'],
      ['green', 'brown'],
      ['brown'],
      ['brown', 'yellow'],
    ],
  },
  shotokan: {
    label: 'Шотокан',
    kyu: [['white'], ['yellow'], ['orange'], ['green'], ['blue'], ['purple'], ['brown'], ['brown'], ['brown']],
  },
  goju: {
    label: 'Годзю-рю',
    kyu: [['white'], ['yellow'], ['orange'], ['red'], ['green'], ['blue'], ['purple'], ['brown'], ['brown'], ['brown']],
  },
  wado: {
    label: 'Вадо-рю',
    kyu: [['white'], ['red'], ['yellow'], ['orange'], ['green'], ['blue'], ['purple'], ['brown'], ['brown']],
  },
  shito: {
    label: 'Сито-рю',
    kyu: [['white'], ['yellow'], ['orange'], ['green'], ['blue'], ['lightblue'], ['purple'], ['brown'], ['brown'], ['brown']],
  },
  custom: {
    label: 'Свой стиль',
    kyu: [['white'], ['yellow'], ['orange'], ['green'], ['blue'], ['purple'], ['brown'], ['brown']],
  },
}

export const PICKER_STYLES: StyleId[] = ['wado', 'shotokan', 'shito', 'goju']

export const LEGACY_BELT_SYSTEM_KEY = 'belt-system-v2'
export const LEGACY_STUDENT_BELTS_KEY = 'student-belts'

export const BELT_SYSTEMS_KEY = 'belt-systems'
export const GROUP_SYSTEMS_KEY = 'group-belt-systems'
export const STUDENT_BELTS_KEY = 'student-belts-by-system'

export const STUDENT_SYSTEMS_KEY = 'student-belt-systems'

export type GroupSystems = Record<string, string>
export type StudentSystems = Record<string, { systemId: string; name: string }>
export type BeltsBySystem = Record<string, StudentBelts>

export function newSystemId() {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function autoName(level: Pick<BeltStep, 'color' | 'stripe'>) {
  const base = COLORS[level.color].name
  return level.stripe ? `${base} с ${COLORS[level.stripe].stripeName} полосой` : base
}

export function stepName(level: BeltStep) {
  return level.name || autoName(level)
}

export function rankLabel(level: Pick<BeltStep, 'rank' | 'number'>) {
  return `${level.number} ${level.rank === 'kyu' ? 'кю' : 'дан'}`
}

export function buildLevels(style: StyleId, kyu: number, dan: number, keep: BeltStep[] = []): BeltStep[] {
  const preset = STYLES[style].kyu
  const levels: BeltStep[] = []
  for (let i = 0; i < kyu; i++) {
    const number = kyu - i
    const kept = keep.find((l) => l.rank === 'kyu' && l.number === number)
    const [color, stripe] = preset[Math.min(preset.length - 1, Math.floor((i * preset.length) / kyu))]
    levels.push(kept ?? { id: `kyu-${number}`, rank: 'kyu', number, color, stripe: stripe ?? null })
  }
  for (let n = 1; n <= dan; n++) {
    const kept = keep.find((l) => l.rank === 'dan' && l.number === n)
    levels.push(kept ?? { id: `dan-${n}`, rank: 'dan', number: n, color: 'black', stripe: null })
  }
  return levels
}

export function presetSystem(style: StyleId, styleName?: string, id = newSystemId()): BeltSystem {
  const kyu = STYLES[style].kyu.length
  return { id, style, ...(styleName ? { styleName } : {}), kyu, dan: 1, levels: buildLevels(style, kyu, 1) }
}

export function styleLabel(system: Pick<BeltSystem, 'style' | 'styleName'>) {
  return (system.style === 'custom' && system.styleName?.trim()) || STYLES[system.style].label
}

export type BeltRecord = { levelId: string; date: string }

export type StudentBelt = { levelId: string; since: string; history: BeltRecord[]; name?: string }

export type StudentRef = { id: number; firstName: string; lastName: string }

export function studentTag(student: StudentRef) {
  return `${student.firstName} ${student.lastName}`.trim().toLowerCase()
}

export type StudentBelts = Record<string, StudentBelt>
