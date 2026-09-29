import { NavLink } from 'react-router-dom'
import { IconAward, IconFolder, IconHome, IconUser } from '../ui/Icons'

const items = [
  { to: '/app', label: 'Главная', icon: IconHome, end: true },
  { to: '/app/profile', label: 'Профиль', icon: IconUser },
  { to: '/app/achievements', label: 'Награды', icon: IconAward },
  { to: '/app/history', label: 'Архив', icon: IconFolder },
]

export function ParentBottomNav() {
  return (
    <nav className="flex h-[86px] shrink-0 items-start justify-around border-t border-border-light bg-surface px-2 pb-8 pt-3 shadow-[var(--shadow-nav)]">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1.5 px-4 transition ${
              isActive ? 'text-brand-green' : 'text-text-muted hover:text-text-secondary'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className="relative">
                <item.icon size={22} />
                {isActive && (
                  <span className="absolute -bottom-2 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brand-green" />
                )}
              </span>
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
