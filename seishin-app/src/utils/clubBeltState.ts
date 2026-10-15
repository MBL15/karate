import {
  BELT_SYSTEMS_KEY,
  GROUP_SYSTEMS_KEY,
  STUDENT_BELTS_KEY,
  STUDENT_SYSTEMS_KEY,
  type BeltSystem,
  type BeltsBySystem,
  type GroupSystems,
  type StudentSystems,
} from './beltSystem'
import { notifyStoredStateChange, readStored, storedKey } from '../hooks/useStoredState'

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

export function isNonEmptyBeltState(state: ClubBeltState): boolean {
  if (state.systems.length > 0) return true
  if (Object.keys(state.groupSystems).length > 0) return true
  if (Object.keys(state.belts).length > 0) return true
  if (Object.keys(state.studentSystems).length > 0) return true
  return false
}

export function readLocalBeltState(userId: number): ClubBeltState {
  return {
    systems: readStored<BeltSystem[]>(storedKey(userId, BELT_SYSTEMS_KEY), []),
    groupSystems: readStored<GroupSystems>(storedKey(userId, GROUP_SYSTEMS_KEY), {}),
    belts: readStored<BeltsBySystem>(storedKey(userId, STUDENT_BELTS_KEY), {}),
    studentSystems: readStored<StudentSystems>(storedKey(userId, STUDENT_SYSTEMS_KEY), {}),
  }
}

export function applyBeltStateToLocalStorage(userId: number, state: ClubBeltState) {
  const entries: [string, unknown][] = [
    [storedKey(userId, BELT_SYSTEMS_KEY), state.systems],
    [storedKey(userId, GROUP_SYSTEMS_KEY), state.groupSystems],
    [storedKey(userId, STUDENT_BELTS_KEY), state.belts],
    [storedKey(userId, STUDENT_SYSTEMS_KEY), state.studentSystems],
  ]
  for (const [key, value] of entries) {
    localStorage.setItem(key, JSON.stringify(value))
    notifyStoredStateChange(key)
  }
}
