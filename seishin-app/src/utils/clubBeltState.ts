import type { BeltSystem, BeltsBySystem, GroupSystems, StudentSystems } from './beltSystem'

export type ClubBeltState = {
  systems: BeltSystem[]
  groupSystems: GroupSystems
  belts: BeltsBySystem
  studentSystems: StudentSystems
}

export function parseClubBeltState(json: string | null | undefined): ClubBeltState | null {
  if (!json?.trim()) return null
  try {
    const data = JSON.parse(json) as Partial<ClubBeltState>
    if (!data || !Array.isArray(data.systems)) return null
    return {
      systems: data.systems,
      groupSystems: data.groupSystems ?? {},
      belts: data.belts ?? {},
      studentSystems: data.studentSystems ?? {},
    }
  } catch {
    return null
  }
}

export function serializeClubBeltState(state: ClubBeltState): string {
  return JSON.stringify(state)
}
