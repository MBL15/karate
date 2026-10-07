import { useEffect, useId, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { parentApi } from '../../api/parent'
import type { NextTraining, Payment, UpcomingCompetition } from '../../api/types'
import { Dialog } from '../a11y/Dialog'
import { IconCalendar, IconTrophy, IconX } from '../ui/Icons'
import { formatDate, paymentStatusUi } from '../../utils/format'

function formatTime(value: string) {
  return value.length >= 5 ? value.slice(0, 5) : value
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount)
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">{title}</h3>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  )
}

function EmptyRow({ text }: { text: string }) {
  return <p className="rounded-2xl bg-[#f9fafb] px-4 py-3 text-sm text-text-secondary">{text}</p>
}

export function ParentAlertsSheet({
  open,
  childId,
  schedule,
  competitions,
  onClose,
}: {
  open: boolean
  childId: number | null
  schedule: NextTraining | null
  competitions: UpcomingCompetition[]
  onClose: () => void
}) {
  const titleId = useId()
  const [debts, setDebts] = useState<Payment[]>([])
  const [debtsState, setDebtsState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')

  useEffect(() => {
    if (!open || childId == null) return
    let cancelled = false
    setDebtsState('loading')
    parentApi
      .payments(childId)
      .then((list) => {
        if (cancelled) return
        setDebts(list.filter((payment) => payment.status !== 'PAID'))
        setDebtsState('ready')
      })
      .catch(() => {
        if (!cancelled) setDebtsState('error')
      })
    return () => {
      cancelled = true
    }
  }, [open, childId])

  const timeLabel = schedule
    ? `${formatTime(schedule.startTime)}${schedule.endTime ? `–${formatTime(schedule.endTime)}` : ''}`
    : ''

  return (
    <Dialog open={open} titleId={titleId} onClose={onClose}>
      <div className="rounded-[1.75rem] bg-white p-5 shadow-[var(--shadow-elevated)]">
        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-xl font-bold tracking-tight text-text">
            Уведомления
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="flex size-10 items-center justify-center rounded-full text-text-secondary hover:bg-surface-muted"
          >
            <IconX size={18} />
          </button>
        </div>

        <Section title="Расписание">
          {schedule ? (
            <div className="rounded-2xl border border-[#e4e7ec] px-4 py-3">
              <p className="flex items-center gap-2 font-semibold text-text">
                <IconCalendar size={16} className="text-brand-green" />
                {formatDate(schedule.date)} · {timeLabel}
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                {schedule.groupName}
                {schedule.location ? ` · ${schedule.location}` : ''}
              </p>
              <p className="mt-2 text-sm text-text">
                {schedule.intentStatus === 'CONFIRMED'
                  ? 'Вы отметили, что ребёнок будет'
                  : schedule.intentStatus === 'DECLINED'
                    ? 'Вы отметили, что ребёнок не придёт'
                    : 'Тренер ждёт ответ: придёт ли ребёнок'}
              </p>
            </div>
          ) : (
            <EmptyRow text="Изменений расписания нет" />
          )}
        </Section>

        <Section title="Соревнования">
          {competitions.length === 0 ? (
            <EmptyRow text="Нет ближайших соревнований" />
          ) : (
            competitions.map((item) => (
              <Link
                key={item.competitionId}
                to="/app/competition"
                onClick={onClose}
                className="block rounded-2xl border border-[#e4e7ec] px-4 py-3"
              >
                <p className="flex items-center gap-2 font-semibold text-text">
                  <IconTrophy size={16} className="text-[#d7a62a]" />
                  {item.name}
                </p>
                <p className="mt-1 text-sm text-text-secondary">{formatDate(item.eventDate)}</p>
                <p className="mt-2 text-sm text-text">
                  {item.rsvpStatus === 'PENDING'
                    ? 'Нужен ответ: участвуете или нет'
                    : item.rsvpStatus === 'CONFIRMED'
                      ? 'Участие подтверждено'
                      : 'Вы отказались от участия'}
                </p>
              </Link>
            ))
          )}
        </Section>

        <Section title="Задолженности">
          {debtsState === 'loading' || debtsState === 'idle' ? (
            <EmptyRow text="Загрузка…" />
          ) : debtsState === 'error' ? (
            <EmptyRow text="Не удалось загрузить задолженности" />
          ) : debts.length === 0 ? (
            <EmptyRow text="Задолженностей нет" />
          ) : (
            debts.map((payment) => {
              const status = paymentStatusUi(payment.status, payment.dueDate)
              return (
                <div key={payment.id} className="rounded-2xl border border-[#e4e7ec] px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-text">{payment.description}</p>
                    <p className="shrink-0 font-semibold text-text">{formatMoney(payment.amount)}</p>
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">{payment.periodLabel}</p>
                  <p className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${status.className}`}>
                    {status.label}
                  </p>
                </div>
              )
            })
          )}
        </Section>
      </div>
    </Dialog>
  )
}
