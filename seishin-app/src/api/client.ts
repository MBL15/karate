import { isNativeApp } from '../utils/platform'

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

const AUTH_PATH_PREFIX = '/api/auth/'

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken()
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }
  if (token && !path.startsWith(AUTH_PATH_PREFIX)) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let res: Response
  try {
    res = await fetch(`${getApiBase()}${path}`, { ...options, headers })
  } catch {
    const base = getApiBase()
    const hint = isNativeApp()
      ? base
        ? `Запустите бэкенд на ${base.replace(/\/api.*/, '')} (cd seishin-backend && .\\gradlew.bat bootRun). На реальном устройстве укажите IP ПК в .env.mobile.`
        : 'Задайте VITE_API_URL в .env.mobile и пересоберите: npm run cap:sync'
      : 'Запустите бэкенд: cd seishin-backend && .\\gradlew.bat bootRun'
    throw new ApiError(0, `Сервер недоступен. ${hint}`)
  }

  if (res.status === 401) {
    localStorage.removeItem('seishin-auth')
    window.dispatchEvent(new Event('seishin-unauthorized'))
  }

  if (!res.ok) {
    let message = res.statusText
    try {
      const body = (await res.json()) as { message?: string; error?: string }
      if (body.message) message = body.message
      else if (res.status === 403 && body.error === 'Forbidden') {
        message = 'Доступ запрещён. Перезапустите бэкенд после обновления или откройте приложение через Vite (npm run dev).'
      }
    } catch {
      if (res.status === 403) {
        message = 'Доступ запрещён. Проверьте, что бэкенд запущен (gradlew.bat bootRun).'
      }
    }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204 || res.status === 205) return undefined as T

  const text = await res.text()
  if (!text.trim()) return undefined as T

  return JSON.parse(text) as T
}
