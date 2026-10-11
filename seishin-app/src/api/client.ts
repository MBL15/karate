import { isNativeApp } from '../utils/platform'
import { markSessionExpired } from '../utils/session'

export function getApiBase(): string {
  return import.meta.env.VITE_API_URL ?? ''
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem('seishin-auth')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { token?: string }
    return parsed.token ?? null
  } catch {
    return null
  }
}

const PUBLIC_AUTH_PATHS = new Set([
  '/api/auth/register',
  '/api/auth/login',
])

const SESSION_EXPIRED = 'Сессия истекла — войдите снова'

/** Срок из поля exp JWT; сервер на просроченный токен отвечает 403, а не 401. */
export function tokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number }
    return payload.exp != null && payload.exp * 1000 <= Date.now()
  } catch {
    return false
  }
}

function endSession() {
  markSessionExpired()
  localStorage.removeItem('seishin-auth')
  window.dispatchEvent(new Event('seishin-unauthorized'))
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken()
  const publicPath = PUBLIC_AUTH_PATHS.has(path)
  if (token && !publicPath && tokenExpired(token)) {
    endSession()
    throw new ApiError(401, SESSION_EXPIRED)
  }
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (token && !publicPath) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let res: Response
  try {
    res = await fetch(`${getApiBase()}${path}`, { ...options, headers })
  } catch {
    if (!import.meta.env.DEV) throw new ApiError(0, 'Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.')
    const base = getApiBase()
    const hint = isNativeApp()
      ? base
        ? `Запустите бэкенд на ${base.replace(/\/api.*/, '')} (cd seishin-backend && .\\gradlew.bat bootRun). На реальном устройстве укажите IP ПК в .env.mobile.`
        : 'Задайте VITE_API_URL в .env.mobile и пересоберите: npm run cap:sync'
      : 'Запустите бэкенд: cd seishin-backend && .\\gradlew.bat bootRun'
    throw new ApiError(0, `Сервер недоступен. ${hint}`)
  }

  if (res.status === 401 && !publicPath) endSession()

  if (!res.ok) {
    let message = res.status >= 500 ? 'Ошибка на сервере. Попробуйте ещё раз позже.' : 'Не удалось выполнить запрос'
    try {
      const body = (await res.json()) as { message?: string; error?: string; details?: Record<string, string> }
      const detail = body.details ? Object.values(body.details).find(Boolean) : undefined
      if (detail) message = detail
      else if (body.message) message = body.message
      else if (res.status === 403) message = 'Нет доступа к этому разделу'
    } catch {
      if (res.status === 403) message = 'Нет доступа к этому разделу'
    }
    if (res.status === 401 && !publicPath) message = SESSION_EXPIRED
    throw new ApiError(res.status, message)
  }

  if (res.status === 204 || res.status === 205) return undefined as T

  const text = await res.text()
  if (!text.trim()) return undefined as T

  return JSON.parse(text) as T
}
