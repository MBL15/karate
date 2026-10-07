import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { parentApi } from '../api/parent'
import type { HistoryEntry, NextTraining, ParentChildHome } from '../api/types'
import { ApiError } from '../api/client'
import { ParentChildHeroBar } from '../components/parent/ParentChildHeroBar'
import { ParentOnboarding } from '../components/parent/ParentOnboarding'
import { ParentPageShell } from '../components/parent/ParentPageShell'
import { ParentError, ParentLoading } from '../components/parent/ParentScreenState'
import { BeltProgressRing } from '../components/ui/BeltProgressRing'
import { DashboardCard } from '../components/ui/DashboardCard'
import { IconArrowRight, IconBell, IconCalendar, IconCheck, IconTrophy } from '../components/ui/Icons'
import { ProgressBar } from '../components/ui/ProgressBar'
import { QuickActions } from '../components/ui/QuickActions'
import { SectionHeader } from '../components/ui/SectionHeader'
import { useAuth } from '../context/AuthContext'
import { useParentChild } from '../context/ParentChildContext'
import { attendanceDayClass, attendanceStatusLabel, formatDate, paymentStatusUi } from '../utils/format'
import { beltNextDisplayName, beltProgressValue, beltShowsPercent } from '../utils/beltProgress'

const imgUser = '/assets/parent/user.svg'
const imgAward = '/assets/parent/award.svg'
const imgFolder = '/assets/parent/folder.svg'
const imgTrophy = '/assets/parent/trophy.svg'

