import type { CoachClubProfile } from '../api/types'
import { coachApi } from '../api/coach'
import { readStored, storedKey } from '../hooks/useStoredState'

const LEGACY_CLUB_PROFILE_KEY = 'club-profile'

type LegacyClubProfile = {
  name?: string
  description?: string
  address?: string
  logo?: string | null
}

function remoteProfileEmpty(remote: CoachClubProfile): boolean {
  return (
    !remote.description?.trim() &&
    !remote.address?.trim() &&
    !remote.logo?.trim()
  )
}

function legacyHasData(legacy: LegacyClubProfile): boolean {
  return !!(
    legacy.description?.trim() ||
    legacy.address?.trim() ||
    legacy.logo?.trim() ||
    legacy.name?.trim()
  )
}

/** Один раз переносит старый club-profile из localStorage на сервер. */
export async function migrateLegacyClubProfile(userId: number, remote: CoachClubProfile): Promise<CoachClubProfile> {
  const legacy = readStored<LegacyClubProfile | null>(storedKey(userId, LEGACY_CLUB_PROFILE_KEY), null)
  if (!legacy || !legacyHasData(legacy) || !remoteProfileEmpty(remote)) {
    return remote
  }

  const payload: Partial<CoachClubProfile> = {
    description: legacy.description?.trim() || undefined,
    address: legacy.address?.trim() || undefined,
    logo: legacy.logo ?? undefined,
  }
  if (legacy.name?.trim() && legacy.name.trim() !== remote.name) {
    payload.name = legacy.name.trim()
  }

  try {
    const saved = await coachApi.clubProfileUpdate(payload)
    localStorage.removeItem(storedKey(userId, LEGACY_CLUB_PROFILE_KEY))
    return saved
  } catch {
    return remote
  }
}
