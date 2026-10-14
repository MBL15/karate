import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

/** JWT-сессия. На Android localStorage WebView не успевает записаться при закрытии процесса. */
export const AUTH_STORAGE_KEY = 'seishin-auth'

function nativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

export function readAuthRaw(): string | null {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY)
  } catch {
    return null
  }
}

/** Подтянуть сессию из SharedPreferences до первого чтения AuthContext. */
export async function hydrateAuthStorage(): Promise<void> {
  if (!nativeApp()) return
  try {
    const { value } = await Preferences.get({ key: AUTH_STORAGE_KEY })
    if (value) {
      localStorage.setItem(AUTH_STORAGE_KEY, value)
      return
    }
    const existing = readAuthRaw()
    if (existing) await Preferences.set({ key: AUTH_STORAGE_KEY, value: existing })
  } catch {
    /* остаётся то, что уже есть в localStorage */
  }
}

export async function persistAuth(raw: string): Promise<void> {
  localStorage.setItem(AUTH_STORAGE_KEY, raw)
  if (!nativeApp()) return
  try {
    await Preferences.set({ key: AUTH_STORAGE_KEY, value: raw })
  } catch {
    /* сессия остаётся в localStorage на текущий запуск */
  }
}

export async function clearPersistedAuth(): Promise<void> {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    /* storage unavailable */
  }
  if (!nativeApp()) return
  try {
    await Preferences.remove({ key: AUTH_STORAGE_KEY })
  } catch {
    /* localStorage already cleared */
  }
}

/** Повторно записать сессию, когда приложение уходит в фон. */
export async function flushAuthStorage(): Promise<void> {
  if (!nativeApp()) return
  const raw = readAuthRaw()
  if (raw) await persistAuth(raw)
  else await clearPersistedAuth()
}
