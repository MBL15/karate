import type { HistoryEntry } from '../api/types'

/** Сервер не отдаёт родителю группу ребёнка — берём её из ближайшего занятия или последнего своего (не гостевого) посещения. */
export function childGroupName(nextTrainingGroup: string | null | undefined, history: HistoryEntry[]): string | null {
  if (nextTrainingGroup) return nextTrainingGroup
  let latest: HistoryEntry | null = null
  for (const entry of history) {
    if (entry.status === 'GUEST') continue
    if (!latest || entry.date > latest.date) latest = entry
  }
  return latest?.groupName ?? null
}
