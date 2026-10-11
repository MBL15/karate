import { useEffect, useRef, useState } from 'react'
import { coachApi } from '../../api/coach'
import { ApiError } from '../../api/client'
import type { GroupSummary, ScheduleSlot } from '../../api/types'
import { BottomSheet } from '../ui/BottomSheet'
import { IconMapPin, IconX } from '../ui/Icons'
import { hhmm, WEEKDAY_SHORT } from '../../utils/schedule'

type DayTime = { start: number; duration: number }

const toMin = (value: string) => {
  const [h, m] = value.split(':').map(Number)
  return h * 60 + (m || 0)
}
const fromMin = (total: number) => `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
const withSeconds = (value: string) => `${value}:00`

function durationLabel(min: number) {
  if (min < 60) return `${min} мин`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} ч ${m} мин` : `${h} ч`
}

function initialState(groupId: number | null, slots: ScheduleSlot[]) {
  const own = slots.filter((s) => s.groupId === groupId).sort((a, b) => a.startTime.localeCompare(b.startTime))
  const times: Record<number, DayTime> = {}
  for (const s of own) {
    if (times[s.weekday]) continue
    const start = toMin(hhmm(s.startTime))
    times[s.weekday] = { start, duration: s.endTime ? Math.max(15, toMin(hhmm(s.endTime)) - start) : 60 }
  }
  const values = Object.values(times)
  const same = values.every((t) => t.start === values[0].start && t.duration === values[0].duration)
  return {
    days: Object.keys(times).map(Number).sort(),
    times,
    same,
    common: values[0] ?? { start: 17 * 60, duration: 60 },
    location: own.find((s) => s.location)?.location ?? slots.find((s) => s.location)?.location ?? '',
  }
}

