import { useState } from 'react'
import { Link } from 'react-router-dom'
import { parentApi } from '../api/parent'
import type { NextTraining } from '../api/types'
import { ApiError } from '../api/client'
import { ParentAlertsSheet } from '../components/parent/ParentAlertsSheet'
import { PARENT_CARD, PARENT_PAGE, RSVP_CHIP } from '../components/parent/parentUi'
import { ParentOnboarding } from '../components/parent/ParentOnboarding'
import { ParentError, ParentLoading } from '../components/parent/ParentScreenState'
import { ParentTopBar } from '../components/parent/ParentTopBar'
import { BadgeToken } from '../components/ui/BadgeToken'
import { IconCalendar, IconCheck, IconChevronRight, IconClipboard, IconTrophy, IconX } from '../components/ui/Icons'
import { useParentChild } from '../context/ParentChildContext'
import { useFamilyAlerts } from '../hooks/useFamilyAlerts'
import { useParentChildData } from '../hooks/useParentChildData'
import { localIso } from '../utils/athletePath'
import { daysUntil, isSoon, SOON_DAYS, whenLabel } from '../utils/events'
import { attendanceStatusLabel, formatDate, paymentStatusUi } from '../utils/format'
import { attendanceRate, badgesEarned, beltTitle, parentReadiness } from '../utils/parentReadiness'

function time(value?: string | null) {
  return value ? value.slice(0, 5) : ''
}

function weekday(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('ru-RU', { weekday: 'long' })
}

function NextTrainingRow({
  training,
  childId,
  onUpdated,
}: {
  training: NextTraining
  childId: number
  onUpdated: (next: NextTraining, childId: number) => void
}) {
  const [saving, setSaving] = useState<'CONFIRMED' | 'DECLINED' | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const respond = async (status: 'CONFIRMED' | 'DECLINED') => {
    setSaving(status)
    setErr(null)
    try {
      const next = await parentApi.setTrainingIntent(childId, {
        groupId: training.groupId,
        sessionDate: training.date,
        startTime: training.startTime,
        rsvpStatus: status,
      })
      onUpdated(next, childId)
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Не удалось сохранить')
    } finally {
      setSaving(null)
    }
  }

  const status = training.intentStatus
  return (
    <div>
      <p className="font-semibold text-text">
        {formatDate(training.date)}, {time(training.startTime)}
        {training.endTime ? `–${time(training.endTime)}` : ''}
      </p>
      <p className="text-sm text-text-secondary">
        {training.groupName}
        {training.location ? ` · ${training.location}` : ''}
      </p>
      <div className="mt-3 flex items-start gap-3 rounded-xl bg-surface-muted p-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-green">
          <IconClipboard size={17} />
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Тема занятия
            <span className="rounded-full bg-white px-1.5 py-px text-[9px] font-bold">СКОРО</span>
          </span>
          <span className="block text-sm text-text-secondary">Здесь появятся тема и план, которые пишет тренер</span>
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={saving !== null}
          onClick={() => void respond('CONFIRMED')}
          aria-pressed={status === 'CONFIRMED'}
          className={`flex min-h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition ${
            status === 'CONFIRMED' ? 'bg-brand-green text-white' : 'bg-brand-green-light text-brand-green'
          }`}
        >
          <IconCheck size={16} />
          {saving === 'CONFIRMED' ? '…' : 'Придёт'}
        </button>
        <button
          type="button"
          disabled={saving !== null}
          onClick={() => void respond('DECLINED')}
          aria-pressed={status === 'DECLINED'}
          className={`flex min-h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition ${
            status === 'DECLINED' ? 'bg-text-secondary text-white' : 'bg-surface-muted text-text-secondary'
          }`}
        >
          <IconX size={16} />
          {saving === 'DECLINED' ? '…' : 'Не придёт'}
        </button>
      </div>
      <p className={`mt-2 text-xs ${err ? 'text-error' : 'text-text-muted'}`}>
        {err ?? (status === 'PENDING' ? 'Тренер увидит ваш ответ' : 'Ответ отправлен тренеру — можно изменить')}
      </p>
    </div>
  )
}

