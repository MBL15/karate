import { useCallback, useEffect, useState } from 'react'
import { coachApi } from '../api/coach'
import type { CoachIssuedBadge } from '../api/types'
import type { IssuedBadge } from '../components/coach/home/helpers'
import { BADGE_EVENT_NOTE_PREFIX } from '../utils/coachSync'

function toIssuedBadge(row: CoachIssuedBadge): IssuedBadge {
  const date = row.issuedAt.slice(0, 10)
  let eventKey: string | undefined
  const note = row.note?.trim()
  if (note?.startsWith(BADGE_EVENT_NOTE_PREFIX)) {
    eventKey = note.slice(BADGE_EVENT_NOTE_PREFIX.length)
  }
  return {
    studentId: row.studentId,
    badgeId: row.badgeId,
    name: row.badgeName,
    date,
    eventKey,
  }
}

export function useCoachIssuedBadges() {
  const [issued, setIssued] = useState<IssuedBadge[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const rows = await coachApi.issuedBadges()
    setIssued(rows.map(toIssuedBadge))
  }, [])

  useEffect(() => {
    let alive = true
    refresh()
      .catch(() => undefined)
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [refresh])

  return { issued, loading, refresh }
}
