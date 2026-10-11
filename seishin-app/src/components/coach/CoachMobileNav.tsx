import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { IconHouse, IconPlus, IconSparkles, IconUsers } from '../ui/Icons'
import { GlassTabBar } from '../ui/GlassTabBar'

type Tab = {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
}

const tabs: Tab[] = [
  { to: '/coach', label: 'Главная', icon: <IconHouse size={20} />, end: true },
  { to: '/coach/students', label: 'База', icon: <IconUsers size={20} /> },
  { to: '/coach/tools', label: 'Инструменты', icon: <IconSparkles size={20} /> },
]

function activeTabIndex(pathname: string, createOpen: boolean) {
  if (createOpen) return 2
  if (pathname.endsWith('/secret')) return 4
  if (['/coach/tools', '/coach/schedule', '/coach/competitions', '/coach/awards'].some((p) => pathname.startsWith(p))) return 3
  if (pathname.startsWith('/coach/students') || pathname.startsWith('/coach/attendance')) return 1
  return 0
}

const itemClass =
  'flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 px-0.5 pt-1 text-text-muted outline-none'

function ItemBody({ icon, label, active }: { icon: ReactNode; label: ReactNode; active: boolean }) {
  return (
    <>
      <span className="glass-icon flex size-7 items-center justify-center">{icon}</span>
      <span
        className={`w-full truncate text-center text-[10px] leading-none transition-colors ${
          active ? 'font-semibold text-brand-blue' : 'font-medium'
        }`}
      >
        {label}
      </span>
    </>
  )
}

function CoachTab({ tab }: { tab: Tab }) {
  return (
    <NavLink to={tab.to} end={tab.end} className={itemClass}>
      {({ isActive }) => <ItemBody icon={tab.icon} label={tab.label} active={isActive} />}
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

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] lg:hidden"
      aria-label="Разделы кабинета"
    >
      <div className="mx-auto max-w-sm">
        <GlassTabBar
          tone="coach"
          label="Разделы кабинета"
          activeIndex={activeIndex}
          items={[
            <CoachTab key="home" tab={tabs[0]} />,
            <CoachTab key="students" tab={tabs[1]} />,
            <button
              key="create"
              type="button"
              onClick={onToggleCreate}
              aria-expanded={createOpen}
              aria-haspopup="dialog"
              aria-label={createOpen ? 'Закрыть меню создания' : 'Создать'}
              className={itemClass}
            >
              <ItemBody
                active={createOpen}
                label="Создать"
                icon={
                  <span className="flex size-6 items-center justify-center rounded-full bg-brand-blue text-white">
                    <IconPlus size={14} />
                  </span>
                }
              />
            </button>,
            <CoachTab key="tools" tab={tabs[2]} />,
            <NavLink key="secret" to="/coach/secret" className={itemClass}>
              {({ isActive }) => (
                <ItemBody
                  active={isActive}
                  icon={<span className="text-base font-semibold leading-none">?</span>}
                  label="Скоро"
                />
              )}
            </NavLink>,
          ]}
        />
      </div>
    </nav>
  )
}
