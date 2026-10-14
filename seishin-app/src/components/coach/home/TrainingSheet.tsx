import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { coachApi } from '../../../api/coach'
import { ApiError } from '../../../api/client'
import type { AttendanceStatus, BadgeDefinition, ClassEvent, SessionAttendance, StudentSummary } from '../../../api/types'
import { useCoachIssuedBadges } from '../../../hooks/useCoachIssuedBadges'
import { useStoredState } from '../../../hooks/useStoredState'
import { useStudentBelts } from '../../../hooks/useStudentBelts'
import { badgeEventNote, resolveBadgeId } from '../../../utils/coachSync'
import { IconAward, IconBell, IconCalendar, IconCheck, IconPlus, IconUsers, IconX } from '../../ui/Icons'
import { studentTag } from '../../../utils/beltSystem'
import { BadgeToken } from '../../ui/BadgeToken'
import { MonthJournal } from './MonthJournal'
import { TrainingTopic } from './TrainingTopic'
import {
  ABSENCE_KEY,
  ABSENCE_REASONS,
  badgesOf,
  PRESET_BADGES,
  withPresetBadges,
  classKey,
  eventRange,
  initials,
  MARKS_KEY,
  minutesUntil,
  plural,
  reasonKey,
  untilLabel,
  weekdayLong,
  shortDate,
  type AbsenceReasons,
  type IssuedBadge,
  type LocalMarks,
} from './helpers'
import type { TrainingTab } from './TrainingsBoard'

const EXIT_MS = 260

type Tab = TrainingTab
type SaveState = 'idle' | 'saving' | 'saved' | 'error'
type Mark = 'PRESENT' | 'ABSENT'
type Intent = 'PENDING' | 'CONFIRMED' | 'DECLINED' | null | undefined

type Row = {
  id: number
  firstName: string
  lastName: string
  age: number | null
  beltColor: string | null
  intent: Intent
}

function splitName(full: string) {
  const [first = '', ...rest] = full.split(' ')
  return { firstName: first, lastName: rest.join(' ') }
}

function intentLabel(intent: Intent) {
  if (intent === 'CONFIRMED') return { text: 'Будет', cls: 'bg-brand-green-light text-brand-green' }
  if (intent === 'DECLINED') return { text: 'Не будет', cls: 'bg-error-bg text-error' }
  return null
}

