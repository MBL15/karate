import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

export const STORED_STATE_EVENT = 'kh-stored-state'

export function storedKey(userId: number | undefined, key: string) {
  return `kh:${userId ?? 'guest'}:${key}`
}

export function notifyStoredStateChange(fullKey: string) {
  window.dispatchEvent(new CustomEvent(STORED_STATE_EVENT, { detail: fullKey }))
}

export function readStored<T>(fullKey: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(fullKey)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const claimed = new Set<string>()

/** The server database is in-memory, so after a restart a new account can get an old userId. */
export function claimStorage(user: { userId: number; login: string; role: string } | null | undefined) {
  if (!user) return
  const prefix = storedKey(user.userId, '')
  const owner = `${user.login}|${user.role}`
  if (claimed.has(prefix + owner)) return
  claimed.add(prefix + owner)
  try {
    const ownerKey = `${prefix}__owner`
    const previous = localStorage.getItem(ownerKey)
    if (previous && previous !== owner) {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key?.startsWith(prefix)) localStorage.removeItem(key)
      }
    }
    localStorage.setItem(ownerKey, owner)
  } catch {
    /* storage unavailable */
  }
}

export function useStoredState<T>(key: string, initial: T) {
  const { user } = useAuth()
  claimStorage(user)
  const fullKey = storedKey(user?.userId, key)
  const [fallback] = useState(initial)
  const [state, setState] = useState(() => ({ key: fullKey, value: readStored(fullKey, initial) }))
  const current = state.key === fullKey ? state : { key: fullKey, value: readStored(fullKey, fallback) }
  if (current !== state) setState(current)

  useEffect(() => {
    const sync = (event: Event) => {
      if ((event as CustomEvent<string>).detail === fullKey) setState({ key: fullKey, value: readStored(fullKey, fallback) })
    }
    window.addEventListener(STORED_STATE_EVENT, sync)
    return () => window.removeEventListener(STORED_STATE_EVENT, sync)
  }, [fullKey, fallback])

  const update = useCallback(
    (next: T | ((current: T) => T)) => {
      setState((prev) => {
        const base = prev.key === fullKey ? prev.value : readStored(fullKey, fallback)
        const resolved = typeof next === 'function' ? (next as (current: T) => T)(base) : next
        try {
          localStorage.setItem(fullKey, JSON.stringify(resolved))
        } catch {
          /* storage full */
        }
        queueMicrotask(() => notifyStoredStateChange(fullKey))
        return { key: fullKey, value: resolved }
      })
    },
    [fullKey, fallback],
  )

  return [current.value, update] as const
}