export function ScheduleSheet({
  open,
  groups,
  slots,
  initialGroupId,
  editSlot,
  onClose,
  onChanged,
}: {
  open: boolean
  groups: GroupSummary[]
  slots: ScheduleSlot[]
  initialGroupId?: number | null
  editSlot?: ScheduleSlot | null
  onClose: () => void
  onChanged: (message: string, close: boolean) => void
}) {
  const firstGroup = editSlot?.groupId ?? initialGroupId ?? groups[0]?.id ?? null
  const [groupId, setGroupId] = useState<number | null>(firstGroup)
  const [state, setState] = useState(() => initialState(firstGroup, slots))
  const [focusDay, setFocusDay] = useState<number | null>(editSlot?.weekday ?? null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { days, times, same, common, location } = state

  const timeOf = (day: number): DayTime => (same ? common : (times[day] ?? common))
  const update = (patch: Partial<typeof state>) => setState((s) => ({ ...s, ...patch }))

  const selectGroup = (id: number) => {
    setGroupId(id)
    setState(initialState(id, slots))
    setFocusDay(null)
    setError(null)
  }

  const toggleDay = (day: number) => {
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort()
    update({ days: next, times: times[day] ? times : { ...times, [day]: common } })
  }

  const setCommon = (patch: Partial<DayTime>) => {
    const value = { ...common, ...patch }
    update({ common: value })
  }

  const setDay = (day: number, patch: Partial<DayTime>) => update({ times: { ...times, [day]: { ...timeOf(day), ...patch } } })

  const groupSlots = slots.filter((s) => s.groupId === groupId)
  const changes = (() => {
    const remove: ScheduleSlot[] = []
    const create: { weekday: number; start: string; end: string }[] = []
    for (let day = 1; day <= 7; day++) {
      const existing = groupSlots.filter((s) => s.weekday === day)
      if (!days.includes(day)) {
        remove.push(...existing)
        continue
      }
      const t = timeOf(day)
      const start = fromMin(t.start)
      const end = fromMin(t.start + t.duration)
      const unchanged =
        existing.length === 1 &&
        hhmm(existing[0].startTime) === start &&
        hhmm(existing[0].endTime) === end &&
        (existing[0].location ?? '') === location.trim()
      if (unchanged) continue
      remove.push(...existing)
      create.push({ weekday: day, start, end })
    }
    return { remove, create }
  })()
  const dirty = changes.remove.length + changes.create.length > 0

  const save = async () => {
    if (!groupId || !dirty) return
    if (days.some((d) => timeOf(d).start + timeOf(d).duration > 24 * 60)) {
      setError('Тренировка должна закончиться до полуночи — сдвиньте начало или сократите длительность')
      return
    }
    setSaving(true)
    setError(null)
    let written = 0
    try {
      for (const c of changes.create) {
        await coachApi.createSchedule({
          groupId,
          weekday: c.weekday,
          startTime: withSeconds(c.start),
          endTime: withSeconds(c.end),
          location: location.trim() || undefined,
        })
        written++
      }
      for (const slot of changes.remove) {
        await coachApi.deleteSchedule(slot.id)
        written++
      }
      const name = groups.find((g) => g.id === groupId)?.name ?? 'Группа'
      onChanged(
        days.length ? `Расписание «${name}» сохранено: ${days.map((d) => WEEKDAY_SHORT[d - 1]).join(', ')}` : `«${name}» убрана из расписания`,
        true,
      )
    } catch (e) {
      const text = e instanceof ApiError ? e.message : 'Не удалось сохранить расписание'
      if (written > 0) onChanged(`Расписание сохранено не полностью: ${text}. Проверьте дни и сохраните ещё раз`, false)
      else setError(text)
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet open={open} titleId="schedule-sheet-title" onClose={onClose}>
      <div className="flex items-center gap-2">
        <h2 id="schedule-sheet-title" className="flex-1 text-xl font-bold tracking-tight text-text">
          Расписание группы
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="flex size-10 items-center justify-center rounded-full bg-surface-muted text-text-secondary transition hover:bg-surface-subtle"
        >
          <IconX size={18} />
        </button>
      </div>
      <p className="mt-1 text-sm text-text-secondary">Отметьте дни и время — тренировки будут повторяться каждую неделю.</p>

      {groups.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {groups.map((g) => {
            const active = g.id === groupId
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => selectGroup(g.id)}
                aria-pressed={active}
                className={`min-h-10 rounded-full px-4 text-sm font-semibold transition active:scale-95 ${
                  active ? 'bg-brand-blue text-white shadow-[var(--shadow-blue)]' : 'bg-surface-muted text-text-secondary hover:text-text'
                }`}
              >
                {g.name}
              </button>
            )
          })}
        </div>
      )}

      <p className="mt-5 text-sm font-semibold text-text">Дни тренировок</p>
      <div className="mt-2 grid grid-cols-7 gap-1.5">
        {WEEKDAY_SHORT.map((label, i) => {
          const day = i + 1
          const active = days.includes(day)
          return (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              aria-pressed={active}
              className={`aspect-square rounded-2xl text-sm font-bold transition active:scale-90 ${
                active
                  ? 'bg-brand-blue text-white shadow-[var(--shadow-blue)]'
                  : day > 5
                    ? 'bg-surface-muted text-[#d94b55]'
                    : 'bg-surface-muted text-text'
              } ${focusDay === day && active ? 'ring-2 ring-brand-blue ring-offset-2' : ''}`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {days.length > 0 && (
        <>
          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm font-semibold text-text">Время</p>
            {days.length > 1 && (
              <div className="flex rounded-full bg-surface-subtle p-0.5 text-xs font-semibold">
                {[
                  [true, 'Одинаковое'],
                  [false, 'По дням'],
                ].map(([value, label]) => (
                  <button
                    key={String(value)}
                    type="button"
                    onClick={() => update(value ? { same: true } : { same: false, times: Object.fromEntries(days.map((d) => [d, timeOf(d)])) })}
                    className={`min-h-8 rounded-full px-3 transition ${same === value ? 'bg-white text-brand-blue shadow-sm' : 'text-text-secondary'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {same || days.length === 1 ? (
            <TimePicker value={common} onChange={setCommon} />
          ) : (
            <ul className="mt-2 space-y-2">
              {days.map((day) => {
                const t = timeOf(day)
                return (
                  <li key={day} className={`rounded-2xl border p-3 ${focusDay === day ? 'border-brand-blue' : 'border-border-light'}`}>
                    <button type="button" onClick={() => setFocusDay(focusDay === day ? null : day)} className="flex w-full items-center gap-3 text-left">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-brand-blue-light text-xs font-bold text-brand-blue">{WEEKDAY_SHORT[day - 1]}</span>
                      <span className="flex-1 text-[15px] font-semibold text-text tabular-nums">
                        {fromMin(t.start)} – {fromMin(t.start + t.duration)}
                      </span>
                      <span className="text-xs font-semibold text-brand-blue">{focusDay === day ? 'Готово' : 'Изменить'}</span>
                    </button>
                    {focusDay === day && <TimePicker value={t} onChange={(patch) => setDay(day, patch)} />}
                  </li>
                )
              })}
            </ul>
          )}

          <label className="mt-4 block text-sm font-semibold text-text">
            Зал
            <span className="relative mt-2 block">
              <IconMapPin size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-muted" />
              <input value={location} onChange={(e) => update({ location: e.target.value })} placeholder="Адрес или название зала" className="input-coach pl-10" />
            </span>
          </label>
        </>
      )}

      {error && <p className="mt-3 rounded-2xl bg-error-bg px-4 py-3 text-sm font-medium text-error">{error}</p>}

      <button type="button" disabled={saving || !groupId || !dirty} onClick={() => void save()} className="btn-coach mt-5 min-h-13 w-full rounded-2xl text-base">
        {saving
          ? 'Сохраняем…'
          : !dirty
            ? days.length
              ? 'Изменений нет'
              : 'Выберите дни недели'
            : days.length
              ? `Сохранить · ${days.length} ${days.length === 1 ? 'тренировка' : days.length < 5 ? 'тренировки' : 'тренировок'} в неделю`
              : 'Убрать группу из расписания'}
      </button>
    </BottomSheet>
  )
}

const ITEM_H = 40
const WHEEL_ROWS = 5

function Wheel({ values, value, onChange, label }: { values: number[]; value: number; onChange: (v: number) => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const index = Math.max(values.indexOf(value), 0)
  const placed = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || Math.abs(el.scrollTop - index * ITEM_H) <= 2) return
    el.scrollTo({ top: index * ITEM_H, behavior: placed.current ? 'smooth' : 'auto' })
    placed.current = true
  }, [index])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const onScroll = () => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const el = ref.current
      if (!el) return
      const next = values[Math.min(values.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM_H)))]
      if (next !== value) onChange(next)
    }, 80)
  }

  const step = (delta: number) => onChange(values[(index + delta + values.length) % values.length])

  return (
    <div className="relative flex-1">
      <span className="pointer-events-none absolute inset-x-0 top-1/2 h-10 -translate-y-1/2 rounded-xl bg-white shadow-sm" aria-hidden />
      <div
        ref={ref}
        role="listbox"
        aria-label={label}
        tabIndex={0}
        onScroll={onScroll}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            step(-1)
          }
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            step(1)
          }
        }}
        className="relative snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-xl outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-brand-blue [&::-webkit-scrollbar]:hidden"
        style={{
          height: ITEM_H * WHEEL_ROWS,
          paddingBlock: ITEM_H * Math.floor(WHEEL_ROWS / 2),
          maskImage: 'linear-gradient(to bottom, transparent, #000 30%, #000 70%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 30%, #000 70%, transparent)',
        }}
      >
        {values.map((v) => (
          <button
            key={v}
            type="button"
            role="option"
            aria-selected={v === value}
            tabIndex={-1}
            onClick={() => onChange(v)}
            className={`flex w-full snap-center items-center justify-center font-display tabular-nums transition-colors ${
              v === value ? 'text-2xl font-bold text-text' : 'text-lg font-semibold text-text-muted'
            }`}
            style={{ height: ITEM_H }}
          >
            {String(v).padStart(2, '0')}
          </button>
        ))}
      </div>
    </div>
  )
}

const HOUR_VALUES = Array.from({ length: 24 }, (_, i) => i)
const MINUTE_VALUES = Array.from({ length: 12 }, (_, i) => i * 5)
const MAX_DURATION = 6 * 60

function TimePicker({ value, onChange }: { value: DayTime; onChange: (patch: Partial<DayTime>) => void }) {
  const [editing, setEditing] = useState<'start' | 'end'>('start')
  const end = (value.start + value.duration) % (24 * 60)
  const target = editing === 'start' ? value.start : end
  const hour = Math.floor(target / 60)
  const minute = target % 60
  const minuteValues = MINUTE_VALUES.includes(minute) ? MINUTE_VALUES : [...MINUTE_VALUES, minute].sort((a, b) => a - b)

  const setTarget = (total: number) => {
    if (editing === 'start') {
      onChange({ start: total })
      return
    }
    const duration = (total - value.start + 24 * 60) % (24 * 60)
    onChange({ duration: Math.min(Math.max(duration, 5), MAX_DURATION) })
  }

  return (
    <div className="mt-2 rounded-3xl bg-surface-muted p-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <TimeTile label="Начало" time={fromMin(value.start)} active={editing === 'start'} onClick={() => setEditing('start')} />
        <span className="flex flex-col items-center text-text-muted">
          <span className="text-lg leading-none font-semibold" aria-hidden>
            →
          </span>
          <span className="mt-1 text-[11px] font-semibold whitespace-nowrap text-text-secondary">{durationLabel(value.duration)}</span>
        </span>
        <TimeTile label="Конец" time={fromMin(end)} active={editing === 'end'} onClick={() => setEditing('end')} />
      </div>

      <p className="mt-3 text-center text-[11px] font-medium text-text-muted">
        {editing === 'start' ? 'Крутите или нажимайте — время начала' : 'Крутите или нажимайте — время окончания'}
      </p>
      <div className="mt-1.5 flex items-center gap-2 px-6">
        <Wheel label="Часы" values={HOUR_VALUES} value={hour} onChange={(h) => setTarget(h * 60 + minute)} />
        <span className="font-display text-2xl font-bold text-text" aria-hidden>
          :
        </span>
        <Wheel label="Минуты" values={minuteValues} value={minute} onChange={(m) => setTarget(hour * 60 + m)} />
      </div>
    </div>
  )
}

function TimeTile({ label, time, active, onClick }: { label: string; time: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border-2 px-3 py-2 text-left transition active:scale-[0.98] ${
        active ? 'border-brand-blue bg-white shadow-[var(--shadow-blue)]' : 'border-transparent bg-white/70'
      }`}
    >
      <span className={`block text-[11px] font-semibold ${active ? 'text-brand-blue' : 'text-text-muted'}`}>{label}</span>
      <span className="block font-display text-2xl leading-tight font-bold text-text tabular-nums">{time}</span>
    </button>
  )
}
