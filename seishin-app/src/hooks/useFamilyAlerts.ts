import { useCallback, useEffect, useState } from 'react'
import { parentApi } from '../api/parent'
import type { ParentChildHome, Payment, StudentSummary } from '../api/types'
import { useParentChild } from '../context/ParentChildContext'

export type ChildAlerts = {
  child: StudentSummary
  home: ParentChildHome | null
  debts: Payment[]
}

export function alertCount(list: ChildAlerts[]) {
  return list.reduce(
    (sum, item) =>
      sum + item.debts.length + (item.home?.upcomingCompetitions ?? []).filter((c) => c.rsvpStatus === 'PENDING').length,
    0,
  )
}

/** Уведомления по всем детям сразу: у детей могут быть разные клубы и тренеры. */
export function useFamilyAlerts(enabled = true) {
  const { children } = useParentChild()
  const [items, setItems] = useState<ChildAlerts[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])
  const key = children.map((c) => c.id).join(',')

  useEffect(() => {
    if (!enabled || !key) return
    let alive = true
    setLoading(true)
    Promise.all(
      children.map(async (child) => {
        const [home, payments] = await Promise.all([
          parentApi.home(child.id).catch(() => null),
          parentApi.payments(child.id).catch(() => [] as Payment[]),
        ])
        return { child, home, debts: payments.filter((p) => p.status !== 'PAID') }
      }),
    )
      .then((list) => alive && setItems(list))
      .finally(() => {
        if (!alive) return
        setLoading(false)
        setLoaded(true)
      })
    return () => {
      alive = false
    }
  }, [enabled, key, children, version])

  return { items, count: alertCount(items), loading, loaded, reload }
}
