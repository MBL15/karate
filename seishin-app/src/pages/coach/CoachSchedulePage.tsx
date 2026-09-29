import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { coachApi } from '../../api/coach'
import type { ClassEvent, GroupSummary, ScheduleSlot, TrainingReminder } from '../../api/types'
import { ApiError } from '../../api/client'
import { CoachPageShell } from '../../components/coach/CoachPageShell'
import { CoachError, CoachLoading } from '../../components/coach/CoachScreenState'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const WEEKDAY_OPTIONS = [
  { value: 1, label: 'Понедельник' },
  { value: 2, label: 'Вторник' },
  { value: 3, label: 'Среда' },
  { value: 4, label: 'Четверг' },
  { value: 5, label: 'Пятница' },
  { value: 6, label: 'Суббота' },
  { value: 7, label: 'Воскресенье' },
]

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

function formatTime(value?: string | null) {
  if (!value) return ''
  return value.slice(0, 5)
}

function formatDateLabel(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function timeRange(event: { startTime: string; endTime?: string | null }) {
  const start = formatTime(event.startTime)
  const end = formatTime(event.endTime)
  return end ? `${start}–${end}` : start
}

export function CoachSchedulePage() {
  const today = new Date()
  const todayIso = toIsoDate(today.getFullYear(), today.getMonth(), today.getDate())
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(todayIso)
  const [slots, setSlots] = useState<ScheduleSlot[]>([])
  const [events, setEvents] = useState<ClassEvent[]>([])
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [reminders, setReminders] = useState<TrainingReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({
    groupId: '',
    weekday: '1',
    startTime: '17:00',
    endTime: '18:00',
    location: 'Зал Karate Hub',
  })

  const monthFrom = toIsoDate(year, month, 1)
  const monthTo = toIsoDate(year, month, new Date(year, month + 1, 0).getDate())

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [schedule, classes, groupList] = await Promise.all([
        coachApi.schedule(),
        coachApi.classes(monthFrom, monthTo),
        coachApi.groups(),
      ])
      setSlots(schedule)
      setEvents(classes)
      setGroups(groupList)
      setForm((prev) => ({
        ...prev,
        groupId: prev.groupId || (groupList[0] ? String(groupList[0].id) : ''),
      }))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Ошибка загрузки расписания')
    } finally {
      setLoading(false)
    }
  }, [monthFrom, monthTo])

  useEffect(() => {
    void load()
  }, [load])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7

  const eventsByDate = useMemo(() => {
    const map: Record<string, ClassEvent[]> = {}
    for (const event of events) {
      if (!map[event.date]) map[event.date] = []
      map[event.date].push(event)
    }
    return map
  }, [events])

  const selectedEvents = eventsByDate[selectedDate] ?? []

  const slotsByWeekday = useMemo(() => {
    const map: Record<number, ScheduleSlot[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] }
    for (const slot of slots) {
      map[slot.weekday]?.push(slot)
    }
    return map
  }, [slots])

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  })

  const addSlot = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.groupId) return
    try {
      await coachApi.createSchedule({
        groupId: Number(form.groupId),
        weekday: Number(form.weekday),
        startTime: form.startTime.length === 5 ? `${form.startTime}:00` : form.startTime,
        endTime: form.endTime ? (form.endTime.length === 5 ? `${form.endTime}:00` : form.endTime) : undefined,
        location: form.location,
      })
      setMessage('Слот добавлен в расписание')
      setShowForm(false)
      await load()
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Не удалось сохранить слот')
    }
  }

  const removeSlot = async (id: number) => {
    try {
      await coachApi.deleteSchedule(id)
      setMessage('Слот убран из расписания')
      await load()
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Не удалось удалить слот')
    }
  }

  const remind = async (scheduleId?: number) => {
    setSending(true)
    try {
      const list = await coachApi.sendTrainingReminders({
        date: selectedDate,
        scheduleId,
      })
      setReminders(list)
      setMessage(list.length ? `Отправлено напоминаний: ${list.length}` : 'Нет родителей для напоминания')
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Не удалось отправить напоминания')
    } finally {
      setSending(false)
    }
  }

  return (
    <CoachPageShell
      title="Занятия"
      subtitle="Недельное расписание, календарь тренировок и напоминания родителям"
      headerActions={
        <button type="button" onClick={() => setShowForm((v) => !v)} className="btn-secondary">
          {showForm ? 'Закрыть форму' : 'Добавить слот'}
        </button>
      }
    >
      {loading && slots.length === 0 ? (
        <CoachLoading />
      ) : error ? (
        <>
          <CoachError message={error} />
          <button type="button" onClick={() => void load()} className="btn-coach">
            Повторить
          </button>
        </>
      ) : (
        <>
      {message && <p className="alert-success">{message}</p>}

      {showForm && (
        <form onSubmit={addSlot} className="card mb-6 grid gap-4 p-6 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="slot-group">Группа</label>
            <select
              id="slot-group"
              className="input-coach"
              value={form.groupId}
              onChange={(e) => setForm({ ...form, groupId: e.target.value })}
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="slot-day">День недели</label>
            <select
              id="slot-day"
              className="input-coach"
              value={form.weekday}
              onChange={(e) => setForm({ ...form, weekday: e.target.value })}
            >
              {WEEKDAY_OPTIONS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="slot-start">Начало</label>
            <input
              id="slot-start"
              type="time"
              className="input-coach"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="slot-end">Окончание</label>
            <input
              id="slot-end"
              type="time"
              className="input-coach"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="slot-location">Зал</label>
            <input
              id="slot-location"
              className="input-coach"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Зал Karate Hub"
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-coach">
              Сохранить в расписание
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="card p-6">
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
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-2">{day}</div>
            ))}
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const iso = toIsoDate(year, month, day)
              const dayEvents = eventsByDate[iso] ?? []
              const selected = selectedDate === iso
              const isToday = iso === todayIso
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => {
                    setSelectedDate(iso)
                    setReminders([])
                  }}
                  aria-pressed={selected}
                  aria-label={`${day} ${monthLabel}${isToday ? ', сегодня' : ''}${dayEvents.length ? `, занятий: ${dayEvents.length}` : ''}`}
                  className={`relative min-h-11 rounded-xl py-2 text-sm transition ${
                    selected
                      ? 'bg-navy-950 text-white shadow-sm'
                      : isToday
                        ? 'bg-brand-blue-light font-semibold text-brand-blue'
                        : 'hover:bg-surface-muted'
                  }`}
                >
                  {day}
                  {dayEvents.length > 0 && (
                    <span className={`mt-0.5 block text-xs font-semibold ${selected ? 'text-white' : 'text-brand-blue'}`}>
                      {dayEvents.length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </section>

        <section className="card p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="section-title capitalize">{formatDateLabel(selectedDate)}</h2>
              <p className="mt-1 text-sm text-text-secondary">
                {selectedEvents.length
                  ? `${selectedEvents.length} ${selectedEvents.length === 1 ? 'занятие' : 'занятия'}`
                  : 'В этот день тренировок нет'}
              </p>
            </div>
            <button
              type="button"
              disabled={sending || selectedEvents.length === 0}
              onClick={() => void remind()}
              className="btn-coach shrink-0"
            >
              Напомнить
            </button>
          </div>

          {selectedEvents.length === 0 ? (
            <p className="rounded-xl bg-surface-muted px-4 py-6 text-sm text-text-secondary">
              Выберите день с точкой на календаре или добавьте слот в расписание.
            </p>
          ) : (
            <ul className="space-y-3">
              {selectedEvents.map((event) => (
                <li key={`${event.scheduleId}-${event.date}`} className="rounded-xl bg-surface-muted p-4">
                  <p className="font-semibold text-text">{event.groupName}</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {timeRange(event)}
                    {event.location ? ` · ${event.location}` : ''}
                    {` · ${event.studentCount} уч.`}
                  </p>
                  <button
                    type="button"
                    disabled={sending}
                    onClick={() => void remind(event.scheduleId)}
                    className="mt-3 text-sm font-semibold text-brand-blue hover:underline"
                  >
                    Напомнить родителям этой группы
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card p-6">
        <h2 className="section-title mb-4">Недельное расписание</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {WEEKDAY_OPTIONS.map((day) => (
            <div key={day.value} className="rounded-2xl bg-surface-muted p-4">
              <p className="mb-3 text-sm font-semibold text-text">{day.label}</p>
              {(slotsByWeekday[day.value] ?? []).length === 0 ? (
                <p className="text-xs text-text-muted">Нет занятий</p>
              ) : (
                <ul className="space-y-2">
                  {(slotsByWeekday[day.value] ?? []).map((slot) => (
                    <li key={slot.id} className="rounded-xl bg-surface px-3 py-2">
                      <p className="text-sm font-semibold text-text">{timeRange(slot)}</p>
                      <p className="text-xs text-text-secondary">{slot.groupName}</p>
                      {slot.location && <p className="text-xs text-text-muted">{slot.location}</p>}
                      <button
                        type="button"
                        onClick={() => void removeSlot(slot.id)}
                        className="mt-2 text-xs font-semibold text-error hover:underline"
                      >
                        Удалить
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {reminders.length > 0 && (
        <section className="card p-6">
          <h2 className="section-title mb-4">Отправленные напоминания</h2>
          <ul className="space-y-3">
            {reminders.map((item, index) => (
              <li key={`${item.studentId}-${item.time}-${index}`} className="rounded-xl bg-surface-muted p-4">
                <p className="font-semibold text-text">{item.studentName}</p>
                <p className="mt-1 text-sm text-text-secondary">
                  {item.parentName ?? 'Родитель не привязан'}
                  {item.parentPhone ? ` · ${item.parentPhone}` : ''}
                </p>
                <p className="mt-2 text-sm text-text">{item.message}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
        </>
      )}
    </CoachPageShell>
  )
}
