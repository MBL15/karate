import { useEffect, useState } from 'react'
import { parentApi } from '../api/parent'
import type { Payment } from '../api/types'
import { ApiError } from '../api/client'
import { ChildAvatar } from '../components/parent/ChildAvatar'
import { ParentHero } from '../components/parent/ParentHero'
import { ParentPageShell } from '../components/parent/ParentPageShell'
import { ParentError, ParentLoading } from '../components/parent/ParentScreenState'
import { PARENT_CARD } from '../components/parent/parentUi'
import { IconCheck, IconX } from '../components/ui/Icons'
import { useParentChild } from '../context/ParentChildContext'
import { formatDate } from '../utils/format'

const LIST_CARD = 'divide-y divide-border-light overflow-hidden rounded-2xl border border-border-light bg-white shadow-[var(--shadow-card)]'

const unpaidCount = (list: Payment[]) => list.filter((p) => p.status !== 'PAID').length

function monthsLabel(n: number) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'месяц'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'месяца'
  return 'месяцев'
}

function MonthRow({ payment }: { payment: Payment }) {
  const paid = payment.status === 'PAID'
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
          paid ? 'bg-brand-green-light text-brand-green' : 'bg-error-bg text-error'
        }`}
      >
        {paid ? <IconCheck size={16} /> : <IconX size={16} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-text">{payment.periodLabel}</p>
        {paid && payment.paidDate && <p className="text-xs text-text-secondary">Тренер отметил {formatDate(payment.paidDate)}</p>}
      </div>
      <span className={`shrink-0 text-sm font-semibold ${paid ? 'text-brand-green' : 'text-error'}`}>
        {paid ? 'Оплачено' : 'Не оплачено'}
      </span>
    </li>
  )
}

function MonthList({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return <p className={`${PARENT_CARD} text-center text-sm text-text-secondary`}>Тренер ещё не отмечал оплату</p>
  }
  const sorted = [...payments].sort(
    (a, b) => Number(a.status === 'PAID') - Number(b.status === 'PAID') || b.dueDate.localeCompare(a.dueDate),
  )
  return (
    <ul className={LIST_CARD}>
      {sorted.map((p) => (
        <MonthRow key={p.id} payment={p} />
      ))}
    </ul>
  )
}

export function ParentPayments() {
  const { children, clubs, multiClub, loading: childrenLoading } = useParentChild()
  const [byChild, setByChild] = useState<Record<number, Payment[]>>({})
  const [filter, setFilter] = useState<number | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const key = children.map((c) => c.id).join(',')

  useEffect(() => {
    if (!key) {
      if (!childrenLoading) setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    setError(null)
    Promise.all(key.split(',').map(async (id) => [Number(id), await parentApi.payments(Number(id))] as const))
      .then((entries) => alive && setByChild(Object.fromEntries(entries)))
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : 'Не удалось загрузить оплаты'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [key, childrenLoading, attempt])

  const several = children.length > 1
  const scope = filter === 'all' || !several ? children : children.filter((c) => c.id === filter)
  const scoped = scope.flatMap((c) => byChild[c.id] ?? [])
  const unpaid = unpaidCount(scoped)
  const subtitle = several
    ? multiClub
      ? 'Отметки об оплате от тренеров клубов ваших детей'
      : 'Отметки тренера об оплате занятий'
    : 'Отметки тренера об оплате занятий'

  return (
    <ParentPageShell title="Оплата занятий" subtitle={subtitle} hero={<ParentHero title="Оплата занятий" subtitle={subtitle} />}>
      {loading ? (
        <ParentLoading />
      ) : error ? (
        <ParentError message={error} onRetry={() => setAttempt((n) => n + 1)} />
      ) : children.length === 0 ? (
        <p className={`${PARENT_CARD} text-center text-sm text-text-secondary`}>
          Добавьте ребёнка по коду от тренера — здесь появятся отметки об оплате занятий.
        </p>
      ) : (
        <div className="space-y-4">
          {several && (
            <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Чьи оплаты показать">
              {[{ id: 'all' as const, label: 'Все дети' }, ...children.map((c) => ({ id: c.id, label: c.firstName }))].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === opt.id}
                  onClick={() => setFilter(opt.id)}
                  className={`min-h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition ${
                    filter === opt.id ? 'bg-brand-green text-white' : 'bg-white text-text-secondary ring-1 ring-border-light'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {scoped.length > 0 && (
            <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${unpaid ? 'bg-error-bg' : 'bg-brand-green-light'}`}>
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-white ${unpaid ? 'text-error' : 'text-brand-green'}`}>
                {unpaid ? <IconX size={18} /> : <IconCheck size={18} />}
              </span>
              <div className="min-w-0">
                <p className={`font-bold ${unpaid ? 'text-error' : 'text-brand-green'}`}>
                  {unpaid ? `Не оплачено: ${unpaid} ${monthsLabel(unpaid)}` : 'Всё оплачено'}
                </p>
                <p className="text-xs text-text-secondary">
                  {unpaid ? 'Тренер отметит оплату, когда получит её' : 'Тренер отметил оплату за все месяцы'}
                </p>
              </div>
            </div>
          )}

          {several && scope.length > 1 ? (
            scope.map((child) => {
              const list = byChild[child.id] ?? []
              const childUnpaid = unpaidCount(list)
              return (
                <section key={child.id} className="space-y-2">
                  <div className="flex items-center gap-3 px-1">
                    <ChildAvatar childId={child.id} name={`${child.firstName} ${child.lastName}`} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-text">{child.firstName}</p>
                      {clubs[child.id] && <p className="truncate text-xs text-text-secondary">{clubs[child.id]}</p>}
                    </div>
                    {list.length > 0 && (
                      <span className={`shrink-0 text-xs font-semibold ${childUnpaid ? 'text-error' : 'text-brand-green'}`}>
                        {childUnpaid ? `не оплачено ${childUnpaid}` : 'всё оплачено'}
                      </span>
                    )}
                  </div>
                  <MonthList payments={list} />
                </section>
              )
            })
          ) : (
            <MonthList payments={scoped} />
          )}

          <p className="px-1 text-xs leading-relaxed text-text-muted">
            Это отметки тренера, чтобы никто не забыл про оплату. Оплатить занятия прямо в приложении можно будет позже.
          </p>
        </div>
      )}
    </ParentPageShell>
  )
}
