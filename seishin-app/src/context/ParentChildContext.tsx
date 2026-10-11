import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { parentApi } from '../api/parent'
import type { StudentSummary } from '../api/types'
import { ApiError } from '../api/client'
import { childGroupName } from '../utils/childGroup'
import { storedKey } from '../hooks/useStoredState'
import { useAuth } from './AuthContext'

type ParentChildContextValue = {
  children: StudentSummary[]
  selectedChildId: number | null
  setSelectedChildId: (id: number) => void
  selectedChild: StudentSummary | undefined
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  addChild: (payload: {
    firstName: string
    lastName: string
    birthDate: string
    inviteCode?: string
  }) => Promise<string>
  addChildOpen: boolean
  setAddChildOpen: (open: boolean) => void
  clubs: Record<number, string>
  clubsReady: boolean
  multiClub: boolean
  /** null — группа неизвестна (нет расписания и посещений); ключа нет — ещё загружается. */
  groups: Record<number, string | null>
}

const ParentChildContext = createContext<ParentChildContextValue | null>(null)

function readStoredChildId(key: string): number | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const id = Number(raw)
    return Number.isFinite(id) ? id : null
  } catch {
    return null
  }
}

export function ParentChildProvider({ children: nodes }: { children: ReactNode }) {
  const { user } = useAuth()
  const SELECTED_CHILD_KEY = storedKey(user?.userId, 'selected-child')
  const [children, setChildren] = useState<StudentSummary[]>([])
  const [selectedChildId, setSelectedChildIdState] = useState<number | null>(() => readStoredChildId(SELECTED_CHILD_KEY))

  const setSelectedChildId = useCallback(
    (id: number) => {
      setSelectedChildIdState(id)
      localStorage.setItem(SELECTED_CHILD_KEY, String(id))
    },
    [SELECTED_CHILD_KEY],
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addChildOpen, setAddChildOpen] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await parentApi.children()
      setChildren(list)
      setSelectedChildIdState((prev) => {
        const stored = readStoredChildId(SELECTED_CHILD_KEY)
        const candidate = prev ?? stored
        if (candidate && list.some((c) => c.id === candidate)) {
          localStorage.setItem(SELECTED_CHILD_KEY, String(candidate))
          return candidate
        }
        const first = list[0]?.id ?? null
        if (first != null) localStorage.setItem(SELECTED_CHILD_KEY, String(first))
        return first
      })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось загрузить детей')
    } finally {
      setLoading(false)
    }
  }, [SELECTED_CHILD_KEY])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const [clubs, setClubs] = useState<Record<number, string>>({})
  const [clubsFor, setClubsFor] = useState('')
  const childIds = children.map((c) => c.id).join(',')
  const clubsReady = clubsFor === childIds
  useEffect(() => {
    if (!childIds) return
    let alive = true
    Promise.all(
      childIds.split(',').map(async (id) => {
        const profile = await parentApi.profile(Number(id)).catch(() => null)
        return [Number(id), profile?.clubName ?? ''] as const
      }),
    ).then((entries) => {
      if (!alive) return
      setClubs(Object.fromEntries(entries.filter(([, name]) => name)))
      setClubsFor(childIds)
    })
    return () => {
      alive = false
    }
  }, [childIds])
  const multiClub = new Set(Object.values(clubs)).size > 1

  const [groups, setGroups] = useState<Record<number, string | null>>({})
  useEffect(() => {
    if (children.length === 0) return
    let alive = true
    Promise.all(
      children.map(async (child) => {
        const history = child.nextTrainingGroupName ? [] : await parentApi.history(child.id).catch(() => [])
        return [child.id, childGroupName(child.nextTrainingGroupName, history)] as const
      }),
    ).then((entries) => alive && setGroups(Object.fromEntries(entries)))
    return () => {
      alive = false
    }
  }, [children])

  const addChild = useCallback(
    async (payload: { firstName: string; lastName: string; birthDate: string; inviteCode?: string }) => {
      const created = await parentApi.createChild(payload)
      await refresh()
      setSelectedChildId(created.id)
      return `${created.firstName} ${created.lastName}`
    },
    [refresh, setSelectedChildId],
  )

  const value = useMemo(
    () => ({
      children,
      selectedChildId,
      setSelectedChildId,
      selectedChild: children.find((c) => c.id === selectedChildId),
      loading,
      error,
      refresh,
      addChild,
      addChildOpen,
      setAddChildOpen,
      clubs,
      clubsReady,
      multiClub,
      groups,
    }),
    [
      children,
      selectedChildId,
      setSelectedChildId,
      loading,
      error,
      refresh,
      addChild,
      addChildOpen,
      clubs,
      clubsReady,
      multiClub,
      groups,
    ],
  )

  return <ParentChildContext.Provider value={value}>{nodes}</ParentChildContext.Provider>
}

export function useParentChild() {
  const ctx = useContext(ParentChildContext)
  if (!ctx) throw new Error('useParentChild must be used within ParentChildProvider')
  return ctx
}
