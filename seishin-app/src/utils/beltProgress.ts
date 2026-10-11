import type { BeltAssignmentMode } from '../api/types'
import { nextBeltLabel } from './format'

export type BeltProgressLike = {
  beltName: string
  nextBeltName?: string | null
  beltAssignmentMode?: BeltAssignmentMode
  progressPercent?: number | null
  progressLabel?: string | null
  maxRank?: boolean
}

export function beltNextDisplayName(info: BeltProgressLike): string {
  if (info.nextBeltName) return info.nextBeltName.toLowerCase()
  return nextBeltLabel(info.beltName)
}

export function beltShowsPercent(info: BeltProgressLike): boolean {
  return info.beltAssignmentMode !== 'MANUAL' && info.progressPercent != null && !info.maxRank
}

export function beltProgressValue(info: BeltProgressLike): number {
  return info.progressPercent ?? 0
}
