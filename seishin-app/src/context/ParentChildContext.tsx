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
}

const ParentChildContext = createContext<ParentChildContextValue | null>(null)
const SELECTED_CHILD_KEY = 'seishin-selected-child'

function readStoredChildId(): number | null {
  try {
    const raw = localStorage.getItem(SELECTED_CHILD_KEY)
    if (!raw) return null
    const id = Number(raw)
    return Number.isFinite(id) ? id : null
  } catch {
    return null
  }
}

export function ParentChildProvider({ children: nodes }: { children: ReactNode }) {
  const [children, setChildren] = useState<StudentSummary[]>([])
  const [selectedChildId, setSelectedChildIdState] = useState<number | null>(readStoredChildId)

  const setSelectedChildId = useCallback((id: number) => {
    setSelectedChildIdState(id)
    localStorage.setItem(SELECTED_CHILD_KEY, String(id))
  }, [])
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
        const stored = readStoredChildId()
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
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const addChild = useCallback(
    async (payload: { firstName: string; lastName: string; birthDate: string; inviteCode?: string }) => {
      const created = await parentApi.createChild(payload)
      await refresh()
      setSelectedChildId(created.id)
      return `${created.firstName} ${created.lastName}`
    },
    [refresh],
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
    }),
    [children, selectedChildId, setSelectedChildId, loading, error, refresh, addChild, addChildOpen],
  )

  return <ParentChildContext.Provider value={value}>{nodes}</ParentChildContext.Provider>
}

export function useParentChild() {
  const ctx = useContext(ParentChildContext)
  if (!ctx) throw new Error('useParentChild must be used within ParentChildProvider')
  return ctx
}
