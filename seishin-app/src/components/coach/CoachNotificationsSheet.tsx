import { useId } from 'react'
import { Link } from 'react-router-dom'
import { useCoachNotifications } from '../../context/CoachNotificationsContext'
import { Dialog } from '../a11y/Dialog'
import { IconUsers, IconX } from '../ui/Icons'

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function CoachNotificationsSheet() {
  const titleId = useId()
  const { sheetOpen, closeSheet, items, loading, unreadCount, markRead, markAllRead } = useCoachNotifications()

  return (
    <Dialog open={sheetOpen} titleId={titleId} onClose={closeSheet}>
      <div className="max-h-[85vh] overflow-y-auto rounded-[1.75rem] bg-white p-5 shadow-[var(--shadow-elevated)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-xl font-bold tracking-tight text-text">
              Уведомления
            </h2>
            <p className="mt-0.5 text-xs text-text-secondary">
              {unreadCount ? `Непрочитанных: ${unreadCount}` : 'Всё просмотрено'}
            </p>
          </div>
          <button
            type="button"
            onClick={closeSheet}
            aria-label="Закрыть"
            className="flex size-10 items-center justify-center rounded-full text-text-secondary hover:bg-surface-muted"
          >
            <IconX size={18} />
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="mt-3 text-sm font-semibold text-brand-blue"
          >
            Отметить всё прочитанным
          </button>
        )}

        <ul className="mt-4 space-y-2">
          {loading && items.length === 0 ? (
            <li className="rounded-2xl bg-surface-muted px-4 py-3 text-sm text-text-secondary">Загружаем…</li>
          ) : items.length === 0 ? (
            <li className="rounded-2xl bg-surface-muted px-4 py-3 text-sm text-text-secondary">
              Пока пусто. Пришлём push, когда ученик попадёт в группу.
            </li>
          ) : (
            items.map((n) => {
              const unread = !n.readAt
              const href =
                n.studentId != null
                  ? `/coach/students?student=${n.studentId}${n.groupId != null ? `&group=${n.groupId}` : ''}`
                  : n.groupId != null
                    ? `/coach/students?group=${n.groupId}`
                    : '/coach/students'
              return (
                <li key={n.id}>
                  <Link
                    to={href}
                    onClick={() => {
                      if (unread) void markRead(n.id)
                      closeSheet()
                    }}
                    className={`block rounded-2xl border px-4 py-3 transition hover:bg-surface-muted ${
                      unread ? 'border-brand-blue/25 bg-brand-blue-light/40' : 'border-border-light bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                          unread ? 'bg-brand-blue text-white' : 'bg-surface-muted text-text-secondary'
                        }`}
                        aria-hidden
                      >
                        <IconUsers size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-text">{n.title}</p>
                        <p className="mt-0.5 text-sm text-text-secondary">{n.body}</p>
                        <p className="mt-1 text-[11px] text-text-muted">{formatWhen(n.createdAt)}</p>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </Dialog>
  )
}
