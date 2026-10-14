import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { coachApi } from '../api/coach'
import type { CoachNotification } from '../api/types'
import { useAuth } from './AuthContext'
import {
  ensureCoachPushPermission,
  readLastPushId,
  showCoachPush,
  writeLastPushId,
} from '../utils/coachPush'

type CoachNotificationsContextValue = {
  unreadCount: number
  items: CoachNotification[]
  loading: boolean
  sheetOpen: boolean
  openSheet: () => void
  closeSheet: () => void
  refresh: () => Promise<void>
  markRead: (id: number) => Promise<void>
  markAllRead: () => Promise<void>
}

const CoachNotificationsContext = createContext<CoachNotificationsContextValue | null>(null)

export function CoachNotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const enabled = user?.role === 'COACH'
  const [items, setItems] = useState<CoachNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const permissionAsked = useRef(false)

  const deliverPush = useCallback((list: CoachNotification[]) => {
    const lastId = readLastPushId()
    const fresh = list
      .filter((n) => !n.readAt && n.id > lastId)
      .sort((a, b) => a.id - b.id)
    if (fresh.length === 0) return
    const latest = fresh[fresh.length - 1]
    writeLastPushId(latest.id)
    const push = typeof document === 'undefined' || document.visibilityState === 'hidden'
    if (!push) return
    for (const n of fresh) {
      void showCoachPush(n.title, n.body, n.id)
    }
  }, [])

  const refresh = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    try {
      const [list, count] = await Promise.all([coachApi.notifications(), coachApi.notificationUnreadCount()])
      setItems(list)
      setUnreadCount(count.count)
      deliverPush(list)
    } catch {
      /* offline or auth */
    } finally {
      setLoading(false)
    }
  }, [deliverPush, enabled])

  useEffect(() => {
    if (!enabled) return
    if (!permissionAsked.current) {
      permissionAsked.current = true
      void ensureCoachPushPermission()
    }
    void refresh()
    const timer = window.setInterval(() => void refresh(), 45_000)
    const onFocus = () => void refresh()
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [enabled, refresh])

  const markRead = useCallback(
    async (id: number) => {
      await coachApi.markNotificationRead(id)
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)))
      setUnreadCount((c) => Math.max(0, c - 1))
    },
    [],
  )

  const markAllRead = useCallback(async () => {
    await coachApi.markAllNotificationsRead()
    const now = new Date().toISOString()
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })))
    setUnreadCount(0)
  }, [])

  const value = useMemo(
    () => ({
      unreadCount,
      items,
      loading,
      sheetOpen,
      openSheet: () => setSheetOpen(true),
      closeSheet: () => setSheetOpen(false),
      refresh,
      markRead,
      markAllRead,
    }),
    [items, loading, markAllRead, markRead, refresh, sheetOpen, unreadCount],
  )

  return <CoachNotificationsContext.Provider value={value}>{children}</CoachNotificationsContext.Provider>
}

export function useCoachNotifications() {
  const ctx = useContext(CoachNotificationsContext)
  if (!ctx) throw new Error('useCoachNotifications вне CoachNotificationsProvider')
  return ctx
}
