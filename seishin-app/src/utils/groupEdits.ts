import type { GroupSummary, StudentSummary } from '../api/types'

export type GroupEdits = { hidden: number[]; members: Record<string, number[]> }

export const GROUP_EDITS_KEY = 'group-edits'
export const EMPTY_GROUP_EDITS: GroupEdits = { hidden: [], members: {} }

export function applyGroupEdits(
  groups: GroupSummary[],
  members: Record<number, StudentSummary[]>,
  edits: GroupEdits,
  extra: StudentSummary[] = [],
) {
  const pool = new Map<number, StudentSummary>()
  for (const s of [...extra, ...Object.values(members).flat()]) pool.set(s.id, s)

  const visible = groups.filter((g) => !g.hidden && !edits.hidden.includes(g.id))
  const result: Record<number, StudentSummary[]> = {}
  for (const g of visible) {
    result[g.id] = members[g.id] ?? []
  }

  return {
    groups: visible.map((g) => ({ ...g, studentCount: result[g.id].length })),
    members: result,
    pool,
  }
}
