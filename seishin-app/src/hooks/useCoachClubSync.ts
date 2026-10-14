import { useEffect, useRef } from 'react'
import { coachApi } from '../api/coach'
import { useAuth } from '../context/AuthContext'
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
import { parseClubBeltState, serializeClubBeltState, type ClubBeltState } from '../utils/clubBeltState'
import { readStored, storedKey, useStoredState } from './useStoredState'

/** Загружает профиль клуба и пояса с сервера; сохраняет изменения поясов обратно (debounce). */
export function useCoachClubSync() {
  const { user } = useAuth()
  const loaded = useRef(false)
  const timer = useRef<number | undefined>(undefined)
  const [systems, setSystems] = useStoredState<BeltSystem[]>(BELT_SYSTEMS_KEY, [])
  const [groupSystems] = useStoredState<GroupSystems>(GROUP_SYSTEMS_KEY, {})
  const [belts] = useStoredState<BeltsBySystem>(STUDENT_BELTS_KEY, {})
  const [studentSystems] = useStoredState<StudentSystems>(STUDENT_SYSTEMS_KEY, {})

  useEffect(() => {
    if (user?.role !== 'COACH' || loaded.current) return
    loaded.current = true
    coachApi
      .clubProfile()
      .then((profile) => {
        const remote = parseClubBeltState(profile.beltStateJson)
        if (!remote) {
          const local: ClubBeltState = {
            systems: readStored(storedKey(user.userId, BELT_SYSTEMS_KEY), []),
            groupSystems: readStored(storedKey(user.userId, GROUP_SYSTEMS_KEY), {}),
            belts: readStored(storedKey(user.userId, STUDENT_BELTS_KEY), {}),
            studentSystems: readStored(storedKey(user.userId, STUDENT_SYSTEMS_KEY), {}),
          }
          if (local.systems.length > 0) {
            void coachApi.clubProfileUpdate({ beltStateJson: serializeClubBeltState(local) })
          }
          return
        }
        localStorage.setItem(storedKey(user.userId, BELT_SYSTEMS_KEY), JSON.stringify(remote.systems))
        localStorage.setItem(storedKey(user.userId, GROUP_SYSTEMS_KEY), JSON.stringify(remote.groupSystems))
        localStorage.setItem(storedKey(user.userId, STUDENT_BELTS_KEY), JSON.stringify(remote.belts))
        localStorage.setItem(storedKey(user.userId, STUDENT_SYSTEMS_KEY), JSON.stringify(remote.studentSystems))
        setSystems(remote.systems)
      })
      .catch(() => undefined)
  }, [user, setSystems])

  useEffect(() => {
    if (user?.role !== 'COACH' || !loaded.current) return
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const state = {
        systems: readStored<BeltSystem[]>(storedKey(user.userId, BELT_SYSTEMS_KEY), systems),
        groupSystems: readStored<GroupSystems>(storedKey(user.userId, GROUP_SYSTEMS_KEY), groupSystems),
        belts: readStored<BeltsBySystem>(storedKey(user.userId, STUDENT_BELTS_KEY), belts),
        studentSystems: readStored<StudentSystems>(storedKey(user.userId, STUDENT_SYSTEMS_KEY), studentSystems),
      }
      void coachApi.clubProfileUpdate({ beltStateJson: serializeClubBeltState(state) }).catch(() => undefined)
    }, 800)
    return () => window.clearTimeout(timer.current)
  }, [user, systems, groupSystems, belts, studentSystems])
}
