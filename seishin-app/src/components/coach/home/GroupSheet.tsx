import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { coachApi } from '../../../api/coach'
import type { ClassEvent, GroupSummary, ScheduleSlot, SessionAttendance, StudentSummary } from '../../../api/types'
import { useStoredState } from '../../../hooks/useStoredState'
import { useStudentBelts } from '../../../hooks/useStudentBelts'
import { rankLabel, styleLabel } from '../../../utils/beltSystem'
import { slotRange, WEEKDAY_SHORT } from '../../../utils/schedule'
import { BottomSheet } from '../../ui/BottomSheet'
import { IconCalendar, IconChart, IconMapPin, IconPlus, IconSearch, IconUsers, IconX } from '../../ui/Icons'
import {
  ABSENCE_KEY,
  classKey,
  eventRange,
  initials,
  plural,
  presentCount,
  reasonKey,
  shortDate,
  weekdayLong,
  type AbsenceReasons,
} from './helpers'

export type GroupTab = 'stats' | 'members' | 'schedule'

type Tone = { bg: string; fg: string }

export function GroupSheet({
  open,
  group,
  tone,
  initialTab = 'stats',
  members,
  pool,
  groupOf,
  slots,
  pastClasses,
  onClose,
  onAdd,
  onRemove,
  onEditSlot,
  onDelete,
  onOpenTraining,
  onNewStudent,
}: {
  open: boolean
  group: GroupSummary
  tone: Tone
  initialTab?: GroupTab
  members: StudentSummary[]
  pool: StudentSummary[]
  groupOf: Map<number, string>
  slots: ScheduleSlot[]
  pastClasses: ClassEvent[]
  onClose: () => void
  onAdd: (studentId: number) => void
  onRemove: (studentId: number) => void
  onEditSlot: (slot: ScheduleSlot | null) => void
  onDelete: () => void
  onOpenTraining: (event: ClassEvent) => void
  onNewStudent: () => void
}) {
  const [tab, setTab] = useState<GroupTab>(initialTab)
  const titleId = `group-sheet-${group.id}`

  return (
    <BottomSheet open={open} titleId={titleId} onClose={onClose}>
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: tone.bg, color: tone.fg }}>
          <IconUsers size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="truncate font-display text-xl font-bold text-text">
            {group.name}
          </h2>
          <p className="text-xs text-text-secondary">
            {members.length} {plural(members.length, 'ученик', 'ученика', 'учеников')} · {slots.length}{' '}
            {plural(slots.length, 'тренировка', 'тренировки', 'тренировок')} в неделю
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Закрыть" className="flex size-9 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
          <IconX size={16} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 rounded-full bg-surface-subtle p-1" role="tablist">
        {(
          [
            ['stats', 'Статистика', IconChart],
            ['members', 'Состав', IconUsers],
            ['schedule', 'Расписание', IconCalendar],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex min-h-9 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold transition ${
              tab === id ? 'bg-white text-brand-blue shadow-sm' : 'text-text-secondary'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 min-h-[16rem]">
        {tab === 'stats' && <StatsTab members={members} pastClasses={pastClasses} onOpenTraining={onOpenTraining} />}
        {tab === 'members' && (
          <MembersTab group={group} members={members} pool={pool} groupOf={groupOf} onAdd={onAdd} onRemove={onRemove} onNewStudent={onNewStudent} />
        )}
        {tab === 'schedule' && <ScheduleTab slots={slots} onEditSlot={onEditSlot} group={group} onDelete={onDelete} />}
      </div>
    </BottomSheet>
  )
}

function StatsTab({
  members,
  pastClasses,
  onOpenTraining,
}: {
  members: StudentSummary[]
  pastClasses: ClassEvent[]
  onOpenTraining: (event: ClassEvent) => void
}) {
  const recent = useMemo(() => pastClasses.slice(0, 6), [pastClasses])
  const [sessions, setSessions] = useState<Record<string, SessionAttendance | null> | null>(null)
  const [reasons] = useStoredState<AbsenceReasons>(ABSENCE_KEY, {})

  useEffect(() => {
    let alive = true
    Promise.all(
      recent.map(async (event) => [classKey(event), await coachApi.getAttendance(event.groupId, event.date, event.startTime).catch(() => null)] as const),
    ).then((entries) => alive && setSessions(Object.fromEntries(entries)))
    return () => {
      alive = false
    }
  }, [recent])

  if (recent.length === 0) {
    return (
      <div className="rounded-3xl bg-surface-muted px-5 py-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white text-brand-blue">
          <IconChart size={22} />
        </span>
        <p className="mt-3 font-semibold text-text">Статистики пока нет</p>
        <p className="mt-1 text-sm text-text-secondary">Она появится после первой отмеченной тренировки — откройте тренировку на главной и отметьте учеников.</p>
      </div>
    )
  }

  if (!sessions) return <div className="h-48 animate-pulse rounded-3xl bg-surface-muted" />

  const last = recent[0]
  const lastSession = sessions[classKey(last)]
  const lastMarked = Boolean(lastSession?.sessionId)
  const lastTotal = lastSession?.entries.length || members.length
  const lastPresent = presentCount(lastSession)
  const lastPercent = lastTotal ? Math.round((lastPresent / lastTotal) * 100) : 0
  const absentees = lastSession?.entries.filter((e) => e.status === 'ABSENT') ?? []

  const marked = recent.filter((e) => sessions[classKey(e)]?.sessionId)
  const average = marked.length
    ? Math.round(
        marked.reduce((sum, e) => {
          const s = sessions[classKey(e)]!
          return sum + (s.entries.length ? presentCount(s) / s.entries.length : 0)
        }, 0) /
          marked.length *
          100,
      )
    : null

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-border-light p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-text-muted">Прошлая тренировка</p>
            <p className="mt-0.5 font-semibold text-text">
              {weekdayLong(last.date)}, {shortDate(last.date)} · {eventRange(last)}
            </p>
          </div>
          {lastMarked && (
            <p className="shrink-0 text-right text-2xl leading-none font-bold text-text tabular-nums">
              {lastPresent}
              <span className="text-sm font-semibold text-text-muted">/{lastTotal}</span>
            </p>
          )}
        </div>

        {lastMarked ? (
          <>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e7f6ee]">
              <div className="bar-grow h-full rounded-full bg-[#3dae6b]" style={{ width: `${lastPercent}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-text-secondary">
              Посещаемость <span className="font-bold text-[#3dae6b]">{lastPercent}%</span>
            </p>
            {absentees.length > 0 && (
              <div className="mt-3 rounded-2xl bg-error-bg/60 p-3">
                <p className="text-xs font-semibold text-error">Не было · {absentees.length}</p>
                <ul className="mt-1.5 space-y-1">
                  {absentees.map((e) => (
                    <li key={e.studentId} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate text-text">{e.studentName}</span>
                      <span className="shrink-0 text-xs text-text-secondary">{reasons[reasonKey(last, e.studentId)] ?? 'причина не указана'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button type="button" onClick={() => onOpenTraining(last)} className="mt-3 text-sm font-semibold text-brand-blue">
              Открыть тренировку — отметки и значки →
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onOpenTraining(last)}
            className="mt-3 flex w-full items-center justify-between rounded-2xl bg-[#fff8ec] px-3.5 py-3 text-left text-sm"
          >
            <span className="text-text-secondary">Посещаемость не отмечена</span>
            <span className="font-semibold text-[#d97706]">Отметить →</span>
          </button>
        )}
      </section>

      <section className="rounded-3xl border border-border-light p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-text">Последние тренировки</p>
          {average != null && (
            <p className="text-xs text-text-secondary">
              в среднем <span className="font-bold text-text">{average}%</span>
            </p>
          )}
        </div>
        <div className="mt-4 flex h-28 items-end gap-2">
          {[...recent].reverse().map((event) => {
            const s = sessions[classKey(event)]
            const isMarked = Boolean(s?.sessionId)
            const pct = isMarked && s!.entries.length ? Math.round((presentCount(s) / s!.entries.length) * 100) : 0
            return (
              <button
                key={classKey(event)}
                type="button"
                onClick={() => onOpenTraining(event)}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                aria-label={`${shortDate(event.date)}: ${isMarked ? `${pct}%` : 'не отмечена'}`}
              >
                <span className="text-[10px] font-semibold text-text-secondary tabular-nums">{isMarked ? `${pct}%` : '—'}</span>
                <span className="flex w-full flex-1 items-end overflow-hidden rounded-lg bg-surface-muted">
                  <span
                    className={`bar-grow block w-full rounded-lg ${isMarked ? 'bg-brand-blue' : 'bg-transparent'}`}
                    style={{ height: `${Math.max(pct, isMarked ? 6 : 0)}%` }}
                  />
                </span>
                <span className="text-[10px] text-text-muted">{shortDate(event.date)}</span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function MembersTab({
  group,
  members,
  pool,
  groupOf,
  onAdd,
  onRemove,
  onNewStudent,
}: {
  group: GroupSummary
  members: StudentSummary[]
  pool: StudentSummary[]
  groupOf: Map<number, string>
  onAdd: (studentId: number) => void
  onRemove: (studentId: number) => void
  onNewStudent: () => void
}) {
  const [adding, setAdding] = useState(members.length === 0)
  const [query, setQuery] = useState('')
  const { info: beltInfo, systems, systemFor, setGroupSystem } = useStudentBelts()
  const groupSystem = systemFor(group.id)
  const sortedMembers = [...members].sort((a, b) => a.lastName.localeCompare(b.lastName, 'ru'))
  const q = query.trim().toLowerCase()
  const candidates = pool
    .filter((s) => !members.some((m) => m.id === s.id))
    .filter((s) => !q || `${s.firstName} ${s.lastName}`.toLowerCase().includes(q))
    .sort((a, b) => Number(groupOf.has(a.id)) - Number(groupOf.has(b.id)) || a.lastName.localeCompare(b.lastName, 'ru'))

  return (
    <div className="space-y-3">
      {systems.length > 1 && (
        <div className="rounded-2xl bg-surface-muted p-3">
          <p className="text-xs font-semibold text-text-secondary">Система поясов группы</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {systems.map((system) => {
              const on = groupSystem?.id === system.id
              return (
                <button
                  key={system.id}
                  type="button"
                  onClick={() => setGroupSystem(group.id, system.id)}
                  aria-pressed={on}
                  className={`min-h-8 rounded-full px-3 text-xs font-semibold transition active:scale-95 ${
                    on ? 'bg-brand-blue text-white shadow-[var(--shadow-blue)]' : 'bg-white text-text-secondary'
                  }`}
                >
                  {styleLabel(system)}
                </button>
              )
            })}
          </div>
        </div>
      )}
      {sortedMembers.length > 0 && (
        <ul className="overflow-hidden rounded-2xl border border-border-light">
          {sortedMembers.map((s) => {
            const belt = beltInfo(s, group.id)
            return (
            <li key={s.id} className="flex min-h-12 items-center gap-3 border-b border-border-light px-3 last:border-b-0">
              <span className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-blue-light text-[11px] font-bold text-brand-blue">
                {initials(`${s.firstName} ${s.lastName}`)}
                {belt.hex && (
                  <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-white" style={{ backgroundColor: belt.hex }} aria-hidden />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-text">
                  {s.lastName} {s.firstName}
                </span>
                <span className="block text-[11px] text-text-secondary">
                  {s.age} {plural(s.age, 'год', 'года', 'лет')} · {belt.level ? rankLabel(belt.level) : 'без пояса'}
                </span>
              </span>
              <button
                type="button"
                onClick={() => onRemove(s.id)}
                aria-label={`Убрать ${s.firstName} ${s.lastName} из группы`}
                className="flex size-8 items-center justify-center rounded-full text-text-muted transition hover:bg-error-bg hover:text-error active:scale-90"
              >
                <IconX size={14} />
              </button>
            </li>
            )
          })}
        </ul>
      )}

      {adding ? (
        <div className="pop-in rounded-2xl bg-surface-muted p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-text">Добавить в «{group.name}»</p>
            {members.length > 0 && (
              <button type="button" onClick={() => setAdding(false)} className="text-xs font-semibold text-text-secondary">
                Готово
              </button>
            )}
          </div>
          {pool.length > 0 && (
            <span className="relative mt-2 block">
              <IconSearch size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-muted" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск по имени" className="input-coach bg-white pl-10" />
            </span>
          )}
          <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
            {candidates.map((s) => {
              const from = groupOf.get(s.id)
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onAdd(s.id)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-sm transition hover:bg-white active:scale-[0.99]"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-brand-blue">
                      {initials(`${s.firstName} ${s.lastName}`)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-text">
                        {s.lastName} {s.firstName}
                      </span>
                      <span className="block text-xs text-text-secondary">{from ? `Сейчас в «${from}»` : 'Без группы'}</span>
                    </span>
                    <span className="flex size-8 items-center justify-center rounded-full bg-brand-blue text-white">
                      <IconPlus size={14} />
                    </span>
                  </button>
                </li>
              )
            })}
            {candidates.length === 0 && (
              <li className="px-2 py-2 text-sm text-text-secondary">
                {query ? 'Никого не нашли' : pool.length === 0 ? 'В клубе пока нет учеников.' : 'Все ученики клуба уже в этой группе.'}
              </li>
            )}
          </ul>
          <button
            type="button"
            onClick={onNewStudent}
            className="mt-2 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand-blue/40 bg-white text-sm font-semibold text-brand-blue"
          >
            <IconPlus size={14} />
            Новый ученик в клуб
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="btn-coach min-h-11 w-full rounded-2xl">
          <IconPlus size={16} />
          Добавить ученика
        </button>
      )}
      <Link to={`/coach/students?group=${group.id}`} className="block text-center text-sm font-semibold text-brand-blue">
        Карточки учеников в базе →
      </Link>
    </div>
  )
}

function ScheduleTab({
  group,
  slots,
  onEditSlot,
  onDelete,
}: {
  group: GroupSummary
  slots: ScheduleSlot[]
  onEditSlot: (slot: ScheduleSlot | null) => void
  onDelete: () => void
}) {
  const [confirm, setConfirm] = useState(false)
  const sorted = [...slots].sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime))

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {WEEKDAY_SHORT.map((day, i) => {
          const on = slots.some((s) => s.weekday === i + 1)
          return (
            <span
              key={day}
              className={`flex h-9 flex-1 items-center justify-center rounded-xl text-xs font-semibold ${
                on ? 'bg-brand-blue text-white' : 'bg-surface-muted text-text-muted'
              }`}
            >
              {day}
            </span>
          )
        })}
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-2xl bg-surface-muted px-4 py-5 text-center text-sm text-text-secondary">
          У группы нет тренировок в расписании. Выберите дни и время — они появятся на главной и в календаре.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-border-light">
          {sorted.map((slot) => (
            <li key={slot.id}>
              <button
                type="button"
                onClick={() => onEditSlot(slot)}
                className="flex min-h-14 w-full items-center gap-3 border-b border-border-light px-3 text-left transition last:border-b-0 hover:bg-surface-muted"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue-light text-xs font-bold text-brand-blue">
                  {WEEKDAY_SHORT[slot.weekday - 1]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-text tabular-nums">{slotRange(slot)}</span>
                  {slot.location && (
                    <span className="flex items-center gap-1 truncate text-xs text-text-secondary">
                      <IconMapPin size={12} />
                      {slot.location}
                    </span>
                  )}
                </span>
                <span className="text-xs font-semibold text-brand-blue">Изменить</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button type="button" onClick={() => onEditSlot(null)} className="btn-coach min-h-11 w-full rounded-2xl">
        <IconPlus size={16} />
        {sorted.length ? 'Добавить день' : 'Поставить в расписание'}
      </button>

      {!group.assistantAccess &&
        (confirm ? (
          <div className="pop-in rounded-2xl bg-error-bg p-3">
            <p className="text-sm font-semibold text-error">Удалить группу «{group.name}»?</p>
            <p className="mt-0.5 text-xs text-text-secondary">Группа скроется только у вас: ученики останутся в клубе, а родители пока продолжат видеть её тренировки. Чтобы родители не ждали занятий, сначала уберите группу из расписания.</p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => setConfirm(false)} className="btn-secondary min-h-10 flex-1 rounded-xl bg-white">
                Отмена
              </button>
              <button type="button" onClick={onDelete} className="min-h-10 flex-1 rounded-xl bg-error font-semibold text-white transition active:scale-[0.98]">
                Удалить
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirm(true)} className="block w-full pt-2 text-center text-sm font-semibold text-error">
            Удалить группу
          </button>
        ))}
    </div>
  )
}
