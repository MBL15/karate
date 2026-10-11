import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parentApi } from '../api/parent'
import type { StudentSummary, UpcomingCompetition } from '../api/types'
import { ChildAvatar } from '../components/parent/ChildAvatar'
import { ApiError } from '../api/client'
import { ParentHero } from '../components/parent/ParentHero'
import { ParentPageShell } from '../components/parent/ParentPageShell'
import { ParentError, ParentLoading } from '../components/parent/ParentScreenState'
import { ParentEmptyHint } from '../components/parent/ParentEmptyHint'
import { EmptyState } from '../components/ui/EmptyState'
import { IconCalendar, IconChevronDown } from '../components/ui/Icons'
import { useParentChild } from '../context/ParentChildContext'
import { useStoredState } from '../hooks/useStoredState'
import { daysUntil, monthTitle, whenLabel } from '../utils/events'
import { formatDate } from '../utils/format'

type Rsvp = UpcomingCompetition['rsvpStatus']

/** Сервер отдаёт родителю только будущие события с ответом; прошедшие — без участия. Помним ответ на устройстве. */
const RSVP_CACHE_KEY = 'competition-rsvp'
type RsvpCache = Record<string, { name: string; eventDate: string; status: Rsvp }>

type PastRow = { competitionId: number; name: string; eventDate: string; entries: { child: StudentSummary; status: Rsvp | null }[] }

const PAST_UI: Record<Rsvp | 'UNKNOWN', { label: string; className: string }> = {
  CONFIRMED: { label: 'Участвовали', className: 'bg-brand-green-light text-brand-green' },
  DECLINED: { label: 'Не участвовали', className: 'bg-surface-muted text-text-secondary' },
  PENDING: { label: 'Без ответа', className: 'bg-surface-muted text-text-muted' },
  UNKNOWN: { label: 'Нет данных', className: 'bg-surface-muted text-text-muted' },
}

