import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { coachApi } from '../../api/coach'
import type { Competition } from '../../api/types'
import { ApiError } from '../../api/client'
import { CoachPageShell } from '../../components/coach/CoachPageShell'
import { DateField } from '../../components/ui/DateField'
import { CompetitionResultsSheet } from '../../components/coach/CompetitionResultsSheet'
import { useStoredState } from '../../hooks/useStoredState'
import { RESULTS_KEY, type CompetitionResults } from '../../utils/competitionResults'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const EMPTY_FORM = { name: '', location: '', description: '' }

const dayLabel = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('ru-RU')

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

function parseIsoFromField(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export function CoachCompetitionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [resultsFor, setResultsFor] = useState<Competition | null>(null)
  const [results, setResults] = useStoredState<CompetitionResults>(RESULTS_KEY, {})
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const todayIso = toIsoDate(today.getFullYear(), today.getMonth(), today.getDate())

  const load = useCallback(async () => {
    setLoadError(null)
    try {
      setCompetitions(await coachApi.competitions())
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Не удалось загрузить мероприятия')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (searchParams.get('add') !== 'competition') return
    const now = new Date()
    setSelectedDate(toIsoDate(now.getFullYear(), now.getMonth(), now.getDate()))
    if (searchParams.get('kind') === 'attestation') {
      setForm((current) => ({ ...current, name: 'Аттестация на пояс' }))
    }
    setShowForm(true)
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7

  const competitionsByDate = useMemo(() => {
    const map: Record<string, Competition[]> = {}
    for (const c of competitions) {
      if (!map[c.eventDate]) map[c.eventDate] = []
      map[c.eventDate].push(c)
    }
    return map
  }, [competitions])

  const createCompetition = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedDate || saving || selectedDate < todayIso) return
    setSaving(true)
    try {
      await coachApi.createCompetition({
        name: form.name.trim(),
        eventDate: selectedDate,
        location: form.location.trim(),
        description: form.description.trim(),
      })
      setMessage({ text: 'Мероприятие создано — родители увидят приглашение', ok: true })
      setForm(EMPTY_FORM)
      setShowForm(false)
      await load()
    } catch (err) {
      setMessage({ text: err instanceof ApiError ? err.message : 'Не удалось создать мероприятие', ok: false })
    } finally {
      setSaving(false)
    }
  }

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  const deleteCompetition = async (c: Competition) => {
    const ok = window.confirm(
      `Удалить «${c.name}» (${dayLabel(c.eventDate)})? Приглашения и ответы родителей исчезнут.`,
    )
    if (!ok || deletingId != null) return
    setDeletingId(c.id)
    setMessage(null)
    try {
      await coachApi.deleteCompetition(c.id)
      const regIds = new Set(c.registrations.map((r) => r.id))
      setResults((all) => {
        const next = { ...all }
        for (const id of regIds) delete next[id]
        return next
      })
      if (resultsFor?.id === c.id) setResultsFor(null)
      setMessage({ text: 'Мероприятие удалено', ok: true })
      await load()
    } catch (err) {
      setMessage({ text: err instanceof ApiError ? err.message : 'Не удалось удалить мероприятие', ok: false })
    } finally {
      setDeletingId(null)
    }
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <CoachPageShell
      title="Мероприятия"
      subtitle="Календарь мероприятий — новые события отображаются у родителей"
    >
      {message && <p className={message.ok ? 'alert-success' : 'alert-error'}>{message.text}</p>}

      <div className="card mb-6 p-6">
        <div className="mb-6 flex items-center justify-between">
          <button type="button" onClick={() => shiftMonth(-1)} className="btn-ghost size-11 rounded-full p-0" aria-label="Предыдущий месяц">
            <span aria-hidden="true">←</span>
          </button>
          <p className="text-lg font-semibold capitalize text-text" aria-live="polite">{monthLabel}</p>
          <button type="button" onClick={() => shiftMonth(1)} className="btn-ghost size-11 rounded-full p-0" aria-label="Следующий месяц">
            <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-text-secondary">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">{d}</div>
          ))}
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`e-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const iso = toIsoDate(year, month, day)
            const has = competitionsByDate[iso]?.length
            const selected = selectedDate === iso
            const isToday = iso === toIsoDate(today.getFullYear(), today.getMonth(), today.getDate())
            return (
              <button
                key={day}
                type="button"
                onClick={() => {
                  setSelectedDate(iso)
                  setShowForm(true)
                }}
                aria-pressed={selected}
                aria-label={`${day} ${monthLabel}${isToday ? ', сегодня' : ''}${has ? `, соревнований: ${has}` : ''}`}
                className={`relative min-h-11 rounded-xl py-2 text-sm transition ${
                  selected
                    ? 'bg-brand-blue font-bold text-white shadow-md'
                    : has
                      ? 'bg-brand-blue-light font-semibold text-brand-blue hover:bg-brand-blue/10'
                      : isToday
                        ? 'ring-2 ring-brand-blue/30 hover:bg-surface-muted'
                        : 'text-text hover:bg-surface-muted'
                }`}
              >
                {day}
                {has ? (
                  <span className={`mt-0.5 block text-xs ${selected ? 'text-white' : 'text-brand-blue'}`}>
                    {has}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setSelectedDate(todayIso)
            setShowForm(true)
          }}
          className="btn-coach"
        >
          Новое мероприятие
        </button>
      </div>

      {showForm && selectedDate && (
        <form onSubmit={createCompetition} className="card mb-6 max-w-lg p-6">
          <p className="text-lg font-bold text-text">Новое мероприятие</p>
          <label className="label mt-4" htmlFor="competition-date">
            Дата
          </label>
          <DateField
            id="competition-date"
            value={selectedDate}
            onChange={(iso) => {
              setSelectedDate(iso)
              const parsed = parseIsoFromField(iso)
              if (parsed) {
                setYear(parsed.getFullYear())
                setMonth(parsed.getMonth())
              }
            }}
            required
          />
          {selectedDate < todayIso && (
            <p className="mt-2 rounded-xl bg-warning-bg px-3 py-2 text-sm text-text-secondary">
              Эта дата уже прошла — родители не увидят приглашение. Укажите сегодняшний или будущий день.
            </p>
          )}
          <label className="label mt-4" htmlFor="competition-name">Название</label>
          <input
            id="competition-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Название"
            className="input-coach"
            required
          />
          <label className="label mt-3" htmlFor="competition-location">Место</label>
          <input
            id="competition-location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Например, СК «Олимп», ул. Ленина, 1"
            className="input-coach"
          />
          <label className="label mt-3" htmlFor="competition-description">Описание</label>
          <textarea
            id="competition-description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Описание"
            className="input-coach resize-none"
            rows={2}
          />
          <div className="mt-4 flex gap-2">
            <button type="submit" disabled={saving || selectedDate < todayIso} className="btn-coach">
              {saving ? 'Создаём…' : 'Создать'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Отмена</button>
          </div>
        </form>
      )}

      <section>
        <h2 className="section-title mb-4">Все мероприятия</h2>
        {loading ? (
          <p className="text-sm text-text-secondary">Загружаем…</p>
        ) : loadError ? (
          <div className="alert-error flex items-center justify-between gap-3">
            <span>{loadError}</span>
            <button type="button" onClick={() => void load()} className="font-semibold underline">
              Повторить
            </button>
          </div>
        ) : competitions.length === 0 ? (
          <p className="rounded-2xl bg-surface-muted px-4 py-3 text-sm text-text-secondary">
            Мероприятий пока нет. Нажмите на день в календаре, чтобы создать турнир или аттестацию.
          </p>
        ) : null}
        <div className="grid gap-3 lg:grid-cols-2">
          {competitions.map((c) => {
            const past = c.eventDate <= todayIso
            const confirmed = c.registrations.filter((r) => r.rsvpStatus === 'CONFIRMED')
            const withResults = confirmed.filter((r) => results[r.id])
            const medals = ([1, 2, 3] as const).map((p) => withResults.filter((r) => results[r.id].place === p).length)
            return (
              <article key={c.id} className="card border-l-4 border-l-brand-blue p-5">
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => setResultsFor(c)}
                    className="min-w-0 flex-1 text-left transition hover:opacity-90"
                  >
                    <p className="font-semibold text-text">{c.name}</p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {dayLabel(c.eventDate)}
                      {c.location ? ` · ${c.location}` : ''}
                    </p>
                    <p className="mt-2 text-xs font-medium text-brand-blue">
                      Подтверждено: {confirmed.length} / {c.registrations.length}
                    </p>
                    {past && confirmed.length > 0 && (
                      <p className={`mt-2 text-xs font-semibold ${withResults.length ? 'text-text' : 'text-warning'}`}>
                        {withResults.length
                          ? `Итоги: ${withResults.length}/${confirmed.length}` +
                            (medals.some(Boolean) ? ` · призовых мест: ${medals[0] + medals[1] + medals[2]}` : '')
                          : 'Внесите итоги соревнования →'}
                      </p>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === c.id}
                    onClick={() => void deleteCompetition(c)}
                    className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-error transition hover:bg-error-bg disabled:opacity-50"
                  >
                    {deletingId === c.id ? '…' : 'Удалить'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <CompetitionResultsSheet
        competition={resultsFor}
        onClose={() => setResultsFor(null)}
        onDelete={resultsFor ? () => void deleteCompetition(resultsFor) : undefined}
        deleting={resultsFor != null && deletingId === resultsFor.id}
        onUpdated={() => void load()}
      />
    </CoachPageShell>
  )
}
