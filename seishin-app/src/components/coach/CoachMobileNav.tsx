import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { IconHouse, IconPlus, IconSparkles, IconUsers } from '../ui/Icons'

const accentRed = '#ff4d4f'

type Tab = {
  to: string
  label: string
  icon: 'home' | 'users' | 'tools'
  end?: boolean
}

const tabs: Tab[] = [
  { to: '/coach', label: 'Главная', icon: 'home', end: true },
  { to: '/coach/students', label: 'База', icon: 'users' },
  { to: '/coach/tools', label: 'Инструменты', icon: 'tools' },
]

function activeTabIndex(pathname: string, createOpen: boolean) {
  if (createOpen) return 2
  if (pathname.endsWith('/secret')) return 4
  if (pathname.startsWith('/coach/tools')) return 3
  if (pathname.startsWith('/coach/students')) return 1
  if (pathname === '/coach') return 0
  return 0
}

function ActiveTabFrame({ index, pulse }: { index: number; pulse: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] grid grid-cols-5" aria-hidden>
      <div className="relative px-1 py-0.5" style={{ gridColumn: index + 1 }}>
        <svg
          className="absolute inset-0 size-full overflow-visible"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <rect
            key={`${index}-${pulse}`}
            className="coach-tab-frame-stroke"
            x="2.2"
            y="2.2"
            width="95.6"
            height="95.6"
            rx="16"
            ry="16"
            fill="#ffffff"
            stroke={accentRed}
            strokeWidth="2.75"
            vectorEffect="nonScalingStroke"
            pathLength={100}
            strokeDasharray={100}
            strokeDashoffset={100}
          />
        </svg>
      </div>
    </div>
  )
}

function TabIcon({ icon, active }: { icon: Tab['icon']; active: boolean }) {
  const common = {
    size: 22,
    className: active ? 'text-[#c4a035]' : 'text-text-muted',
  }
  if (icon === 'home') return <IconHouse {...common} />
  if (icon === 'users') return <IconUsers {...common} />
  return <IconSparkles {...common} />
}

function NavItemBody({
  active,
  icon,
  label,
}: {
  active: boolean
  icon: ReactNode
  label: ReactNode
}) {
  return (
    <span className="flex w-full max-w-[4.25rem] flex-col items-center justify-center gap-1">
      <span className="flex size-6 shrink-0 items-center justify-center">{icon}</span>
      <span
        className={`w-full text-center text-[9px] leading-[1.15] tracking-tight ${
          active ? 'font-bold' : 'font-medium'
        }`}
      >
        {label}
      </span>
    </span>
  )
}

const navItemClass =
  'relative z-10 flex h-full w-full flex-col items-center justify-center px-0.5 py-1 transition-colors duration-300'

function CoachTab({ tab, slotActive }: { tab: Tab; slotActive: boolean }) {
  return (
    <NavLink
      to={tab.to}
      end={tab.end}
      className={({ isActive }) => {
        const highlighted = isActive || slotActive
        return `${navItemClass} ${highlighted ? 'text-[#c4a035]' : 'text-text-muted'}`
      }}
    >
      {({ isActive }) => {
        const highlighted = isActive || slotActive
        return (
          <NavItemBody
            active={highlighted}
            icon={<TabIcon icon={tab.icon} active={highlighted} />}
            label={tab.label}
          />
        )
      }}
    </NavLink>
  )
}

export function CoachMobileNav({
  createOpen,
  onToggleCreate,
}: {
  createOpen: boolean
  onToggleCreate: () => void
}) {
  const { pathname } = useLocation()
  const activeIndex = activeTabIndex(pathname, createOpen)
  const [framePulse, setFramePulse] = useState(0)

  useEffect(() => {
    setFramePulse((n) => n + 1)
  }, [activeIndex])

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] lg:hidden"
      aria-label="Разделы кабинета"
    >
      <div className="relative mx-auto max-w-sm">
        <div className="relative overflow-visible rounded-[2rem] border border-[#ebe6dc] bg-white px-0.5 pb-2.5 pt-1.5 shadow-[0_8px_28px_rgb(18_24_32_/_0.08)]">
          <div className="relative min-h-[4.25rem]">
            <ActiveTabFrame index={activeIndex} pulse={framePulse} />
            <div className="relative z-10 grid h-full min-h-[4.25rem] grid-cols-5 items-center">
              <CoachTab tab={tabs[0]} slotActive={activeIndex === 0} />
              <CoachTab tab={tabs[1]} slotActive={activeIndex === 1} />
              <button
                type="button"
                onClick={onToggleCreate}
                aria-expanded={createOpen}
                aria-haspopup="dialog"
                aria-label={createOpen ? 'Закрыть меню создания' : 'Создать'}
                className={`${navItemClass} active:scale-95`}
              >
                <NavItemBody
                  active={createOpen || activeIndex === 2}
                  icon={
                    <span
                      className={`flex size-8 items-center justify-center rounded-full bg-[#f5c518] text-navy-950 shadow-[0_2px_8px_rgb(245_197_24_/_0.45)] transition-transform ${
                        createOpen ? 'rotate-45' : ''
                      }`}
                    >
                      <IconPlus size={18} />
                    </span>
                  }
                  label="Создать"
                />
              </button>
              <CoachTab tab={tabs[2]} slotActive={activeIndex === 3} />
              <NavLink
                to="/coach/secret"
                className={({ isActive }) => {
                  const highlighted = isActive || activeIndex === 4
                  return `${navItemClass} ${highlighted ? 'text-[#c4a035]' : 'text-text-muted/60'}`
                }}
                aria-label="Секретный раздел"
              >
                {({ isActive }) => (
                  <NavItemBody
                    active={isActive || activeIndex === 4}
                    icon={
                      <span
                        className={`flex size-6 items-center justify-center text-sm font-semibold leading-none ${
                          isActive ? 'text-[#c4a035]' : 'text-text-muted/70'
                        }`}
                      >
                        ?
                      </span>
                    }
                    label={<span className="opacity-0 select-none" aria-hidden>·</span>}
                  />
                )}
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
