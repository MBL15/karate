import { useCallback, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  BELT_SYSTEMS_KEY,
  COLORS,
  GROUP_SYSTEMS_KEY,
  LEGACY_BELT_SYSTEM_KEY,
  LEGACY_STUDENT_BELTS_KEY,
  STUDENT_BELTS_KEY,
  STUDENT_SYSTEMS_KEY,
  studentTag,
  type StudentSystems,
  type StudentRef,
  type BeltStep,
  type BeltsBySystem,
  type BeltSystem,
  type GroupSystems,
  type StudentBelt,
  type StudentBelts,
} from '../utils/beltSystem'
import { claimStorage, readStored, storedKey, useStoredState } from './useStoredState'

export type BeltInfo = {
  system: BeltSystem | null
  level: BeltStep | null
  index: number
  next: BeltStep | null
  record: StudentBelt | null
  hex: string | null
}

const NO_SYSTEMS: BeltSystem[] = []

export function todayIsoDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function ownRecord(record: StudentBelt | undefined, student: StudentRef) {
  return record && record.name === studentTag(student) ? record : null
}

function migrateLegacy(userId: number | undefined) {
  try {
    const systemsKey = storedKey(userId, BELT_SYSTEMS_KEY)
    if (localStorage.getItem(systemsKey) !== null) return
    const legacy = readStored<Omit<BeltSystem, 'id'> | null>(storedKey(userId, LEGACY_BELT_SYSTEM_KEY), null)
    if (!legacy?.levels) return
    const id = 'main'
    localStorage.setItem(systemsKey, JSON.stringify([{ ...legacy, id }]))
    const belts = readStored<StudentBelts>(storedKey(userId, LEGACY_STUDENT_BELTS_KEY), {})
    localStorage.setItem(storedKey(userId, STUDENT_BELTS_KEY), JSON.stringify({ [id]: belts }))
  } catch {
    /* storage unavailable */
  }
}

export function useBeltSystems() {
  const { user } = useAuth()
  useState(() => {
    claimStorage(user)
    migrateLegacy(user?.userId)
  })
  const [stored, setSystems] = useStoredState<BeltSystem[]>(BELT_SYSTEMS_KEY, NO_SYSTEMS)
  const [groupSystems, setGroupSystems] = useStoredState<GroupSystems>(GROUP_SYSTEMS_KEY, {})
  const systems = stored ?? NO_SYSTEMS

  const systemFor = useCallback(
    (groupId?: number | null): BeltSystem | null => {
      const id = groupId ? groupSystems[groupId] : undefined
      return systems.find((s) => s.id === id) ?? systems[0] ?? null
    },
    [systems, groupSystems],
  )

  const setGroupSystem = useCallback(
    (groupId: number, systemId: string) => setGroupSystems((map) => ({ ...map, [groupId]: systemId })),
    [setGroupSystems],
  )

  return { systems, setSystems, groupSystems, setGroupSystems, systemFor, setGroupSystem }
}

