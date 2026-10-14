import { isNativeApp } from './platform'

const LAST_PUSH_KEY = 'coach-last-push-id'

export function readLastPushId(): number {
  try {
    return Number(sessionStorage.getItem(LAST_PUSH_KEY) || '0') || 0
  } catch {
    return 0
  }
}

export function writeLastPushId(id: number) {
  try {
    sessionStorage.setItem(LAST_PUSH_KEY, String(id))
  } catch {
    /* ignore */
  }
}

export async function ensureCoachPushPermission(): Promise<boolean> {
  if (isNativeApp()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      const perm = await LocalNotifications.checkPermissions()
      if (perm.display === 'granted') return true
      const req = await LocalNotifications.requestPermissions()
      return req.display === 'granted'
    } catch {
      return false
    }
  }
  if (typeof Notification === 'undefined') return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export async function showCoachPush(title: string, body: string, id: number) {
  if (isNativeApp()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications')
      await LocalNotifications.schedule({
        notifications: [
          {
            id: id % 2_000_000_000,
            title,
            body,
            schedule: { at: new Date(Date.now() + 400) },
          },
        ],
      })
    } catch {
      /* plugin unavailable */
    }
    return
  }
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      new Notification(title, { body, tag: `coach-notification-${id}` })
    } catch {
      /* ignore */
    }
  }
}