function PastList({ rows, several }: { rows: PastRow[]; several: boolean }) {
  const all = rows.flatMap((r) => r.entries)
  const went = all.filter((e) => e.status === 'CONFIRMED').length
  const skipped = all.filter((e) => e.status === 'DECLINED').length

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<IconCalendar size={32} className="text-text-muted" />}
        title="Прошедших мероприятий пока нет"
        description="После турнира он переместится сюда — с отметкой об участии, а позже и с местом"
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="card grid grid-cols-3 gap-2 p-4 text-center">
        {[
          { value: rows.length, label: 'прошло' },
          { value: went, label: 'участие' },
          { value: skipped, label: 'пропущено' },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-2xl font-extrabold text-text">{s.value}</p>
            <p className="text-[11px] text-text-secondary">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="px-1 text-xs leading-relaxed text-text-secondary">
        Места и категории появятся здесь и в «Спортсмене», когда тренер внесёт итоги соревнований.
      </p>
      {rows.map((row, index) => {
        const date = new Date(`${row.eventDate}T12:00:00`)
        const newMonth = index === 0 || rows[index - 1].eventDate.slice(0, 7) !== row.eventDate.slice(0, 7)
        return (
          <div key={row.competitionId}>
            {newMonth && (
              <h2 className={`mb-2 px-1 text-xs font-bold uppercase tracking-wider text-text-muted ${index === 0 ? 'mt-1' : 'mt-5'}`}>
                {monthTitle(row.eventDate)}
              </h2>
            )}
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-surface-muted leading-none text-text-secondary">
                  <span className="text-lg font-extrabold">{date.getDate()}</span>
                  <span className="mt-0.5 text-[10px] font-semibold">{date.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '')}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-text">{row.name}</span>
                  <span className="mt-0.5 block text-xs text-text-secondary">{formatDate(row.eventDate)}</span>
                </span>
                {!several && row.entries[0] && (
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${PAST_UI[row.entries[0].status ?? 'UNKNOWN'].className}`}>
                    {PAST_UI[row.entries[0].status ?? 'UNKNOWN'].label}
                  </span>
                )}
              </div>
              {several && (
                <ul className="mt-3 space-y-2 border-t border-border-light pt-3">
                  {row.entries.map(({ child, status }) => (
                    <li key={child.id} className="flex items-center gap-2.5">
                      <ChildAvatar childId={child.id} name={`${child.firstName} ${child.lastName}`} size={28} />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text">{child.firstName}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${PAST_UI[status ?? 'UNKNOWN'].className}`}>
                        {PAST_UI[status ?? 'UNKNOWN'].label}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {row.entries.some((e) => e.status === 'CONFIRMED') && (
                <p className="mt-3 rounded-xl bg-surface-muted px-3 py-2 text-xs text-text-secondary">
                  Результат: тренер ещё не внёс место и категорию
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const STATUS_UI: Record<Rsvp, { label: string; className: string }> = {
  PENDING: { label: 'Ждёт ответа', className: 'bg-warning-bg text-warning' },
  CONFIRMED: { label: 'Участвуем', className: 'bg-brand-green-light text-brand-green' },
  DECLINED: { label: 'Не участвуем', className: 'bg-surface-muted text-text-secondary' },
}

function parseWeight(value: string) {
  const n = Number(value.replace(',', '.'))
  return Number.isFinite(n) && n >= 10 && n <= 150 ? n : null
}

function ResponseForm({
  item,
  childName,
  onSubmit,
}: {
  item: UpcomingCompetition
  childName: string
  onSubmit: (status: 'CONFIRMED' | 'DECLINED', weightKg?: number, discipline?: 'KATA' | 'KUMITE') => Promise<void>
}) {
  const [editing, setEditing] = useState(item.rsvpStatus === 'PENDING')
  const [weight, setWeight] = useState('')
  const [discipline, setDiscipline] = useState<'KATA' | 'KUMITE'>('KATA')
  const [submitting, setSubmitting] = useState<'CONFIRMED' | 'DECLINED' | null>(null)
  const [touched, setTouched] = useState(false)
  const kg = parseWeight(weight)
  const attestation = /аттестац/i.test(item.name)

  const send = async (status: 'CONFIRMED' | 'DECLINED') => {
    if (status === 'CONFIRMED' && !attestation && kg == null) {
      setTouched(true)
      return
    }
    setSubmitting(status)
    const full = status === 'CONFIRMED' && !attestation
    try {
      await onSubmit(status, full ? kg! : undefined, full ? discipline : undefined)
      setEditing(false)
    } catch {
      return
    } finally {
      setSubmitting(null)
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-muted px-4 py-3">
        <p className="text-sm text-text">
          {item.rsvpStatus === 'CONFIRMED' ? `${childName} участвует` : `${childName} не участвует`}
        </p>
        <button type="button" onClick={() => setEditing(true)} className="text-sm font-semibold text-brand-green">
          Изменить
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {attestation ? (
        <p className="rounded-xl bg-surface-muted px-4 py-3 text-sm text-text-secondary">
          Аттестация на пояс — вес и дисциплина не нужны. Просто ответьте тренеру.
        </p>
      ) : (
      <>
      <div>
        <p className="text-sm font-semibold text-text">Дисциплина</p>
        <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-label="Дисциплина">
          {(['KATA', 'KUMITE'] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDiscipline(d)}
              aria-pressed={discipline === d}
              className={`min-h-11 rounded-xl text-sm font-semibold transition ${
                discipline === d ? 'bg-brand-green text-white' : 'bg-surface-muted text-text-secondary'
              }`}
            >
              {d === 'KATA' ? 'Ката' : 'Кумитэ'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-text" htmlFor={`weight-${item.competitionId}`}>
          Вес ребёнка
        </label>
        <div className="mt-2 flex items-center gap-3">
          <input
            id={`weight-${item.competitionId}`}
            type="text"
            inputMode="decimal"
            placeholder="Например, 32,5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={touched && kg == null}
            className="input flex-1 text-base font-semibold"
          />
          <span className="text-sm text-text-secondary">кг</span>
        </div>
        <p className={`mt-1.5 text-xs ${touched && kg == null ? 'text-error' : 'text-text-muted'}`}>
          {touched && kg == null ? 'Укажите вес от 10 до 150 кг' : 'Нужен для весовой категории'}
        </p>
      </div>
      </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={submitting !== null}
          onClick={() => void send('DECLINED')}
          className="btn-secondary"
        >
          {submitting === 'DECLINED' ? '…' : 'Не участвуем'}
        </button>
        <button
          type="button"
          disabled={submitting !== null}
          onClick={() => void send('CONFIRMED')}
          className="btn-primary"
        >
          {submitting === 'CONFIRMED' ? '…' : 'Участвуем'}
        </button>
      </div>
    </div>
  )
}

type EventRow = { info: UpcomingCompetition; invites: { child: StudentSummary; item: UpcomingCompetition }[] }

function summaryStatus(invites: EventRow['invites']): { label: string; className: string } {
  const pending = invites.filter((i) => i.item.rsvpStatus === 'PENDING').length
  if (invites.length === 1) return STATUS_UI[invites[0].item.rsvpStatus]
  if (pending) return { label: `Ждут ответа: ${pending}`, className: STATUS_UI.PENDING.className }
  const going = invites.filter((i) => i.item.rsvpStatus === 'CONFIRMED').length
  return going
    ? { label: `Участвуют: ${going}`, className: STATUS_UI.CONFIRMED.className }
    : { label: 'Не участвуем', className: STATUS_UI.DECLINED.className }
}

export function CompetitionInvite() {
  const [params] = useSearchParams()
  const { children, selectedChildId, setSelectedChildId, clubs, multiClub, loading: childrenLoading } = useParentChild()
  const [byChild, setByChild] = useState<Record<number, UpcomingCompetition[]>>({})
  const [openId, setOpenId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)
  const key = children.map((c) => c.id).join(',')
  const wanted = Number(params.get('id'))

  const [view, setView] = useState<'upcoming' | 'past'>('upcoming')
  const [rsvpCache, setRsvpCache] = useStoredState<RsvpCache>(RSVP_CACHE_KEY, {})
  const [clubEvents, setClubEvents] = useState<UpcomingCompetition[]>([])

  useEffect(() => {
    let alive = true
    parentApi
      .competitions()
      .then((list) => alive && setClubEvents(list))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [key])

  const remember = useCallback(
    (entries: ReadonlyArray<readonly [number, readonly UpcomingCompetition[]]>) =>
      setRsvpCache((cache) => {
        let changed = false
        const next = { ...cache }
        for (const [childId, list] of entries) {
          for (const c of list) {
            const k = `${childId}:${c.competitionId}`
            const prev = next[k]
            if (!prev || prev.status !== c.rsvpStatus || prev.name !== c.name || prev.eventDate !== c.eventDate) {
              next[k] = { name: c.name, eventDate: c.eventDate, status: c.rsvpStatus }
              changed = true
            }
          }
        }
        return changed ? next : cache
      }),
    [setRsvpCache],
  )

  const request = useRef(0)
  const wantedRef = useRef(wanted)
  wantedRef.current = wanted

  const load = useCallback(() => {
    if (!key) return
    const id = ++request.current
    setLoading(true)
    setError(null)
    Promise.all(
      key.split(',').map(async (childId) => {
        const home = await parentApi.home(Number(childId))
        return [Number(childId), home.upcomingCompetitions ?? []] as const
      }),
    )
      .then((entries) => {
        if (id !== request.current) return
        setByChild(Object.fromEntries(entries))
        remember(entries)
        const all = entries.flatMap(([, list]) => list)
        const initial =
          all.find((c) => c.competitionId === wantedRef.current) ?? all.find((c) => c.rsvpStatus === 'PENDING') ?? null
        setOpenId(initial?.competitionId ?? null)
      })
      .catch((e) => id === request.current && setError(e instanceof ApiError ? e.message : 'Ошибка'))
      .finally(() => id === request.current && setLoading(false))
  }, [key, remember])

  useEffect(() => {
    if (wanted) setOpenId(wanted)
  }, [wanted])

  useEffect(() => {
    setNotice(null)
  }, [selectedChildId, view])

  useEffect(() => {
    load()
  }, [load])

  const several = children.length > 1
  const splitByChild = several && multiClub
  const viewChildren = splitByChild ? children.filter((c) => c.id === selectedChildId) : children
  const events: EventRow[] = []
  for (const child of viewChildren) {
    for (const item of byChild[child.id] ?? []) {
      let row = events.find((e) => e.info.competitionId === item.competitionId)
      if (!row) {
        row = { info: item, invites: [] }
        events.push(row)
      }
      row.invites.push({ child, item })
    }
  }
  events.sort((a, b) => a.info.eventDate.localeCompare(b.info.eventDate))

  const pastMap = new Map<number, PastRow>()
  const pastRow = (id: number, name: string, eventDate: string) => {
    let row = pastMap.get(id)
    if (!row) {
      row = { competitionId: id, name, eventDate, entries: [] }
      pastMap.set(id, row)
    }
    return row
  }
  for (const child of viewChildren) {
    for (const [k, v] of Object.entries(rsvpCache)) {
      const [childId, compId] = k.split(':').map(Number)
      if (childId !== child.id || daysUntil(v.eventDate) >= 0) continue
      pastRow(compId, v.name, v.eventDate).entries.push({ child, status: v.status })
    }
  }
  const firstClub = children[0] ? clubs[children[0].id] : undefined
  for (const c of clubEvents) {
    if (daysUntil(c.eventDate) >= 0) continue
    for (const child of viewChildren) {
      if (several && clubs[child.id] !== firstClub) continue
      const row = pastRow(c.competitionId, c.name, c.eventDate)
      if (!row.entries.some((e) => e.child.id === child.id)) row.entries.push({ child, status: null })
    }
  }
  const pastRows = [...pastMap.values()].sort((a, b) => b.eventDate.localeCompare(a.eventDate))

  const pendingOf = (id: number) => (byChild[id] ?? []).filter((c) => c.rsvpStatus === 'PENDING').length
  const subtitle = splitByChild
    ? 'Дети в разных клубах — у каждого свои турниры'
    : several
      ? 'Турниры клуба — ответ по каждому ребёнку'
      : 'Турниры, аттестации и сборы секции'

  const respond = async (
    childId: number,
    item: UpcomingCompetition,
    status: 'CONFIRMED' | 'DECLINED',
    weightKg?: number,
    discipline?: 'KATA' | 'KUMITE',
  ) => {
    setNotice(null)
    try {
      await parentApi.respondCompetition(item.competitionId, { studentId: childId, rsvpStatus: status, weightKg, discipline })
      setByChild((all) => ({
        ...all,
        [childId]: (all[childId] ?? []).map((c) => (c.competitionId === item.competitionId ? { ...c, rsvpStatus: status } : c)),
      }))
      remember([[childId, [{ ...item, rsvpStatus: status }]]])
      setNotice({ ok: true, text: status === 'CONFIRMED' ? 'Тренер увидит, что вы участвуете' : 'Ответ отправлен тренеру' })
    } catch (e) {
      setNotice({ ok: false, text: e instanceof ApiError ? e.message : 'Не удалось отправить ответ' })
      throw e
    }
  }

  if (!childrenLoading && children.length === 0) {
    return (
      <div className="mx-auto w-full max-w-lg bg-white px-5 pt-[max(1.25rem,env(safe-area-inset-top,0px))] pb-6">
        <h1 className="text-[1.75rem] font-extrabold text-[#101828]">События</h1>
        <p className="mt-1 text-sm text-[#667085]">{subtitle}</p>
        <ParentEmptyHint
          title="Сначала привяжите ребёнка"
          description="После привязки здесь появятся приглашения на мероприятия секции."
        />
      </div>
    )
  }

  return (
    <ParentPageShell
      title="События"
      subtitle={subtitle}
      hero={<ParentHero eyebrow="Турниры и аттестации" title="События" subtitle={subtitle} />}
    >
      {splitByChild && (
        <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Чьи мероприятия показать">
          {children.map((child) => {
            const active = child.id === selectedChildId
            const pending = pendingOf(child.id)
            return (
              <button
                key={child.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedChildId(child.id)}
                className={`relative flex items-center gap-2.5 rounded-2xl border p-2.5 text-left transition active:scale-[0.98] ${
                  active ? 'border-brand-green bg-brand-green-light/60' : 'border-border-light bg-white'
                }`}
              >
                <ChildAvatar childId={child.id} name={`${child.firstName} ${child.lastName}`} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-text">{child.firstName}</span>
                  <span className="block truncate text-[11px] text-text-secondary">{clubs[child.id] ?? ''}</span>
                </span>
                {pending > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex min-w-5 items-center justify-center rounded-full bg-warning px-1.5 text-[11px] font-bold leading-5 text-white ring-2 ring-white">
                    {pending}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
      <div role="tablist" aria-label="Какие мероприятия показать" className="grid grid-cols-2 gap-1 rounded-full bg-surface-muted p-1">
        {(
          [
            { id: 'upcoming', label: `Предстоящие${events.length ? ` · ${events.length}` : ''}` },
            { id: 'past', label: `Прошедшие${pastRows.length ? ` · ${pastRows.length}` : ''}` },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={view === t.id}
            onClick={() => setView(t.id)}
            className={`min-h-10 rounded-full text-sm font-semibold transition ${
              view === t.id ? 'bg-white text-brand-green shadow-sm ring-1 ring-brand-green/25' : 'text-text-secondary hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {loading ? (
        <ParentLoading />
      ) : error ? (
        <ParentError message={error} onRetry={load} />
      ) : view === 'past' ? (
        <PastList rows={pastRows} several={viewChildren.length > 1} />
      ) : events.length === 0 ? (
        <EmptyState
          icon={<IconCalendar size={32} className="text-text-muted" />}
          title="Мероприятий пока нет"
          description="Когда тренер добавит турнир или аттестацию, приглашение появится здесь"
        />
      ) : (
        <div className="space-y-3">
          {notice && (
            <p role="status" className={notice.ok ? 'alert-success' : 'alert-error'}>
              {notice.text}
            </p>
          )}
          <p className="px-1 text-xs text-text-secondary">
            Все запланированные мероприятия: {events.length}. На главной показываются те, что в ближайшие 2 недели.
          </p>
          {events.map(({ info: item, invites }, index) => {
            const open = openId === item.competitionId
            const status = summaryStatus(invites)
            const date = new Date(`${item.eventDate}T12:00:00`)
            const newMonth = index === 0 || events[index - 1].info.eventDate.slice(0, 7) !== item.eventDate.slice(0, 7)
            return (
              <div key={item.competitionId}>
              {newMonth && (
                <h2 className={`mb-2 px-1 text-xs font-bold uppercase tracking-wider text-text-muted ${index === 0 ? 'mt-1' : 'mt-5'}`}>
                  {monthTitle(item.eventDate)}
                </h2>
              )}
              <div className="card overflow-hidden p-0">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : item.competitionId)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-green-light leading-none text-brand-green">
                    <span className="text-lg font-extrabold">{date.getDate()}</span>
                    <span className="mt-0.5 text-[10px] font-semibold">
                      {date.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '')}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-text">{item.name}</span>
                    <span className="mt-0.5 block text-xs text-text-secondary">
                      {formatDate(item.eventDate)} · {whenLabel(item.eventDate)}
                    </span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${status.className}`}>
                    {status.label}
                  </span>
                  <IconChevronDown
                    size={16}
                    className={`shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </button>
                {open && (
                  <div className="border-t border-border-light p-4">
                    <p className="mb-4 text-xs text-text-muted">Время и место тренер сообщит отдельно</p>
                    <div className="space-y-5">
                      {invites.map(({ child, item: invite }) => (
                        <div key={child.id}>
                          {invites.length > 1 && (
                            <div className="mb-3 flex items-center gap-2.5">
                              <ChildAvatar childId={child.id} name={`${child.firstName} ${child.lastName}`} size={32} />
                              <span className="min-w-0 flex-1 truncate font-bold text-text">{child.firstName}</span>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_UI[invite.rsvpStatus].className}`}>
                                {STATUS_UI[invite.rsvpStatus].label}
                              </span>
                            </div>
                          )}
                          <ResponseForm
                            key={`${item.competitionId}-${child.id}-${invite.rsvpStatus}`}
                            item={invite}
                            childName={child.firstName}
                            onSubmit={(s, w, d) => respond(child.id, invite, s, w, d)}
                          />
                        </div>
                      ))}
                      {several && !splitByChild && invites.length < children.length && (
                        <p className="text-xs text-text-muted">
                          Не приглашены:{' '}
                          {children
                            .filter((c) => !invites.some((i) => i.child.id === c.id))
                            .map((c) => c.firstName)
                            .join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              </div>
            )
          })}
        </div>
      )}
    </ParentPageShell>
  )
}
