import { NavLink } from 'react-router-dom'

export type BottomTab = {
  to: string
  label: string
  icon: string
  end?: boolean
}

type BottomTabNavProps = {
  tabs: BottomTab[]
  accent: 'coach' | 'parent'
  label: string
}

export function BottomTabNav({ tabs, accent, label }: BottomTabNavProps) {
  const activeClass = accent === 'coach' ? 'text-brand-blue' : 'text-brand-green'
  const activeBg = accent === 'coach' ? 'bg-brand-blue-light' : 'bg-brand-green-light'
  const activeDot = accent === 'coach' ? 'bg-brand-blue' : 'bg-brand-green'

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border-light bg-white/95 shadow-[0_-4px_24px_rgba(15,23,42,0.08)] backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
      aria-label={label}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-0.5 pt-1">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-2 transition-colors ${
                isActive ? activeClass : 'text-text-muted hover:text-text-secondary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex size-9 items-center justify-center rounded-2xl transition-all duration-200 ${
                    isActive ? `${activeBg} scale-105` : 'bg-transparent'
                  }`}
                >
                  <img
                    src={tab.icon}
                    alt=""
                    className={`size-[21px] transition-opacity ${isActive ? 'opacity-100' : 'opacity-40'}`}
                    style={
                      isActive
                        ? accent === 'coach'
                          ? { filter: 'invert(32%) sepia(85%) saturate(1200%) hue-rotate(196deg) brightness(95%)' }
                          : { filter: 'invert(42%) sepia(60%) saturate(600%) hue-rotate(100deg) brightness(95%)' }
                        : undefined
                    }
                  />
                </span>
                <span
                  className={`max-w-full truncate text-[11px] leading-tight ${
                    isActive ? 'font-bold' : 'font-medium'
                  }`}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <span aria-hidden="true" className={`absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full ${activeDot}`} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
