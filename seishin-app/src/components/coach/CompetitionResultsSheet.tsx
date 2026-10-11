import { useId, useState } from 'react'
import type { Competition } from '../../api/types'
import { useStoredState } from '../../hooks/useStoredState'
import { ageText } from '../../utils/format'
import { PLACE_UI, PLACES, RESULTS_KEY, type CompetitionResults, type ResultPlace } from '../../utils/competitionResults'
import { BottomSheet } from '../ui/BottomSheet'
import { IconCheck, IconX } from '../ui/Icons'

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const DISCIPLINE: Record<string, string> = { KATA: 'Ката', KUMITE: 'Кумитэ', TEAM: 'Команда' }

export function CompetitionResultsSheet({ competition: current, onClose }: { competition: Competition | null; onClose: () => void }) {
  const titleId = useId()
  const [results, setResults] = useStoredState<CompetitionResults>(RESULTS_KEY, {})
  const [savedFlash, setSavedFlash] = useState(false)
  const [last, setLast] = useState(current)
  if (current && current !== last) setLast(current)
  const competition = current ?? last

  const open = current != null
  const started = competition ? competition.eventDate <= todayIso() : false
  const participants = (competition?.registrations ?? [])
    .filter((r) => r.rsvpStatus === 'CONFIRMED')
    .sort((a, b) => a.studentName.localeCompare(b.studentName, 'ru'))
  const filled = participants.filter((r) => results[r.id]).length

  const setResult = (registrationId: number, patch: { place?: ResultPlace; category?: string }, fallbackCategory: string) => {
    setResults((all) => {
      const prev = all[registrationId]
      return {
        ...all,
        [registrationId]: {
          place: patch.place ?? prev?.place ?? 0,
          category: patch.category ?? prev?.category ?? fallbackCategory,
          updatedAt: new Date().toISOString(),
        },
      }
    })
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1200)
  }

  const clearResult = (registrationId: number) =>
    setResults((all) => {
      const next = { ...all }
      delete next[registrationId]
      return next
    })

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
          <IconX size={16} />
        </button>
      </div>

      {!started ? (
        <div className="mt-5 rounded-2xl bg-brand-blue-light/60 p-4 text-sm">
          <p className="font-semibold text-brand-blue">Итоги можно внести в день соревнования и позже</p>
          <p className="mt-1 text-text-secondary">
            Подтвердили участие: {participants.length} из {competition?.registrations.length ?? 0}
          </p>
        </div>
      ) : participants.length === 0 ? (
        <div className="mt-5 rounded-2xl bg-surface-muted p-4 text-sm text-text-secondary">
          Никто не подтвердил участие — вносить итоги не для кого.
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="font-semibold text-text">
              Итоги · {filled} из {participants.length}
            </p>
            <span className={`flex items-center gap-1 text-xs font-semibold text-brand-green transition-opacity ${savedFlash ? 'opacity-100' : 'opacity-0'}`}>
              <IconCheck size={14} />
              Сохранено
            </span>
          </div>
          <ul className="mt-3 space-y-2">
            {participants.map((r) => {
              const result = results[r.id]
              const fallbackCategory = r.effectiveCategory ?? (r.discipline ? DISCIPLINE[r.discipline] : '')
              return (
                <li key={r.id} className="rounded-2xl border border-border-light bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate font-semibold text-text">{r.studentName}</p>
                    {result && (
                      <button type="button" onClick={() => clearResult(r.id)} className="shrink-0 text-xs font-semibold text-text-muted">
                        Сбросить
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary">
                    {ageText(r.age)}{r.weightKg ? ` · ${r.weightKg} кг` : ''}
                    {r.discipline ? ` · ${DISCIPLINE[r.discipline]}` : ''}
                  </p>
                  <div className="mt-2.5 grid grid-cols-4 gap-1.5" role="group" aria-label={`Место: ${r.studentName}`}>
                    {PLACES.map((place) => {
                      const active = result?.place === place
                      return (
                        <button
                          key={place}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setResult(r.id, { place }, fallbackCategory)}
                          className={`min-h-10 rounded-xl text-sm font-bold transition active:scale-95 ${
                            active ? `${PLACE_UI[place].className} ring-2 ring-current` : 'bg-surface-muted text-text-secondary'
                          }`}
                        >
                          {PLACE_UI[place].label}
                        </button>
                      )
                    })}
                  </div>
                  <input
                    value={result?.category ?? ''}
                    onChange={(e) => setResult(r.id, { category: e.target.value.slice(0, 80) }, fallbackCategory)}
                    placeholder={fallbackCategory || 'Категория, например «9-10 / 30-34 / Ката»'}
                    aria-label={`Категория: ${r.studentName}`}
                    className="mt-2 min-h-10 w-full rounded-xl border border-border-light bg-white px-3 text-sm text-text outline-none focus:border-brand-blue/50 focus:ring-4 focus:ring-brand-blue/10"
                  />
                </li>
              )
            })}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-text-muted">
            Итоги сохраняются сразу. Родители увидят их в «Спортсмене», когда результаты начнут отправляться на сервер.
          </p>
        </>
      )}
    </BottomSheet>
  )
}
