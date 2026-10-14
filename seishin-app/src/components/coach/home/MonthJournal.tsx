import { useEffect, useState } from 'react'
import { coachApi } from '../../../api/coach'
import type { ClassEvent, Payment, SessionAttendance } from '../../../api/types'
import { useCoachIssuedBadges } from '../../../hooks/useCoachIssuedBadges'
import { useStoredState } from '../../../hooks/useStoredState'
import { IconAward, IconCheck, IconChevronDown } from '../../ui/Icons'
import {
  badgesOf,
  classKey,
  initials,
  MARKS_KEY,
  monthLabel,
  PAID_KEY,
  paidKey,
  plural,
  shiftMonth,
  shortDate,
  toIso,
  type LocalMarks,
  type PaidMonths,
} from './helpers'

type Student = { id: number; firstName: string; lastName: string }
type Status = 'PRESENT' | 'ABSENT' | null
type Filter = 'all' | 'unpaid'

function paidDate(value: string) {
  return shortDate(value.includes('T') ? toIso(new Date(value)) : value)
}

function paidDateTime(value: string) {
  if (!value.includes('T')) return shortDate(value)
  const d = new Date(value)
  return `${shortDate(toIso(d))}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function monthRange(month: string) {
  const [y, m] = month.split('-').map(Number)
  return { from: `${month}-01`, to: toIso(new Date(y, m, 0)) }
}

export function MonthJournal({
  groupId,
  initialMonth,
  students,
}: {
  groupId: number
  initialMonth: string
  students: Student[]
}) {
  const [month, setMonth] = useState(initialMonth)
  const [events, setEvents] = useState<ClassEvent[] | null>(null)
  const [sessions, setSessions] = useState<Record<string, SessionAttendance | null>>({})
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<number | null>(null)
  const [unpayFor, setUnpayFor] = useState<number | null>(null)
  const [paid, setPaid] = useStoredState<PaidMonths>(PAID_KEY, {})
  const [localMarks] = useStoredState<LocalMarks>(MARKS_KEY, {})
  const { issued: badges } = useCoachIssuedBadges()
  const currentMonth = toIso(new Date()).slice(0, 7)

  useEffect(() => {
    let alive = true
    const { from, to } = monthRange(month)
    setEvents(null)
    coachApi
      .classes(from, to)
      .then(async (list) => {
        const own = list.filter((e) => e.groupId === groupId).sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
        const loaded = await Promise.all(
          own
            .filter((e) => !e.upcoming)
            .map(async (e) => [classKey(e), await coachApi.getAttendance(e.groupId, e.date, e.startTime).catch(() => null)] as const),
        )
        if (!alive) return
        setSessions(Object.fromEntries(loaded))
        setEvents(own)
      })
      .catch(() => alive && setEvents([]))
    return () => {
      alive = false
    }
  }, [month, groupId])

  const [serverPayments, setServerPayments] = useState<Payment[]>([])
  const [syncError, setSyncError] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    coachApi
      .payments()
      .then((list) => alive && setServerPayments(list))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])

  /** Отметка в журнале синхронизируется с серверным платежом за этот месяц — его видит родитель. */
  const serverPaymentFor = (studentId: number, m: string) =>
    serverPayments.find((p) => p.studentId === studentId && p.dueDate?.slice(0, 7) === m) ?? null

  const serverPaidAt = (studentId: number, m: string) => {
    const p = serverPaymentFor(studentId, m)
    return p?.status === 'PAID' ? (p.paidDate ?? p.dueDate) : null
  }

  const syncServer = (studentId: number, m: string, isPaid: boolean) => {
    void (async () => {
      let p = serverPaymentFor(studentId, m)
      if (!p) {
        try {
          p = await coachApi.ensureMonthlyPayment(studentId, m)
          setServerPayments((list) => (list.some((x) => x.id === p!.id) ? list : [...list, p!]))
        } catch {
          setSyncError('Не удалось создать запись об оплате на сервере — родитель не увидит отметку.')
          return
        }
      }
      const status: Payment['status'] = isPaid ? 'PAID' : p.dueDate < toIso(new Date()) ? 'OVERDUE' : 'PENDING'
      if (p.status === status) return
      coachApi
        .updatePayment(p.id, status, isPaid ? toIso(new Date()) : undefined)
        .then((saved) => {
          setSyncError(null)
          setServerPayments((list) => list.map((x) => (x.id === saved.id ? saved : x)))
        })
        .catch(() => setSyncError('Не удалось передать отметку об оплате на сервер — родитель пока видит старый статус. Отметьте ещё раз позже.'))
    })()
  }

  const statusOf = (event: ClassEvent, studentId: number): Status => {
    const key = classKey(event)
    const local = localMarks[key]?.[studentId]
    if (local) return local
    const session = sessions[key]
    if (!session?.sessionId) return null
    const entry = session.entries.find((e) => e.studentId === studentId)
    if (!entry) return null
    return entry.status === 'ABSENT' ? 'ABSENT' : 'PRESENT'
  }

  const past = (events ?? []).filter((e) => !e.upcoming)
  const rows = [...students]
    .sort((a, b) => a.lastName.localeCompare(b.lastName, 'ru') || a.firstName.localeCompare(b.firstName, 'ru'))
    .map((s) => {
      const marks = past.map((e) => statusOf(e, s.id))
      return {
        student: s,
        present: marks.filter((m) => m === 'PRESENT').length,
        absent: marks.filter((m) => m === 'ABSENT').length,
        paidAt: paid[paidKey(s.id, month)] ?? serverPaidAt(s.id, month),
        badges: badgesOf(badges, s).filter((b) => b.date.startsWith(month)),
      }
    })

  const pastCount = past.length
  const paidCount = rows.filter((r) => r.paidAt).length
  const badgeCount = rows.reduce((sum, r) => sum + r.badges.length, 0)
  const marked = rows.reduce((sum, r) => sum + r.present + r.absent, 0)
  const attendance = marked ? Math.round((rows.reduce((sum, r) => sum + r.present, 0) / marked) * 100) : null
  const visible = filter === 'unpaid' ? rows.filter((r) => !r.paidAt) : rows

  const markPaid = (studentId: number) => {
    setPaid((map) => ({ ...map, [paidKey(studentId, month)]: new Date().toISOString() }))
    syncServer(studentId, month, true)
    setUnpayFor(null)
  }

  const unmarkPaid = (studentId: number) => {
    setPaid((map) => {
      const next = { ...map }
      delete next[paidKey(studentId, month)]
      return next
    })
    syncServer(studentId, month, false)
    setUnpayFor(null)
  }

  const markAllPaid = () => {
    const stamp = new Date().toISOString()
    setPaid((map) => {
      const next = { ...map }
      for (const r of rows) next[paidKey(r.student.id, month)] ??= stamp
      return next
    })
    for (const r of rows) if (!r.paidAt) syncServer(r.student.id, month, true)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-2xl bg-surface-muted p-1">
        <button
          type="button"
          onClick={() => setMonth((m) => shiftMonth(m, -1))}
          aria-label="Предыдущий месяц"
          className="flex size-9 items-center justify-center rounded-xl text-text-secondary transition hover:bg-white active:scale-90"
        >
          <IconChevronDown size={16} className="rotate-90" />
        </button>
        <p className="text-sm font-bold text-text">{monthLabel(month)}</p>
        <button
          type="button"
          onClick={() => setMonth((m) => shiftMonth(m, 1))}
          disabled={month >= currentMonth}
          aria-label="Следующий месяц"
          className="flex size-9 items-center justify-center rounded-xl text-text-secondary transition hover:bg-white active:scale-90 disabled:opacity-30"
        >
          <IconChevronDown size={16} className="-rotate-90" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Summary value={`${paidCount}/${rows.length}`} label="оплатили" tone="text-brand-green" />
        <Summary value={attendance != null ? `${attendance}%` : '—'} label={`посещаемость · ${pastCount} трен.`} tone="text-brand-blue" />
        <Summary value={badgeCount} label={plural(badgeCount, 'значок', 'значка', 'значков')} tone="text-[#d97706]" />
      </div>

      <div className="flex items-center gap-1.5">
        {(
          [
            ['all', `Все · ${rows.length}`],
            ['unpaid', `Не оплатили · ${rows.length - paidCount}`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            aria-pressed={filter === id}
            className={`min-h-8 rounded-full px-3 text-xs font-semibold transition ${filter === id ? 'bg-brand-blue text-white' : 'bg-surface-muted text-text-secondary'}`}
          >
            {label}
          </button>
        ))}
        {rows.length > 0 && paidCount < rows.length && (
          <button type="button" onClick={markAllPaid} className="ml-auto text-xs font-semibold text-brand-green">
            ✓ Все оплатили
          </button>
        )}
      </div>

      {events === null ? (
        <div className="h-40 animate-pulse rounded-2xl bg-surface-muted" />
      ) : rows.length === 0 ? (
        <p className="rounded-2xl bg-surface-muted px-4 py-5 text-center text-sm text-text-secondary">В группе нет учеников</p>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl bg-brand-green-light px-4 py-5 text-center text-sm font-semibold text-brand-green">Все отмечены как оплатившие</p>
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-border-light">
          {visible.map(({ student, present, absent, paidAt, badges: own }) => {
            const name = `${student.lastName} ${student.firstName}`.trim()
            const expanded = open === student.id
            return (
              <li key={student.id} className="border-b border-border-light last:border-b-0">
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <button type="button" onClick={() => setOpen(expanded ? null : student.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={expanded}>
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-blue-light text-xs font-bold text-brand-blue">
                      {initials(`${student.firstName} ${student.lastName}`)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-text">{name}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-1">
                        {past.length === 0 ? (
                          <span className="text-xs text-text-muted">Тренировок ещё не было</span>
                        ) : (
                          past.map((e) => {
                            const s = statusOf(e, student.id)
                            return (
                              <span
                                key={classKey(e)}
                                className={`size-2.5 rounded-full ${s === 'PRESENT' ? 'bg-brand-green' : s === 'ABSENT' ? 'bg-error' : 'border border-border bg-white'}`}
                                title={`${shortDate(e.date)}: ${s === 'PRESENT' ? 'был' : s === 'ABSENT' ? 'не был' : 'не отмечено'}`}
                              />
                            )
                          })
                        )}
                        {past.length > 0 && (
                          <span className="ml-1 text-[11px] text-text-secondary tabular-nums">
                            {present}/{present + absent || past.length}
                          </span>
                        )}
                        {own.length > 0 && (
                          <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-[#fff4e0] px-1.5 text-[10px] font-bold text-[#d97706]">
                            <IconAward size={10} />
                            {own.length}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                  {paidAt ? (
                    <button
                      type="button"
                      onClick={() => setUnpayFor(unpayFor === student.id ? null : student.id)}
                      aria-pressed
                      title="Нажмите, чтобы снять отметку"
                      className="flex min-h-10 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-green px-2.5 leading-tight text-white transition active:scale-95"
                    >
                      <span className="flex items-center gap-1 text-xs font-semibold">
                        <IconCheck size={12} />
                        Оплачено
                      </span>
                      <span className="text-[10px] font-medium text-white/80 tabular-nums">{paidDate(paidAt)}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => markPaid(student.id)}
                      className="inline-flex min-h-10 shrink-0 items-center rounded-xl border border-dashed border-border bg-white px-2.5 text-xs font-semibold text-text-secondary transition hover:border-brand-green/50 hover:text-brand-green active:scale-95"
                    >
                      Отметить оплату
                    </button>
                  )}
                </div>

                {unpayFor === student.id && paidAt && (
                  <div className="pop-in mx-3 mb-2.5 rounded-xl bg-error-bg/70 p-3">
                    <p className="text-xs leading-snug text-text">
                      Оплата отмечена <b>{paidDateTime(paidAt)}</b>. Снять отметку?
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => setUnpayFor(null)} className="min-h-9 flex-1 rounded-lg bg-white text-xs font-semibold text-text shadow-sm transition active:scale-95">
                        Оставить
                      </button>
                      <button type="button" onClick={() => unmarkPaid(student.id)} className="min-h-9 flex-1 rounded-lg bg-error text-xs font-semibold text-white transition active:scale-95">
                        Снять отметку
                      </button>
                    </div>
                  </div>
                )}

                {expanded && (
                  <div className="pop-in space-y-2.5 bg-surface-muted/60 px-3 pt-1 pb-3">
                    {past.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {past.map((e) => {
                          const s = statusOf(e, student.id)
                          return (
                            <span
                              key={classKey(e)}
                              className={`rounded-lg px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                                s === 'PRESENT' ? 'bg-brand-green-light text-brand-green' : s === 'ABSENT' ? 'bg-error-bg text-error' : 'bg-white text-text-muted'
                              }`}
                            >
                              {shortDate(e.date)}
                            </span>
                          )
                        })}
                      </div>
                    )}
                    <p className="text-xs text-text-secondary">
                      {paidAt ? `Оплата отмечена ${paidDateTime(paidAt)}` : `Оплата за ${monthLabel(month).toLowerCase()} не отмечена`}
                    </p>
                    {own.length > 0 && (
                      <ul className="flex flex-wrap gap-1">
                        {own.map((b, i) => (
                          <li key={i} className="inline-flex items-center gap-1 rounded-full bg-[#fff4e0] px-2 py-0.5 text-[11px] font-semibold text-[#b45309]">
                            <IconAward size={11} />
                            {b.name} · {shortDate(b.date)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {syncError && (
        <p role="alert" className="rounded-xl bg-error-bg px-3 py-2 text-xs text-error">
          {syncError}
        </p>
      )}
      <p className="text-[11px] leading-snug text-text-muted">
        Отметка оплаты видна родителю в «Оплате занятий», если за этот месяц у ученика есть счёт клуба; иначе это заметка для вас. Нажмите на ученика, чтобы увидеть даты посещений и значки за месяц.
      </p>
    </div>
  )
}

function Summary({ value, label, tone }: { value: string | number; label: string; tone: string }) {
  return (
    <div className="rounded-2xl bg-surface-muted py-2">
      <p className={`text-lg leading-none font-bold tabular-nums ${tone}`}>{value}</p>
      <p className="mt-1 px-1 text-[11px] leading-tight text-text-secondary">{label}</p>
    </div>
  )
}
