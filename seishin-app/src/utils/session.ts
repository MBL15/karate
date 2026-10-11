export const LOGGED_OUT_FLAG = 'kh-logged-out'

/** '1' — пользователь вышел сам, 'expired' — сессия истекла. */
export function readLoggedOutFlag(): 'out' | 'expired' | null {
  try {
    const value = sessionStorage.getItem(LOGGED_OUT_FLAG)
    return value === '1' ? 'out' : value === 'expired' ? 'expired' : null
  } catch {
    return null
  }
}

export function markSessionExpired() {
  try {
    sessionStorage.setItem(LOGGED_OUT_FLAG, 'expired')
  } catch {
    /* storage unavailable */
  }
}

export function clearLoggedOutFlag() {
  try {
    sessionStorage.removeItem(LOGGED_OUT_FLAG)
  } catch {
    /* storage unavailable */
  }
}