export function ParentHome() {
  const { children, selectedChildId, loading: childrenLoading, error: childrenError, refresh } = useParentChild()
  const { home, setHome, history, achievements, loading, error, reload } = useParentChildData(selectedChildId)
  const [alertsOpen, setAlertsOpen] = useState(false)
  const { items: family, count: alerts } = useFamilyAlerts(children.length > 0)

  if (!childrenLoading && !childrenError && children.length === 0) {
    return <ParentOnboarding />
  }

  const competitions = home?.upcomingCompetitions ?? []
  const soon = competitions.filter((c) => isSoon(c.eventDate))
  const later = competitions.find((c) => daysUntil(c.eventDate) > SOON_DAYS) ?? null
  const familyDebts = family.find((i) => i.child.id === selectedChildId)?.debts
  const unpaid = familyDebts ?? (home?.recentPayments ?? []).filter((p) => p.status !== 'PAID')
  const readiness = parentReadiness(history, achievements, competitions)
  const last = history[0]
  const lastBadges = last ? achievements.filter((a) => a.lastIssuedAt && localIso(new Date(a.lastIssuedAt)) === last.date) : []
  const attended = last && (last.status === 'PRESENT' || last.status === 'MAKEUP')

  return (
    <div className={PARENT_PAGE}>
      <ParentTopBar
        variant="home"
        alerts={alerts}
        onBell={() => setAlertsOpen(true)}
        beltName={home?.beltName}
        beltColor={home?.beltColor}
      />

      {childrenLoading || loading ? (
        <div className="mt-6">
          <ParentLoading />
        </div>
      ) : childrenError || error || !home ? (
        <div className="mt-6">
          <ParentError message={childrenError ?? error ?? 'Нет данных'} onRetry={childrenError ? () => void refresh() : reload} />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {unpaid.map((p) => {
            const ui = paymentStatusUi(p.status, p.dueDate)
            return (
              <Link
                key={p.id}
                to="/app/payments"
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
                  p.status === 'OVERDUE' ? 'bg-error-bg' : 'bg-warning-bg'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-text">
                    Не оплачено: {p.periodLabel}
                  </span>
                  <span className="block text-xs text-text-secondary">{ui.label} · тренер ждёт оплату</span>
                </span>
                <IconChevronRight size={16} className="shrink-0 text-text-muted" />
              </Link>
            )
          })}

          <Link to="/app/athlete" className={`block ${PARENT_CARD} transition active:scale-[0.99]`}>
            <p className="text-sm font-semibold text-text-secondary">До следующего пояса</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                <div
                  className="h-full rounded-full bg-brand-green transition-[width] duration-700"
                  style={{ width: `${readiness.percent}%` }}
                />
              </div>
              <span className="text-lg font-extrabold text-text">{readiness.percent}%</span>
            </div>
            <div className="mt-2 flex justify-between text-xs text-text-muted">
              <span>{beltTitle(home.beltName)}</span>
              <span>{home.maxRank ? 'высший пояс' : beltTitle(home.nextBeltName)}</span>
            </div>
          </Link>

          <div className="grid grid-cols-2 gap-3">
            <Link to="/app/athlete?tab=stats" className={`${PARENT_CARD} transition active:scale-[0.99]`}>
              <p className="text-sm text-text-secondary">Посещаемость</p>
              <p className="mt-2 text-3xl font-extrabold text-text">
                {history.length ? attendanceRate(history) : '—'}
                {history.length > 0 && <span className="text-lg text-brand-green">%</span>}
              </p>
            </Link>
            <Link to="/app/athlete?tab=achievements" className={`${PARENT_CARD} transition active:scale-[0.99]`}>
              <p className="text-sm text-text-secondary">Значков</p>
              <p className="mt-2 flex items-center justify-between">
                <span className="text-3xl font-extrabold text-text">{badgesEarned(achievements)}</span>
                <IconTrophy size={26} className="text-warning" />
              </p>
            </Link>
          </div>

          <section className={PARENT_CARD}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-text">Последняя тренировка</h2>
              {last && (
                <Link to="/app/athlete?tab=stats" className="text-xs font-semibold text-brand-green">
                  Все
                </Link>
              )}
            </div>
            {last ? (
              <>
                <p className="mt-2 font-semibold text-text">
                  {formatDate(last.date)}, {weekday(last.date)}
                </p>
                <p className="text-sm text-text-secondary">{last.groupName}</p>
                <div className="mt-3 divide-y divide-border-light rounded-xl bg-surface-muted">
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <span className="text-sm text-text-secondary">Отметка тренера</span>
                    <span
                      className={`flex items-center gap-1.5 text-sm font-semibold ${
                        attended ? 'text-brand-green' : last.status === 'ABSENT' ? 'text-error' : 'text-warning'
                      }`}
                    >
                      {attended ? <IconCheck size={16} /> : last.status === 'ABSENT' ? <IconX size={16} /> : null}
                      {attendanceStatusLabel(last.status)}
                    </span>
                  </div>
                  <div className="flex min-h-12 items-center justify-between gap-3 px-3 py-2">
                    <span className="min-w-0">
                      <span className="block text-sm text-text-secondary">Значок</span>
                      <span className={`block truncate text-sm font-semibold ${lastBadges.length ? 'text-text' : 'text-text-muted'}`}>
                        {lastBadges.length ? lastBadges.map((b) => b.name).join(', ') : 'За это занятие не выдан'}
                      </span>
                    </span>
                    {lastBadges.length > 0 && <BadgeToken name={lastBadges[0].name} size="sm" />}
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-3 flex items-start gap-3 rounded-xl bg-surface-muted p-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-green">
                  <IconCalendar size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text">Отметок пока нет</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                    {home.nextTraining
                      ? `Первая тренировка — ${formatDate(home.nextTraining.date)}, ${time(home.nextTraining.startTime)}. `
                      : ''}
                    После занятия тренер отметит посещение — здесь появятся дата, отметка и полученные значки.
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className={PARENT_CARD}>
            <h2 className="font-bold text-text">Следующая тренировка</h2>
            {home.nextTraining && selectedChildId ? (
              <div className="mt-2">
                <NextTrainingRow
                  training={home.nextTraining}
                  childId={selectedChildId}
                  onUpdated={(nextTraining, forChild) =>
                    setHome((prev) => (prev && prev.studentId === forChild ? { ...prev, nextTraining } : prev))
                  }
                />
              </div>
            ) : (
              <div className="mt-3 flex items-start gap-3 rounded-xl bg-surface-muted p-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-green">
                  <IconCalendar size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text">Пока не запланирована</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                    Когда тренер добавит ребёнка в группу с расписанием, здесь появятся дата, время, тема занятия и кнопки
                    «Придёт / Не придёт».
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className={`${PARENT_CARD} p-0`}>
            <div className="flex items-center justify-between px-4 pt-4 pb-1">
              <h2 className="font-bold text-text">Приближающиеся мероприятия</h2>
              {competitions.length > 0 && (
                <Link to="/app/competition" className="text-xs font-semibold text-brand-green">
                  Все{competitions.length > soon.length ? ` (${competitions.length})` : ''}
                </Link>
              )}
            </div>
            {soon.length === 0 ? (
              <p className="px-4 pb-4 pt-2 text-sm text-text-secondary">
                {later ? (
                  <>
                    В ближайшие 2 недели мероприятий нет. Следующее —{' '}
                    <Link to={`/app/competition?id=${later.competitionId}`} className="font-semibold text-brand-green">
                      {later.name}, {formatDate(later.eventDate)}
                    </Link>
                  </>
                ) : (
                  'Пока ничего не запланировано — тренер добавит турниры и аттестации'
                )}
              </p>
            ) : (
              <ul className="divide-y divide-border-light">
                {soon.map((c) => {
                  const chip = RSVP_CHIP[c.rsvpStatus]
                  return (
                    <li key={c.competitionId}>
                      <Link
                        to={`/app/competition?id=${c.competitionId}`}
                        className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-muted"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold text-text">{c.name}</span>
                          <span className="block text-sm text-text-secondary">
                            {formatDate(c.eventDate)} · {whenLabel(c.eventDate)}
                          </span>
                        </span>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${chip.className}`}>
                          {chip.label}
                        </span>
                        <IconChevronRight size={16} className="shrink-0 text-text-muted" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      )}

      <ParentAlertsSheet open={alertsOpen} onClose={() => setAlertsOpen(false)} />
    </div>
  )
}