export function useStudentBelts() {
  const beltSystems = useBeltSystems()
  const { systems, systemFor } = beltSystems
  const [belts, setBelts] = useStoredState<BeltsBySystem>(STUDENT_BELTS_KEY, {})
  const [studentSystems, setStudentSystems] = useStoredState<StudentSystems>(STUDENT_SYSTEMS_KEY, {})

  const infoIn = useCallback(
    (student: StudentRef, system: BeltSystem | null): BeltInfo => {
      const record = system ? ownRecord(belts[system.id]?.[student.id], student) : null
      const levels = system?.levels ?? []
      const index = record ? levels.findIndex((l) => l.id === record.levelId) : -1
      const level = index >= 0 ? levels[index] : null
      return {
        system,
        level,
        index,
        next: index >= 0 ? (levels[index + 1] ?? null) : null,
        record,
        hex: level ? COLORS[level.color].hex : null,
      }
    },
    [belts],
  )

  const studentSystem = useCallback(
    (student: StudentRef) => {
      const pinned = studentSystems[student.id]
      return pinned && pinned.name === studentTag(student) ? (systems.find((s) => s.id === pinned.systemId) ?? null) : null
    },
    [studentSystems, systems],
  )

  /** Системы, в которых у ученика уже есть пояс, — свежие первыми. */
  const ownedSystems = useCallback(
    (student: StudentRef) =>
      systems
        .map((s) => ({ s, record: ownRecord(belts[s.id]?.[student.id], student) }))
        .filter((x) => x.record)
        .sort((a, b) => (b.record?.since ?? '').localeCompare(a.record?.since ?? ''))
        .map((x) => x.s),
    [systems, belts],
  )

  const systemsFor = useCallback(
    (groupIds: number[]) => {
      const list = (groupIds.length ? groupIds : [null]).map((id) => systemFor(id)).filter((s): s is BeltSystem => Boolean(s))
      return [...new Map(list.map((s) => [s.id, s])).values()]
    },
    [systemFor],
  )

  // После удаления группы или перевода система новой группы может отличаться —
  // тогда показываем систему, где у ученика реально есть пояс.
  const systemsForStudent = useCallback(
    (student: StudentRef, groupIds: number[]) => {
      const pinned = studentSystem(student)
      if (pinned) return [pinned]
      const byGroup = systemsFor(groupIds)
      const owned = ownedSystems(student)
      if (byGroup.some((s) => owned.includes(s)) || owned.length === 0) return byGroup
      return [owned[0], ...byGroup.filter((s) => s.id !== owned[0].id)]
    },
    [studentSystem, systemsFor, ownedSystems],
  )

  const info = useCallback(
    (student: StudentRef, groupId?: number | null) => {
      const pinned = studentSystem(student)
      if (pinned) return infoIn(student, pinned)
      const byGroup = systemFor(groupId)
      const own = byGroup ? infoIn(student, byGroup) : null
      if (own?.record) return own
      const fallback = ownedSystems(student)[0]
      return fallback ? infoIn(student, fallback) : (own ?? infoIn(student, null))
    },
    [infoIn, studentSystem, systemFor, ownedSystems],
  )

  const pinStudentSystem = useCallback(
    (student: StudentRef, systemId: string | null) =>
      setStudentSystems((map) => {
        const next = { ...map }
        if (systemId) next[student.id] = { systemId, name: studentTag(student) }
        else delete next[student.id]
        return next
      }),
    [setStudentSystems],
  )

  const assign = useCallback(
    (students: StudentRef[], systemId: string, levelId: string, date = todayIsoDate()) =>
      setBelts((all) => {
        const map = { ...(all[systemId] ?? {}) }
        for (const student of students) {
          const prev = ownRecord(map[student.id], student)
          map[student.id] = { levelId, since: date, history: [...(prev?.history ?? []), { levelId, date }], name: studentTag(student) }
        }
        return { ...all, [systemId]: map }
      }),
    [setBelts],
  )

  const undoLast = useCallback(
    (student: StudentRef, systemId: string) =>
      setBelts((all) => {
        const prev = ownRecord(all[systemId]?.[student.id], student)
        if (!prev) return all
        const history = prev.history.slice(0, -1)
        const map = { ...all[systemId] }
        const last = history[history.length - 1]
        if (last) map[student.id] = { ...prev, levelId: last.levelId, since: last.date, history }
        else delete map[student.id]
        return { ...all, [systemId]: map }
      }),
    [setBelts],
  )

  const dropSystemBelts = useCallback(
    (systemId: string) =>
      setBelts((all) => {
        const rest = { ...all }
        delete rest[systemId]
        return rest
      }),
    [setBelts],
  )

  return {
    ...beltSystems,
    systems,
    info,
    infoIn,
    systemFor,
    systemsFor,
    systemsForStudent,
    studentSystem,
    pinStudentSystem,
    assign,
    undoLast,
    dropSystemBelts,
  }
}
