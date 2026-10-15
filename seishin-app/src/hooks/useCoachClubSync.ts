import { useCallback, useEffect, useRef } from 'react'
import { coachApi } from '../api/coach'
import { useAuth } from '../context/AuthContext'
import { migrateLegacyClubProfile } from '../utils/clubProfileMigrate'
import {
  applyBeltStateToLocalStorage,
  isNonEmptyBeltState,
  parseClubBeltState,
  readLocalBeltState,
  serializeClubBeltState,
} from '../utils/clubBeltState'
import { useStoredState } from './useStoredState'
import {
  BELT_SYSTEMS_KEY,
  GROUP_SYSTEMS_KEY,
  STUDENT_BELTS_KEY,
  STUDENT_SYSTEMS_KEY,
  type BeltSystem,
  type BeltsBySystem,
  type GroupSystems,
  type StudentSystems,
} from '../utils/beltSystem'

const SAVE_DEBOUNCE_MS = 800

/** Загружает пояса клуба с сервера; сохраняет локальные правки после успешной загрузки (debounce + flush). */
export function useCoachClubSync() {
  const { user } = useAuth()
  const hydrated = useRef(false)
  const saveEnabled = useRef(false)
  const lastSyncedJson = useRef<string | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const [systems, setSystems] = useStoredState<BeltSystem[]>(BELT_SYSTEMS_KEY, [])
  const [groupSystems] = useStoredState<GroupSystems>(GROUP_SYSTEMS_KEY, {})
  const [belts] = useStoredState<BeltsBySystem>(STUDENT_BELTS_KEY, {})
  const [studentSystems] = useStoredState<StudentSystems>(STUDENT_SYSTEMS_KEY, {})

  const pushToServer = useCallback(async (userId: number): Promise<boolean> => {
    const state = readLocalBeltState(userId)
    if (!isNonEmptyBeltState(state)) return false
    const json = serializeClubBeltState(state)
    if (json === lastSyncedJson.current) return true
    try {
      await coachApi.clubProfileUpdate({ beltStateJson: json })
      lastSyncedJson.current = json
      return true
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    if (user?.role !== 'COACH') {
      hydrated.current = false
      saveEnabled.current = false
      lastSyncedJson.current = null
      return
    }

    const userId = user.userId
    let cancelled = false
    hydrated.current = false
    saveEnabled.current = false
    lastSyncedJson.current = null

    void coachApi
      .clubProfile()
      .then(async (profile) => {
        if (cancelled) return
        await migrateLegacyClubProfile(userId, profile)
        const remote = parseClubBeltState(profile.beltStateJson)
        const local = readLocalBeltState(userId)

        if (remote && isNonEmptyBeltState(remote)) {
          applyBeltStateToLocalStorage(userId, remote)
          setSystems(remote.systems)
          lastSyncedJson.current = serializeClubBeltState(remote)
        } else if (isNonEmptyBeltState(local)) {
          const json = serializeClubBeltState(local)
          try {
            await coachApi.clubProfileUpdate({ beltStateJson: json })
            lastSyncedJson.current = json
          } catch {
            lastSyncedJson.current = null
          }
        } else {
          lastSyncedJson.current = serializeClubBeltState(local)
        }

        if (!cancelled) {
          hydrated.current = true
          saveEnabled.current = true
        }
      })
      .catch(() => {
        if (cancelled) return
        hydrated.current = true
        saveEnabled.current = false
        lastSyncedJson.current = serializeClubBeltState(readLocalBeltState(userId))
      })

    return () => {
      cancelled = true
    }
  }, [user?.userId, user?.role, setSystems])

  useEffect(() => {
    if (user?.role !== 'COACH' || !hydrated.current || !saveEnabled.current) return

    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      void pushToServer(user.userId)
    }, SAVE_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer.current)
      if (user?.role === 'COACH' && hydrated.current && saveEnabled.current) {
        void pushToServer(user.userId)
      }
    }
  }, [user, systems, groupSystems, belts, studentSystems, pushToServer])
}
