import { useId, useMemo, useState } from 'react'
import type { Competition } from '../../api/types'
import { coachApi } from '../../api/coach'
import { ApiError } from '../../api/client'
import { ageText } from '../../utils/format'
import { PLACE_UI, PLACES, type ResultPlace } from '../../utils/competitionResults'
import { BottomSheet } from '../ui/BottomSheet'
import { IconX } from '../ui/Icons'

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const DISCIPLINE: Record<string, string> = { KATA: 'Ката', KUMITE: 'Кумитэ', TEAM: 'Команда' }

export function CompetitionResultsSheet({
  competition: current,
  onClose,
  onDelete,
  deleting = false,
  onUpdated,
}: {
  competition: Competition | null
  onClose: () => void
  onDelete?: () => void
  deleting?: boolean
  onUpdated?: () => void
}) {
  const titleId = useId()
  const [savedFlash, setSavedFlash] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [last, setLast] = useState(current)
  if (current && current !== last) setLast(current)
  const competition = current ?? last

  const open = current != null
  const started = competition ? competition.eventDate <= todayIso() : false
  const participants = useMemo(
    () =>
      (competition?.registrations ?? [])
        .filter((r) => r.rsvpStatus === 'CONFIRMED')
        .sort((a, b) => a.studentName.localeCompare(b.studentName, 'ru')),
    [competition],
  )
  const filled = participants.filter((r) => r.resultPlace != null).length

  const setResult = (registrationId: number, patch: { place?: ResultPlace; category?: string }, fallbackCategory: string) => {
    const reg = participants.find((r) => r.id === registrationId)
    const place = patch.place ?? (reg?.resultPlace as ResultPlace | undefined) ?? 0
    const category = patch.category ?? reg?.resultCategory ?? fallbackCategory
    setError(null)
    void coachApi
      .updateRegistrationResult(registrationId, place, category)
      .then(() => {
        setSavedFlash(true)
        window.setTimeout(() => setSavedFlash(false), 1200)
        onUpdated?.()
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Не удалось сохранить итог'))
  }

  const clearResult = (registrationId: number) => {
    setError(null)
    void coachApi
      .clearRegistrationResult(registrationId)
      .then(() => onUpdated?.())
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Не удалось убрать итог'))
  }

  return (
    <BottomSheet open={open} titleId={titleId} onClose={onClose}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="truncate font-display text-xl font-bold text-text">
            {competition?.name}
          </h2>
          <p className="mt-0.5 text-sm text-text-secondary">
            {competition && new Date(`${competition.eventDate}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
            {competition?.location ? ` · ${competition.location}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-secondary transition active:scale-90"
        >
          <IconX size={18} />
        </button>
      </div>

      {error && <p className="mt-3 text-sm font-medium text-error">{error}</p>}

      {!started ? (
        <p className="mt-4 rounded-2xl bg-surface-muted p-4 text-sm text-text-secondary">Итоги можно вносить в день соревнования и позже — родители увидят их в «Спортсмене».</p>
      ) : participants.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-surface-muted p-4 text-sm text-text-secondary">Нет подтвердивших участие — некому проставлять места.</p>
      ) : (
        <>
          <p className="mt-3 text-xs text-text-secondary">
            Заполнено {filled} из {participants.length}
            {savedFlash && <span className="ml-2 font-semibold text-brand-green">Сохранено на сервере</span>}
          </p>
          <ul className="mt-3 space-y-2">
            {participants.map((r) => {
              const place = (r.resultPlace ?? null) as ResultPlace | null
              const category = r.resultCategory ?? r.effectiveCategory ?? ''
              return (
                <li key={r.id} className="rounded-2xl border border-border-light bg-white p-3 shadow-[var(--shadow-card)]">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-text">{r.studentName}</p>
                      <p className="text-xs text-text-secondary">
                        {ageText(r.age)}
                        {r.discipline ? ` · ${DISCIPLINE[r.discipline] ?? r.discipline}` : ''}
                      </p>
                    </div>
                    {place != null && (
                      <button type="button" onClick={() => clearResult(r.id)} className="text-xs font-semibold text-error">
                        Сбросить
                      </button>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {PLACES.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setResult(r.id, { place: p }, category)}
                        className={`rounded-full px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
                          place === p ? PLACE_UI[p].className : 'bg-surface-muted text-text-secondary'
                        }`}
                      >
                        {PLACE_UI[p].label}
                      </button>
                    ))}
                  </div>
                  <input
                    defaultValue={category}
                    key={`${r.id}-${category}`}
                    onBlur={(e) => setResult(r.id, { category: e.target.value }, category)}
                    placeholder="Категория"
                    className="input-coach mt-2 text-sm"
                  />
                </li>
              )
            })}
          </ul>
        </>
      )}

      {onDelete && (
        <button
          type="button"
          disabled={deleting}
          onClick={onDelete}
          className="mt-6 min-h-11 w-full rounded-2xl border border-error/30 text-sm font-semibold text-error"
        >
          {deleting ? 'Удаление…' : 'Удалить соревнование'}
        </button>
      )}
    </BottomSheet>
  )
}
