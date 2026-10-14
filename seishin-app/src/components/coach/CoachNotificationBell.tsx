import { IconBell } from '../ui/Icons'
import { useCoachNotifications } from '../../context/CoachNotificationsContext'

export function CoachNotificationBell({ className = '' }: { className?: string }) {
  const { unreadCount, openSheet } = useCoachNotifications()
  return (
    <button
      type="button"
      onClick={openSheet}
      aria-label={unreadCount ? `Уведомления: ${unreadCount} новых` : 'Уведомления'}
      className={`relative flex size-11 shrink-0 items-center justify-center rounded-full transition active:scale-95 ${className}`}
    >
      <IconBell size={22} />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 flex min-w-[18px] items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold leading-[18px] text-white ring-2 ring-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  )
}
