import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { coachApi } from '../../api/coach'
import type { Competition } from '../../api/types'
import { ApiError } from '../../api/client'
import { CoachPageShell } from '../../components/coach/CoachPageShell'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

export function CoachCompetitionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', location: 'Спорткомплекс Karate Hub', description: '' })
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    const list = await coachApi.competitions()
    setCompetitions(list)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (searchParams.get('add') !== 'competition') return
    const now = new Date()
    setSelectedDate(toIsoDate(now.getFullYear(), now.getMonth(), now.getDate()))
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
    if (!selectedDate) return
    try {
      await coachApi.createCompetition({
        name: form.name,
        eventDate: selectedDate,
        location: form.location,
        description: form.description,
      })
      setMessage('Соревнование создано — родители увидят приглашение')
      setForm({ name: '', location: 'Спорткомплекс Karate Hub', description: '' })
      setShowForm(false)
      await load()
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Ошибка')
    }
  }

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <CoachPageShell
      title="Соревнования"
      subtitle="Календарь турниров — новые события отображаются у родителей"
    >
      {message && <p className="alert-success">{message}</p>}

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

      {showForm && selectedDate && (
        <form onSubmit={createCompetition} className="card mb-6 max-w-lg p-6">
          <p className="text-lg font-bold text-text">
            Новое соревнование · {new Date(selectedDate).toLocaleDateString('ru-RU')}
          </p>
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
            placeholder="Место"
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
            <button type="submit" className="btn-coach">Создать</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Отмена</button>
          </div>
        </form>
      )}

      <section>
        <h2 className="section-title mb-4">Все соревнования</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {competitions.map((c) => (
            <div key={c.id} className="card border-l-4 border-l-brand-blue p-5">
              <p className="font-semibold text-text">{c.name}</p>
              <p className="mt-1 text-sm text-text-secondary">
                {new Date(c.eventDate).toLocaleDateString('ru-RU')} · {c.location}
              </p>
              <p className="mt-2 text-xs font-medium text-brand-blue">
                Подтверждено: {c.registrations.filter((r) => r.rsvpStatus === 'CONFIRMED').length} / {c.registrations.length}
              </p>
            </div>
          ))}
        </div>
      </section>
    </CoachPageShell>
  )
}
