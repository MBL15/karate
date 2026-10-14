import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { tokenExpired } from '../api/client'
import { AUTH_STORAGE_KEY, clearPersistedAuth, persistAuth, readAuthRaw } from '../utils/authStorage'
import { markSessionExpired } from '../utils/session'
import type { UserRole } from '../api/types'

export type { UserRole }

export type AuthUser = {
  userId: number
  name: string
  login: string
  phone: string | null
  role: UserRole
  clubId: number | null
  token: string
}

type AuthContextValue = {
  user: AuthUser | null
  login: (user: AuthUser) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadUser(): AuthUser | null {
  try {
    const raw = readAuthRaw()
    if (!raw) return null
    const user = JSON.parse(raw) as AuthUser
    if (!user.token || tokenExpired(user.token)) {
      void clearPersistedAuth()
      markSessionExpired()
      return null
    }
    return user
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadUser())

  useEffect(() => {
    const onUnauthorized = () => setUser(null)
    const onStorage = (e: StorageEvent) => {
      if (e.key === AUTH_STORAGE_KEY) setUser(loadUser())
    }
    window.addEventListener('seishin-unauthorized', onUnauthorized)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('seishin-unauthorized', onUnauthorized)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      login: async (next: AuthUser) => {
        await persistAuth(JSON.stringify(next))
        setUser(next)
      },
      logout: async () => {
        await clearPersistedAuth()
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
