import { useCallback, useEffect, useRef, useState } from 'react'
import { parentApi } from '../api/parent'
import type { Achievement, HistoryEntry, ParentChildHome } from '../api/types'
import { ApiError } from '../api/client'

export function useParentChildData(childId: number | null) {
  const [home, setHome] = useState<ParentChildHome | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const request = useRef(0)
  const [loadedFor, setLoadedFor] = useState<number | null>(null)
  if (loadedFor !== childId) {
    setLoadedFor(childId)
    setHome(null)
    setHistory([])
    setAchievements([])
    setLoading(childId != null)
  }

  const load = useCallback(() => {
    if (!childId) {
      setHome(null)
      setHistory([])
      setAchievements([])
      setLoading(false)
      return
    }
    const id = ++request.current
    setLoading(true)
    setError(null)
    Promise.all([
      parentApi.home(childId),
      parentApi.history(childId),
      parentApi.achievements(childId).catch(() => [] as Achievement[]),
    ])
      .then(([h, hist, ach]) => {
        if (id !== request.current) return
        setHome(h)
        setHistory(Array.isArray(hist) ? hist : [])
        setAchievements(Array.isArray(ach) ? ach : [])
      })
      .catch((e) => {
        if (id === request.current) setError(e instanceof ApiError ? e.message : 'Ошибка загрузки')
      })
      .finally(() => {
        if (id === request.current) setLoading(false)
      })
  }, [childId])

  useEffect(() => {
    load()
  }, [load])

  return { home, setHome, history, achievements, loading, error, reload: load }
}