function BeltProgressPanel({ home }: { home: ParentChildHome }) {
  const showPct = beltShowsPercent(home)
  const nextLabel = beltNextDisplayName(home)
  return (
    <div className="card p-6">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <BeltProgressRing
          variant="card"
          value={beltProgressValue(home)}
          beltName={home.beltName}
          nextLabel={nextLabel}
          showPercent={showPct}
          centerCaption="Тренер"
        />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Текущий уровень</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-text">{home.beltName} пояс</h2>
          <p className="mt-2 text-sm text-text-secondary">{home.progressLabel}</p>
          {showPct && (
            <div className="mt-5">
              <ProgressBar
                value={beltProgressValue(home)}
                label={
                  home.beltAssignmentMode === 'ATTENDANCE' && home.sessionsRequired
                    ? `${home.sessionsCompleted ?? 0} / ${home.sessionsRequired} занятий`
                    : `Прогресс до ${nextLabel}`
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatTrainingTime(value: string) {
  return value.length >= 5 ? value.slice(0, 5) : value
}

function NextTrainingPanel({
  training,
  childId,
  onUpdated,
}: {
  training: NextTraining
  childId: number
  onUpdated: (next: NextTraining) => void
}) {
  const [saving, setSaving] = useState<'CONFIRMED' | 'DECLINED' | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const respond = async (status: 'CONFIRMED' | 'DECLINED') => {
    setSaving(status)
    setErr(null)
    try {
      const updated = await parentApi.setTrainingIntent(childId, {
        groupId: training.groupId,
        sessionDate: training.date,
        startTime: training.startTime,
        rsvpStatus: status,
      })
      onUpdated(updated)
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Не удалось сохранить')
    } finally {
      setSaving(null)
    }
  }

  const timeLabel = formatTrainingTime(training.startTime)
  const endLabel = training.endTime ? formatTrainingTime(training.endTime) : null

  return (
    <div className="card mt-3 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Ближайшая тренировка</p>
      <h3 className="mt-2 text-lg font-bold text-text">{formatDate(training.date)}</h3>
      <p className="mt-1 text-sm text-text-secondary">
        {timeLabel}
        {endLabel ? `–${endLabel}` : ''} · {training.groupName}
        {training.location ? ` · ${training.location}` : ''}
      </p>
      <p className="mt-3 text-sm text-text-secondary">Ребёнок придёт на занятие?</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={saving !== null}
          onClick={() => void respond('CONFIRMED')}
          className={`min-h-11 rounded-xl text-sm font-semibold transition ${
            training.intentStatus === 'CONFIRMED'
              ? 'bg-brand-green text-white shadow-sm'
              : 'border border-brand-green/40 bg-brand-green/10 text-brand-green'
          }`}
        >
          {saving === 'CONFIRMED' ? '…' : 'Будем'}
        </button>
        <button
          type="button"
          disabled={saving !== null}
          onClick={() => void respond('DECLINED')}
          className={`min-h-11 rounded-xl text-sm font-semibold transition ${
            training.intentStatus === 'DECLINED'
              ? 'bg-text-secondary text-white'
              : 'border border-border bg-surface-muted text-text-secondary'
          }`}
        >
          {saving === 'DECLINED' ? '…' : 'Не сможем'}
        </button>
      </div>
      {training.intentStatus === 'PENDING' && !err && (
        <p className="mt-3 text-xs text-text-muted">Отметка видна тренеру в базе учеников</p>
      )}
      {training.intentStatus !== 'PENDING' && (
        <p className="mt-3 text-xs font-medium text-brand-green">
          {training.intentStatus === 'CONFIRMED' ? 'Вы отметили: ребёнок будет' : 'Вы отметили: ребёнок не придёт'}
        </p>
      )}
      {err && <p className="alert-error mt-3 text-sm">{err}</p>}
    </div>
  )
}

function PaymentBadge({ status, dueDate }: { status: 'PAID' | 'OVERDUE' | 'PENDING'; dueDate?: string }) {
  const ui = paymentStatusUi(status, dueDate)
  const badgeClass =
    status === 'PAID' ? 'badge-success' : status === 'OVERDUE' ? 'badge-error' : 'badge-warning'
  return <span className={`badge ${badgeClass}`}>{ui.label}</span>
}

export function ParentHome() {
  const { user } = useAuth()
  const { children, selectedChild, selectedChildId, loading: childrenLoading, error: childrenError } = useParentChild()
  const [home, setHome] = useState<ParentChildHome | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadHome = useCallback(() => {
    if (!selectedChildId) {
      setHome(null)
      setHistory([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    Promise.all([parentApi.home(selectedChildId), parentApi.history(selectedChildId)])
      .then(([homeData, historyData]) => {
        setHome(homeData)
        setHistory(historyData)
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false))
  }, [selectedChildId])

  useEffect(() => {
    loadHome()
  }, [loadHome])

  const competition = home?.upcomingCompetitions[0]
  const payment = home?.recentPayments[0]
  const hasAlert = Boolean(competition) || Boolean(payment && payment.status !== 'PAID')
  const subtitle = selectedChild
    ? `${selectedChild.firstName} · ${selectedChild.age} лет · ${selectedChild.beltName} пояс`
    : 'Выберите ребёнка в боковой панели'

  const paymentAccent =
    payment?.status === 'OVERDUE' ? 'red' : payment?.status === 'PENDING' ? 'amber' : 'green'

  const quickActions = [
    { to: '/app/profile', label: 'Профиль', icon: imgUser },
    { to: '/app/achievements', label: 'Награды', icon: imgAward },
    { to: '/app/competition', label: 'Турниры', icon: imgTrophy },
    { to: '/app/history', label: 'Архив', icon: imgFolder },
  ]

  const paymentLabel = payment
    ? payment.status === 'PAID'
      ? 'Оплачено'
      : payment.status === 'OVERDUE'
        ? 'Просрочено'
        : 'Ожидает'
    : '—'

  const tournamentLabel = competition ? 'Есть' : 'Нет'
  const presentCount = history.filter((h) => h.status === 'PRESENT' || h.status === 'MAKEUP').length
  const attendancePct = history.length ? Math.round((presentCount / history.length) * 100) : 0
  const latestAttendance = history[0]

  if (!childrenLoading && !childrenError && children.length === 0) {
    return <ParentOnboarding />
  }

  return (
    <ParentPageShell
      title="Дневник"
      subtitle={subtitle}
      hero={
        <div className="hero-app rounded-b-[1.75rem] px-5 pb-8 pt-5">
          <div className="relative z-10">
            <div className="mb-5 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Karate Hub</p>
              <h2 className="mt-2 text-2xl font-extrabold leading-tight text-white">
                {user?.name.split(' ')[0] ?? 'Родитель'}
              </h2>
              <p className="mt-1 text-sm leading-snug text-white/70">{subtitle}</p>
            </div>

            <ParentChildHeroBar
              right={
                <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/8 text-text-on-dark">
                  <IconBell size={20} />
                  {hasAlert && (
                    <span className="absolute top-1.5 right-1.5 size-2.5 rounded-full border-2 border-navy-950 bg-warning" />
                  )}
                </span>
              }
            />

            {home && (
              <div className="fade-in-up flex flex-col items-center">
                <BeltProgressRing
                  value={beltProgressValue(home)}
                  beltName={home.beltName}
                  nextLabel={beltNextDisplayName(home)}
                  size={148}
                  showPercent={beltShowsPercent(home)}
                  centerCaption="Тренер"
                />

                <div className="mt-6 grid w-full grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { value: paymentLabel, label: 'оплата' },
                    { value: tournamentLabel, label: 'турниры' },
                    { value: `${home.age}`, label: 'лет' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-white/10 bg-white/10 px-2 py-3.5 text-center sm:px-3"
                    >
                      <p className="truncate text-sm font-extrabold leading-none text-white sm:text-base">{stat.value}</p>
                      <p className="mt-2 text-[10px] font-semibold uppercase leading-none tracking-wider text-white/70">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      }
    >
      {childrenLoading || loading ? (
        <ParentLoading />
      ) : childrenError || error ? (
        <ParentError message={childrenError ?? error ?? 'Ошибка'} onRetry={loadHome} />
      ) : !home ? (
        <ParentError message="Привяжите ребёнка по коду от тренера" />
      ) : (
        <>
          <div className="fade-in-up stagger-1">
            <SectionHeader title="Быстрый доступ" subtitle="Один тап — нужный раздел" />
            <div className="mt-3">
              <QuickActions actions={quickActions} />
            </div>
          </div>

          {home.nextTraining && selectedChildId && (
            <div className="fade-in-up stagger-1">
              <SectionHeader title="Тренировка" subtitle="Сообщите тренеру заранее" />
              <NextTrainingPanel
                training={home.nextTraining}
                childId={selectedChildId}
                onUpdated={(nextTraining) => setHome((prev) => (prev ? { ...prev, nextTraining } : prev))}
              />
            </div>
          )}

          <div className="hidden lg:block fade-in-up stagger-2">
            <BeltProgressPanel home={home} />
          </div>

          {history.length > 0 && (
            <div className="fade-in-up stagger-2">
              <SectionHeader
                title="Посещаемость"
                subtitle={`${presentCount} из ${history.length} занятий · ${attendancePct}%`}
                action={
                  <Link to="/app/history" className="text-xs font-semibold text-brand-green hover:underline">
                    Все записи
                  </Link>
                }
              />
              <div className="card mt-3 p-5">
                <div className="flex flex-wrap gap-2">
                  {history.slice(0, 14).map((entry, index) => {
                    const day = new Date(`${entry.date}T12:00:00`).getDate()
                    return (
                      <div
                        key={`${entry.date}-${index}`}
                        title={`${formatDate(entry.date)}: ${attendanceStatusLabel(entry.status)}`}
                        className={`flex size-9 items-center justify-center rounded-xl text-xs font-semibold ${attendanceDayClass(entry.status)}`}
                      >
                        {day}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="fade-in-up stagger-2">
            <SectionHeader title="Обзор" subtitle="Актуальная информация" />
            <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <DashboardCard
                label="Оплата"
                title={
                  payment
                    ? payment.status === 'PAID'
                      ? 'Оплачено'
                      : payment.status === 'OVERDUE'
                        ? 'Просрочено'
                        : 'Ожидает оплаты'
                    : 'Нет данных'
                }
                description={
                  payment ? `${payment.description} · ${payment.periodLabel}` : 'Оплаты появятся здесь'
                }
                icon={<IconCheck size={18} />}
                accent={payment ? paymentAccent : 'neutral'}
                badge={payment ? <PaymentBadge status={payment.status} dueDate={payment.dueDate} /> : undefined}
              />

              <DashboardCard
                label="Посещения"
                title={history.length ? `${attendancePct}%` : 'Нет данных'}
                description={
                  latestAttendance
                    ? `Последнее: ${formatDate(latestAttendance.date)} · ${attendanceStatusLabel(latestAttendance.status)}`
                    : 'Тренер отметит после занятия'
                }
                icon={<IconCalendar size={18} />}
                accent="green"
                to="/app/history"
              />

              <DashboardCard
                label="Профиль"
                title={home.fullName.split(' ')[0]}
                description={`${home.age} лет · ${home.beltName.toLowerCase()} пояс`}
                icon={<IconCalendar size={18} />}
                accent="blue"
                to="/app/profile"
              />

              <DashboardCard
                label="Награды"
                title="Достижения"
                description="Бейджи и прогресс ребёнка"
                icon={<IconTrophy size={18} />}
                accent="amber"
                to="/app/achievements"
              />
            </div>
          </div>

          {competition && (
            <div className="fade-in-up stagger-3">
              <SectionHeader
                title="Требует внимания"
                subtitle="Ответьте на приглашение"
                action={
                  <Link to="/app/competition" className="text-xs font-semibold text-brand-green hover:underline">
                    Все турниры
                  </Link>
                }
              />
              <div className="attention-card relative mt-3 overflow-hidden p-5 lg:p-6">
                <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-warning-bg text-warning">
                    <IconTrophy size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="mb-2 inline-block rounded bg-warning-bg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning">
                      {competition.rsvpStatus === 'PENDING' ? 'Приглашение' : 'Соревнование'}
                    </span>
                    <h4 className="text-base font-bold text-text lg:text-lg">{competition.name}</h4>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
                      <IconCalendar size={14} />
                      {formatDate(competition.eventDate)}
                    </p>
                    {competition.rsvpStatus === 'PENDING' && (
                      <p className="mt-2 text-sm text-text-secondary">
                        Подтвердите участие — тренер ждёт ваш ответ
                      </p>
                    )}
                    <Link
                      to="/app/competition"
                      className="btn-primary mt-4 inline-flex w-full sm:w-auto sm:px-6"
                    >
                      {competition.rsvpStatus === 'PENDING' ? 'Ответить на приглашение' : 'Открыть детали'}
                      <IconArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </ParentPageShell>
  )
}