export function TrainingSheet({
  event,
  members,
  initialTab = 'marks',
  onClose,
  onSaved,
}: {
  event: ClassEvent
  members: StudentSummary[]
  initialTab?: Tab
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const now = useMemo(() => new Date(), [])
  const started = !event.upcoming
  const [tab, setTab] = useState<Tab>(initialTab)
  const [badgeDefs, setBadgeDefs] = useState<BadgeDefinition[]>(PRESET_BADGES)
  const { issued: issuedLog, refresh: refreshBadges } = useCoachIssuedBadges()
  const [awardFor, setAwardFor] = useState<number | null>(null)
  const [issuing, setIssuing] = useState<string | null>(null)
  const [localMarks, setLocalMarks] = useStoredState<LocalMarks>(MARKS_KEY, {})
  const [session, setSession] = useState<SessionAttendance | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [marks, setMarks] = useState<Record<number, Mark>>({})
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [reasons, setReasons] = useStoredState<AbsenceReasons>(ABSENCE_KEY, {})
  const [reasonFor, setReasonFor] = useState<number | null>(null)
  const pending = useRef<Record<number, Mark> | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const savedAny = useRef(false)
  const summary = useRef({ present: 0, total: 0 })

  useEffect(() => {
    let alive = true
    coachApi
      .getAttendance(event.groupId, event.date, event.startTime)
      .then((data) => {
        if (!alive) return
        setSession(data)
        const initial: Record<number, Mark> = {}
        if (data.sessionId) {
          for (const entry of data.entries) initial[entry.studentId] = entry.status === 'ABSENT' ? 'ABSENT' : 'PRESENT'
        }
        setMarks({ ...initial, ...localMarks[classKey(event)] })
      })
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : 'Не удалось загрузить список'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [event])

  useEffect(() => {
    let alive = true
    coachApi
      .badges()
      .then((list) => alive && setBadgeDefs(withPresetBadges(list.filter((b) => !b.cumulative))))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])

  const eventKey = classKey(event)
  const awardsHere = (row: Row) => badgesOf(issuedLog, row).filter((b) => b.eventKey === eventKey)

  const toggleAward = async (row: Row, badge: BadgeDefinition) => {
    const tag = studentTag(row)
    setIssuing(`${row.id}:${badge.id}`)
    setError(null)
    try {
      const serverBadgeId = await resolveBadgeId(badge, badgeDefs)
      const isMine = (b: IssuedBadge) =>
        b.studentId === row.id && b.badgeId === serverBadgeId && b.eventKey === eventKey && (!b.who || b.who === tag)
      if (issuedLog.some(isMine)) {
        setError(`«${badge.name}» уже выдан — отозвать значок у родителей пока нельзя`)
        return
      }
      await coachApi.issueBadge(row.id, serverBadgeId, badgeEventNote(eventKey))
      await refreshBadges()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Не удалось выдать значок')
    } finally {
      setIssuing(null)
    }
  }

  const persist = useCallback(
    async (next: Record<number, Mark>) => {
      const entries = Object.entries(next).map(([id, status]) => ({
        studentId: Number(id),
        status: status as AttendanceStatus,
        absenceReason:
          status === 'ABSENT' ? reasons[reasonKey(event, Number(id))] ?? null : null,
      }))
      if (entries.length === 0) return
      setSaveState('saving')
      setError(null)
      try {
        await coachApi.markAttendance({ groupId: event.groupId, sessionDate: event.date, startTime: event.startTime, entries })
        setSession((s) => (s ? { ...s, sessionId: s.sessionId ?? -1 } : s))
        savedAny.current = true
        setSaveState('saved')
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Не удалось сохранить отметки')
        setSaveState('error')
      }
    },
    [event, reasons],
  )

  const queueSave = (next: Record<number, Mark>) => {
    setLocalMarks((map) => ({ ...map, [classKey(event)]: next }))
    pending.current = next
    setSaveState('saving')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const value = pending.current
      pending.current = null
      if (value) void persist(value)
    }, 500)
  }

  const [closing, setClosing] = useState(false)
  const close = useCallback(() => {
    window.clearTimeout(timer.current)
    const value = pending.current
    pending.current = null
    const flush = value ? persist(value) : Promise.resolve()
    void flush.then(() => {
      if (savedAny.current) onSaved(`Посещаемость сохранена: ${summary.current.present} из ${summary.current.total}`)
    })
    setClosing(true)
    window.setTimeout(onClose, EXIT_MS)
  }, [onClose, onSaved, persist])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', onKey)
    }
  }, [close])

  const { info: beltInfo } = useStudentBelts()
  const rows = useMemo<Row[]>(() => {
    const intents = new Map(session?.entries.map((e) => [e.studentId, e.parentIntent]) ?? [])
    const list: Row[] =
      members.length > 0
        ? members.map((s) => ({
            id: s.id,
            firstName: s.firstName,
            lastName: s.lastName,
            age: s.age,
            beltColor: beltInfo(s, event.groupId).hex,
            intent: intents.get(s.id),
          }))
        : (session?.entries ?? []).map((e) => ({
            id: e.studentId,
            ...splitName(e.studentName),
            age: null,
            beltColor: null,
            intent: e.parentIntent,
          }))
    return list.sort((a, b) => a.lastName.localeCompare(b.lastName, 'ru') || a.firstName.localeCompare(b.firstName, 'ru'))
  }, [members, session, beltInfo, event.groupId])

  const present = rows.filter((r) => marks[r.id] === 'PRESENT')
  const absent = rows.filter((r) => marks[r.id] === 'ABSENT')
  const unmarked = rows.length - present.length - absent.length
  const confirmed = rows.filter((r) => r.intent === 'CONFIRMED').length
  const declined = rows.filter((r) => r.intent === 'DECLINED').length
  const minutes = minutesUntil(event, now)
  summary.current = { present: present.length, total: rows.length }

  const setMark = (id: number, mark: Mark) => {
    if (marks[id] === mark) return
    const next = { ...marks, [id]: mark }
    setMarks(next)
    queueSave(next)
    setReasonFor(mark === 'ABSENT' ? id : null)
  }

  const markRest = () => {
    const next: Record<number, Mark> = { ...marks }
    for (const r of rows) if (!next[r.id]) next[r.id] = 'PRESENT'
    setMarks(next)
    queueSave(next)
    setReasonFor(null)
  }

  const setReason = (id: number, reason: string) => {
    const key = reasonKey(event, id)
    setReasons((map) => {
      const next = { ...map }
      if (next[key] === reason) delete next[key]
      else next[key] = reason
      return next
    })
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'marks', label: started ? 'Отметки' : 'Ученики' },
    { id: 'month', label: 'Оплата' },
    { id: 'parents', label: 'Родителям' },
  ]

  const status = started ? (minutes > -120 && event.today ? 'Идёт' : 'Прошла') : untilLabel(minutes)
  const done = present.length + absent.length

  return createPortal(
    <div className={`fixed inset-0 z-[75] flex items-end justify-center ${closing ? 'sheet-closing' : 'sheet-opening'}`}>
      <div className="sheet-backdrop absolute inset-0 bg-white/30 backdrop-blur-md" onClick={close} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="training-title"
        className="sheet-panel relative flex h-[92svh] w-full max-w-md flex-col overflow-hidden rounded-t-[2rem] border border-border-light bg-white shadow-[0_-12px_40px_rgb(15_23_42_/_0.12)] sm:mb-6 sm:h-[86svh] sm:rounded-[2rem]"
      >
        <header className="shrink-0 px-5 pt-3 pb-4">
          <span aria-hidden className="mx-auto mb-3 block h-1 w-10 rounded-full bg-surface-subtle" />
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 id="training-title" className="truncate font-display text-xl leading-tight font-bold text-text">
                {event.groupName}
              </h2>
              <p className="mt-1 flex items-center gap-2 text-[13px] text-text-secondary">
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    started ? 'bg-brand-green-light text-brand-green' : 'bg-brand-blue-light text-brand-blue'
                  }`}
                >
                  <span className={`size-1.5 rounded-full ${started ? 'bg-brand-green' : 'bg-brand-blue'}`} aria-hidden />
                  {status}
                </span>
                <span className="truncate">
                  {event.today ? 'Сегодня' : `${weekdayLong(event.date)}, ${shortDate(event.date)}`} · {eventRange(event)}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Закрыть"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-secondary transition active:scale-90"
            >
              <IconX size={16} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 rounded-full bg-surface-subtle p-1" role="tablist">
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`min-h-9 rounded-full px-1 text-[13px] font-semibold transition ${
                  tab === id ? 'bg-white text-brand-blue shadow-sm' : 'text-text-secondary hover:text-text'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto border-t border-border-light px-5 pt-4 pb-6">
          {loading ? (
            <ul className="space-y-2" aria-busy>
              {[0, 1, 2].map((i) => (
                <li key={i} className="h-14 animate-pulse rounded-2xl bg-surface-muted" />
              ))}
            </ul>
          ) : tab === 'marks' ? (
            rows.length === 0 ? (
              <div className="rounded-3xl bg-surface-muted px-5 py-8 text-center">
                <p className="font-semibold text-text">В группе нет учеников</p>
                <p className="mt-1 text-sm text-text-secondary">Добавьте их в карточке группы → «Состав».</p>
              </div>
            ) : (
              <>
                {started ? (
                  <section className="rounded-3xl bg-surface-muted p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm text-text-secondary">
                        Отмечено <span className="text-lg font-bold text-text tabular-nums">{done}</span>
                        <span className="font-semibold text-text-muted tabular-nums"> из {rows.length}</span>
                      </p>
                      <SaveStatus state={saveState} onRetry={() => void persist(marks)} />
                    </div>
                    <div className="mt-2.5 flex h-2 gap-0.5 overflow-hidden rounded-full bg-white">
                      {present.length > 0 && <span className="bg-brand-green transition-all duration-500" style={{ flexGrow: present.length }} />}
                      {absent.length > 0 && <span className="bg-error transition-all duration-500" style={{ flexGrow: absent.length }} />}
                      {unmarked > 0 && <span className="bg-transparent" style={{ flexGrow: unmarked }} />}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-brand-green" aria-hidden />
                        Был · <b className="text-text tabular-nums">{present.length}</b>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-error" aria-hidden />
                        Не был · <b className="text-text tabular-nums">{absent.length}</b>
                      </span>
                      {unmarked > 0 && (
                        <span className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full border border-border bg-white" aria-hidden />
                          Не отмечены · <b className="text-text tabular-nums">{unmarked}</b>
                        </span>
                      )}
                    </div>
                    {unmarked > 0 && (
                      <button
                        type="button"
                        onClick={markRest}
                        className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-semibold text-brand-green shadow-sm transition active:scale-[0.98]"
                      >
                        <IconCheck size={16} />
                        {done > 0 ? `Остальные ${unmarked} пришли` : 'Все пришли'}
                      </button>
                    )}
                  </section>
                ) : (
                  <section className="rounded-3xl bg-brand-blue-light/60 p-4">
                    <p className="text-sm font-semibold text-brand-blue">Отметки откроются в {eventRange(event).slice(0, 5)}</p>
                    <p className="mt-0.5 text-[13px] text-text-secondary">Пока видно, что ответили родители.</p>
                    <div className="mt-3 flex gap-4 text-xs text-text-secondary">
                      <span>
                        Будут · <b className="text-brand-green tabular-nums">{confirmed}</b>
                      </span>
                      <span>
                        Не будут · <b className="text-error tabular-nums">{declined}</b>
                      </span>
                      <span>
                        Не ответили · <b className="text-text tabular-nums">{rows.length - confirmed - declined}</b>
                      </span>
                    </div>
                  </section>
                )}

                {!started && (
                  <TrainingTopic groupId={event.groupId} sessionDate={event.date} startTime={event.startTime} planned />
                )}

                {started && done === 0 && (
                  <p className="mt-4 text-center text-xs text-text-muted">Нажмите «Был» или «Не был» напротив ученика — отметки сохраняются сразу</p>
                )}

                <ul className="mt-3 space-y-1.5">
                  {rows.map((row) => {
                    const mark = marks[row.id]
                    const reason = reasons[reasonKey(event, row.id)]
                    const intent = intentLabel(row.intent)
                    const showReasons = mark === 'ABSENT' && reasonFor === row.id
                    const showAwards = mark === 'PRESENT' && awardFor === row.id
                    const awarded = mark === 'PRESENT' ? awardsHere(row) : []
                    return (
                      <li
                        key={row.id}
                        className={`rounded-2xl border px-3 py-2.5 transition-colors ${
                          mark === 'PRESENT'
                            ? 'border-brand-green/25 bg-brand-green-light/40'
                            : mark === 'ABSENT'
                              ? 'border-error/20 bg-error-bg/50'
                              : 'border-border-light bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-blue-light text-xs font-bold text-brand-blue">
                            {initials(`${row.firstName} ${row.lastName}`)}
                            {row.beltColor && (
                              <span
                                className="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-2 border-white"
                                style={{ backgroundColor: row.beltColor }}
                                aria-hidden
                              />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-semibold text-text">
                              {row.lastName} {row.firstName}
                            </p>
                            <p className="flex flex-wrap items-center gap-1.5 text-xs text-text-secondary">
                              {row.age != null && <span>{row.age} {plural(row.age, 'год', 'года', 'лет')}</span>}
                              {intent && <span className={`rounded-full px-1.5 py-px text-[10px] font-bold ${intent.cls}`}>{intent.text}</span>}
                              {mark === 'ABSENT' && !showReasons && (
                                <button
                                  type="button"
                                  onClick={() => setReasonFor(row.id)}
                                  className={`font-semibold underline-offset-2 hover:underline ${reason ? 'text-error' : 'text-text-muted'}`}
                                >
                                  {reason ?? '+ причина'}
                                </button>
                              )}
                              {mark === 'PRESENT' &&
                                awarded.length > 0 && (
                                  <span className="inline-flex items-center -space-x-1" title={awarded.map((b) => b.name).join(', ')}>
                                    {awarded.map((b, i) => (
                                      <BadgeToken key={`${b.badgeId}-${i}`} name={b.name} size="xs" className="rounded-full ring-2 ring-white" />
                                    ))}
                                  </span>
                                )}
                              {mark === 'PRESENT' && badgeDefs.length > 0 && !showAwards && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAwardFor(row.id)
                                    setReasonFor(null)
                                  }}
                                  className="inline-flex items-center gap-0.5 rounded-full bg-[#fef3c7] px-2 py-0.5 text-[11px] font-bold text-[#b45309] transition active:scale-95"
                                >
                                  <IconAward size={11} />
                                  {awarded.length > 0 ? 'ещё' : 'значок'}
                                </button>
                              )}
                            </p>
                          </div>
                          {started && (
                            <div className="flex shrink-0 rounded-full bg-surface-subtle p-0.5" role="radiogroup" aria-label={`${row.firstName}: посещение`}>
                              <button
                                type="button"
                                role="radio"
                                aria-checked={mark === 'PRESENT'}
                                onClick={() => setMark(row.id, 'PRESENT')}
                                className={`flex min-h-9 items-center gap-1 rounded-full px-3 text-[13px] font-semibold transition active:scale-95 ${
                                  mark === 'PRESENT' ? 'bg-brand-green text-white shadow-sm' : 'text-text-secondary hover:text-text'
                                }`}
                              >
                                {mark === 'PRESENT' && <IconCheck size={13} />}
                                Был
                              </button>
                              <button
                                type="button"
                                role="radio"
                                aria-checked={mark === 'ABSENT'}
                                onClick={() => setMark(row.id, 'ABSENT')}
                                className={`flex min-h-9 items-center rounded-full px-3 text-[13px] font-semibold transition active:scale-95 ${
                                  mark === 'ABSENT' ? 'bg-error text-white shadow-sm' : 'text-text-secondary hover:text-text'
                                }`}
                              >
                                Не был
                              </button>
                            </div>
                          )}
                        </div>
                        {showReasons && (
                          <div className="pop-in mt-2.5 border-t border-error/10 pt-2.5">
                            <p className="mb-1.5 text-[11px] font-medium text-text-muted">Причина (необязательно)</p>
                            <div className="flex flex-wrap gap-1.5">
                              {ABSENCE_REASONS.map((r) => (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => {
                                    setReason(row.id, r)
                                    setReasonFor(null)
                                  }}
                                  className={`min-h-8 rounded-full px-3 text-xs font-semibold transition active:scale-95 ${
                                    reason === r ? 'bg-error text-white' : 'bg-white text-error'
                                  }`}
                                >
                                  {r}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {showAwards && (
                          <div className="pop-in mt-2.5 border-t border-[#f59e0b]/20 pt-2.5">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <p className="text-[11px] font-medium text-text-muted">Награды за эту тренировку · нажмите ещё раз, чтобы убрать</p>
                              <button
                                type="button"
                                onClick={() => setAwardFor(null)}
                                className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-text shadow-sm transition active:scale-95"
                              >
                                Готово
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                              {badgeDefs.map((b) => {
                                const busy = issuing === `${row.id}:${b.id}`
                                const given = awarded.some((a) => a.badgeId === b.id)
                                return (
                                  <button
                                    key={b.id}
                                    type="button"
                                    disabled={issuing != null}
                                    onClick={() => void toggleAward(row, b)}
                                    title={b.description || undefined}
                                    aria-pressed={given}
                                    className={`relative flex flex-col items-center rounded-2xl px-1.5 pt-2.5 pb-2 transition active:scale-95 disabled:opacity-60 ${
                                      given ? 'bg-[#fffbeb] ring-2 ring-[#f59e0b]' : 'bg-white shadow-sm'
                                    }`}
                                  >
                                    {given && (
                                      <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-[#f59e0b] text-white">
                                        <IconCheck size={10} />
                                      </span>
                                    )}
                                    <BadgeToken name={b.name} size="sm" className={busy ? 'animate-pulse' : ''} />
                                    <span className="mt-1.5 line-clamp-1 text-[11px] font-semibold text-text">{busy ? 'Выдаю…' : b.name}</span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>

                {started && (
                  <TrainingTopic groupId={event.groupId} sessionDate={event.date} startTime={event.startTime} planned={false} />
                )}

                {started && done > 0 && badgeDefs.length > 0 && (
                  <p className="mt-3 flex items-start gap-1.5 rounded-2xl bg-[#fffbeb] px-3 py-2.5 text-xs leading-relaxed text-[#92400e]">
                    <IconAward size={14} className="mt-0.5 shrink-0" />
                    <span>
                      После тренировки отметьте лучших: нажмите «значок» у ученика. Значок появится в его карточке в базе.
                      Значки клуба сразу видят родители, базовые значки пока видите только вы.
                    </span>
                  </p>
                )}
              </>
            )
          ) : tab === 'parents' ? (
            <ParentsTab event={event} rows={rows} marks={marks} started={started} />
          ) : (
            <MonthJournal groupId={event.groupId} initialMonth={event.date.slice(0, 7)} students={rows} />
          )}
          {error && <p className="alert-error mt-3">{error}</p>}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function SaveStatus({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  if (state === 'saving') return <span className="text-xs font-medium text-text-muted">Сохраняем…</span>
  if (state === 'saved')
    return (
      <span className="pop-in flex items-center gap-1 text-xs font-semibold text-brand-green">
        <IconCheck size={13} />
        Сохранено
      </span>
    )
  if (state === 'error')
    return (
      <button type="button" onClick={onRetry} className="text-xs font-semibold text-error">
        Не сохранилось · повторить
      </button>
    )
  return null
}

type Audience = 'all' | 'present' | 'absent' | 'silent'

type Scenario = { id: string; title: string; text: string; audience: Audience; icon: typeof IconBell }

const SCENARIOS_BEFORE: Scenario[] = [
  { id: 'remind', title: 'Напомнить о тренировке', text: 'Напоминаем: сегодня тренировка в {time}. Ждём!', audience: 'all', icon: IconBell },
  { id: 'ask', title: 'Попросить ответить', text: 'Пожалуйста, отметьте в приложении, будет ли ребёнок на тренировке в {time}.', audience: 'silent', icon: IconUsers },
  { id: 'soon', title: 'Скоро начало', text: 'Тренировка начнётся через 15 минут.', audience: 'all', icon: IconBell },
  { id: 'move', title: 'Перенос', text: 'Тренировка сегодня переносится. Подробности — в чате.', audience: 'all', icon: IconCalendar },
  { id: 'cancel', title: 'Отмена', text: 'Тренировка сегодня отменена.', audience: 'all', icon: IconX },
]

const SCENARIOS_AFTER: Scenario[] = [
  { id: 'pickup', title: 'Можно забирать', text: 'Тренировка закончилась — можно забирать ребёнка.', audience: 'all', icon: IconBell },
  { id: 'great', title: 'Похвалить', text: 'Сегодня отличная работа на тренировке! Спасибо.', audience: 'present', icon: IconAward },
  { id: 'missed', title: 'Мы скучали', text: 'Мы скучали по вам сегодня. Ждём на следующей тренировке!', audience: 'absent', icon: IconUsers },
]

const AUDIENCE_LABEL: Record<Audience, string> = {
  all: 'Всей группе',
  present: 'Кто был',
  absent: 'Кого не было',
  silent: 'Не ответили',
}

function ParentsTab({ event, rows, marks, started }: { event: ClassEvent; rows: Row[]; marks: Record<number, Mark>; started: boolean }) {
  const time = eventRange(event).slice(0, 5)
  const scenarios = (started ? SCENARIOS_AFTER : SCENARIOS_BEFORE).map((s) => ({ ...s, text: s.text.replace('{time}', time) }))
  const [openId, setOpenId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [audience, setAudience] = useState<Audience>('all')

  const recipients: Record<Audience, number> = {
    all: rows.length,
    present: rows.filter((r) => marks[r.id] === 'PRESENT').length,
    absent: rows.filter((r) => marks[r.id] === 'ABSENT').length,
    silent: rows.filter((r) => r.intent !== 'CONFIRMED' && r.intent !== 'DECLINED').length,
  }
  const audiences: Audience[] = started ? ['all', 'present', 'absent'] : ['all', 'silent']
  const parents = (n: number) => `${n} ${plural(n, 'родителю', 'родителям', 'родителям')}`

  const open = (id: string, initialText: string, initialAudience: Audience) => {
    if (openId === id) {
      setOpenId(null)
      return
    }
    setOpenId(id)
    setText(initialText)
    setAudience(initialAudience)
  }

  const editor = (
    <div className="pop-in space-y-3 border-t border-border-light px-3.5 pt-3 pb-3.5">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        autoFocus={openId === 'custom'}
        aria-label="Текст сообщения"
        placeholder="Напишите сообщение родителям"
        className="block w-full resize-none rounded-xl border border-border-light bg-white px-3 py-2.5 text-[15px] leading-snug text-text outline-none placeholder:text-text-muted focus:border-brand-blue"
      />
      <div>
        <p className="mb-1.5 text-xs font-medium text-text-secondary">Кому</p>
        <div className="flex flex-wrap gap-1.5">
          {audiences.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAudience(a)}
              aria-pressed={audience === a}
              disabled={recipients[a] === 0}
              className={`min-h-8 rounded-full px-3 text-xs font-semibold transition active:scale-95 disabled:opacity-40 ${
                audience === a ? 'bg-brand-blue text-white' : 'bg-white text-text-secondary ring-1 ring-border-light'
              }`}
            >
              {AUDIENCE_LABEL[a]} · {recipients[a]}
            </button>
          ))}
        </div>
      </div>
      <button type="button" disabled className="btn-coach min-h-11 w-full rounded-xl">
        <IconBell size={15} />
        Отправить {parents(recipients[audience])} · скоро
      </button>
    </div>
  )

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 rounded-full bg-brand-blue-light/70 px-3.5 py-2 text-xs font-medium text-brand-blue">
        <IconBell size={14} />
        Отправка пуш-уведомлений появится скоро — сейчас можно посмотреть, как это будет
      </p>

      <p className="pt-1 text-sm font-semibold text-text">{started ? 'После тренировки' : 'До тренировки'}</p>
      <ul className="space-y-2">
        {scenarios.map((s) => {
          const isOpen = openId === s.id
          const count = recipients[s.audience]
          const Icon = s.icon
          return (
            <li key={s.id} className={`overflow-hidden rounded-2xl border transition ${isOpen ? 'border-brand-blue/40 shadow-[var(--shadow-card)]' : 'border-border-light'}`}>
              <button
                type="button"
                onClick={() => open(s.id, s.text, s.audience)}
                aria-expanded={isOpen}
                disabled={count === 0}
                className="flex w-full items-start gap-3 px-3.5 py-3 text-left transition enabled:hover:bg-surface-muted disabled:opacity-50"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-blue-light text-brand-blue">
                  <Icon size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-text">{s.title}</span>
                    <span className="shrink-0 text-[11px] font-semibold text-text-muted">
                      {AUDIENCE_LABEL[s.audience]} · {count}
                    </span>
                  </span>
                  {!isOpen && <span className="mt-0.5 line-clamp-1 block text-xs text-text-secondary">{s.text}</span>}
                </span>
              </button>
              {isOpen && editor}
            </li>
          )
        })}
        <li className={`overflow-hidden rounded-2xl border transition ${openId === 'custom' ? 'border-brand-blue/40 shadow-[var(--shadow-card)]' : 'border-dashed border-brand-blue/40'}`}>
          <button
            type="button"
            onClick={() => open('custom', '', 'all')}
            aria-expanded={openId === 'custom'}
            className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition hover:bg-brand-blue-light/40"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-blue ring-1 ring-brand-blue/30">
              <IconPlus size={17} />
            </span>
            <span className="text-sm font-semibold text-brand-blue">Своё сообщение</span>
          </button>
          {openId === 'custom' && editor}
        </li>
      </ul>
    </div>
  )
}
