import { useId, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Dialog } from '../a11y/Dialog'
import { IconCalendar, IconTrophy, IconX } from '../ui/Icons'
import { useParentChild } from '../../context/ParentChildContext'
import { useFamilyAlerts, type ChildAlerts } from '../../hooks/useFamilyAlerts'
import { formatDate, paymentStatusUi } from '../../utils/format'

function formatTime(value: string) {
  return value.length >= 5 ? value.slice(0, 5) : value
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

function ChildTag({ name, club }: { name: string; club?: string }) {
  return (
    <span className="mb-1.5 inline-flex max-w-full items-center gap-1 rounded-full bg-brand-green-light px-2 py-0.5 text-[11px] font-bold text-brand-green">
      <span className="truncate">
        {name}
        {club ? ` · ${club}` : ''}
      </span>
    </span>
  )
}

export function ParentAlertsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleId = useId()
  const { children, clubs, multiClub, setSelectedChildId } = useParentChild()
  const { items, loaded } = useFamilyAlerts(open)
  const several = children.length > 1

  const tag = (item: ChildAlerts) =>
    several ? <ChildTag name={item.child.firstName} club={multiClub ? clubs[item.child.id] : undefined} /> : null

  const trainings = items.filter((i) => i.home?.nextTraining)
  const events = items.flatMap((i) => (i.home?.upcomingCompetitions ?? []).map((c) => ({ item: i, c })))
  const debts = items.flatMap((i) => i.debts.map((p) => ({ item: i, p })))
  const ready = loaded || children.length === 0

  return (
    <Dialog open={open} titleId={titleId} onClose={onClose}>
      <div className="max-h-[85vh] overflow-y-auto rounded-[1.75rem] bg-white p-5 shadow-[var(--shadow-elevated)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-xl font-bold tracking-tight text-text">
              Уведомления
            </h2>
            {several && <p className="text-xs text-text-secondary">По всем детям</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="flex size-10 items-center justify-center rounded-full text-text-secondary hover:bg-surface-muted"
          >
            <IconX size={18} />
          </button>
        </div>

        <Section title="Сообщения тренера">
          <EmptyRow
            text={
              multiClub
                ? 'Скоро: уведомления тренеров клубов ваших детей — отмены, переносы, напоминания'
                : 'Скоро: уведомления тренера — отмены, переносы, напоминания'
            }
          />
        </Section>

        {!ready ? (
          <Section title="Загрузка">
            <EmptyRow text="Собираем уведомления…" />
          </Section>
        ) : (
          <>
            <Section title="Расписание">
              {trainings.length === 0 ? (
                <EmptyRow text="Ближайших тренировок нет" />
              ) : (
                trainings.map((item) => {
                  const s = item.home!.nextTraining!
                  return (
                    <Link
                      key={item.child.id}
                      to="/app"
                      onClick={() => {
                        setSelectedChildId(item.child.id)
                        onClose()
                      }}
                      className="block rounded-2xl border border-[#e4e7ec] px-4 py-3"
                    >
                      {tag(item)}
                      <p className="flex items-center gap-2 font-semibold text-text">
                        <IconCalendar size={16} className="text-brand-green" />
                        {formatDate(s.date)} · {formatTime(s.startTime)}
                        {s.endTime ? `–${formatTime(s.endTime)}` : ''}
                      </p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {s.groupName}
                        {s.location ? ` · ${s.location}` : ''}
                      </p>
                      <p className="mt-2 text-sm text-text">
                        {s.intentStatus === 'CONFIRMED'
                          ? 'Вы отметили, что ребёнок будет'
                          : s.intentStatus === 'DECLINED'
                            ? 'Вы отметили, что ребёнок не придёт'
                            : 'Тренер ждёт ответ: придёт ли ребёнок'}
                      </p>
                    </Link>
                  )
                })
              )}
            </Section>

            <Section title="События">
              {events.length === 0 ? (
                <EmptyRow text="Предстоящих событий нет" />
              ) : (
                events.map(({ item, c }) => (
                  <Link
                    key={`${item.child.id}-${c.competitionId}`}
                    to={`/app/competition?id=${c.competitionId}`}
                    onClick={() => {
                      setSelectedChildId(item.child.id)
                      onClose()
                    }}
                    className="block rounded-2xl border border-[#e4e7ec] px-4 py-3"
                  >
                    {tag(item)}
                    <p className="flex items-center gap-2 font-semibold text-text">
                      <IconTrophy size={16} className="text-[#d7a62a]" />
                      {c.name}
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">{formatDate(c.eventDate)}</p>
                    <p className="mt-2 text-sm text-text">
                      {c.rsvpStatus === 'PENDING'
                        ? 'Нужен ответ: участвуете или нет'
                        : c.rsvpStatus === 'CONFIRMED'
                          ? 'Вы ответили: участвуем'
                          : 'Вы отказались от участия'}
                    </p>
                  </Link>
                ))
              )}
            </Section>

        <Section title="Оплата занятий">
          {debts.length === 0 ? (
                <EmptyRow text="Все месяцы оплачены" />
              ) : (
                debts.map(({ item, p }) => {
                  const status = paymentStatusUi(p.status, p.dueDate)
                  return (
                    <Link
                      key={p.id}
                      to="/app/payments"
                      onClick={() => {
                        setSelectedChildId(item.child.id)
                        onClose()
                      }}
                      className="block rounded-2xl border border-[#e4e7ec] px-4 py-3"
                    >
                      {tag(item)}
                      <p className="font-semibold text-text">Не оплачено: {p.periodLabel}</p>
                      <p className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${status.className}`}>
                        {status.label}
                      </p>
                    </Link>
                  )
                })
              )}
            </Section>
          </>
        )}
      </div>
    </Dialog>
  )
}
