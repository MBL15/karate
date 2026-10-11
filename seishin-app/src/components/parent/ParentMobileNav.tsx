import type { ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useParentChild } from '../../context/ParentChildContext'
import { IconActivity, IconCalendar, IconHouse, IconPlus, IconTrophy, IconUser, IconUsers } from '../ui/Icons'
import { GlassTabBar } from '../ui/GlassTabBar'

const imgHome = '/assets/parent/house.svg'

const parentGreen = '#16a34a'
const parentMuted = '#667085'
const parentIconMuted = '#98a2b3'

type Tab = {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
}

const tabs: Tab[] = [
  { to: '/app', label: 'Главная', icon: <IconHouse size={20} />, end: true },
  { to: '/app/athlete', label: 'Спортсмен', icon: <IconActivity size={20} /> },
  { to: '/app/competition', label: 'События', icon: <IconTrophy size={20} /> },
  { to: '/app/profile', label: 'Профиль', icon: <IconUser size={20} /> },
]

type OnboardingIcon = 'home' | 'children' | 'events' | 'profile'

const greenIconFilter =
  'invert(48%) sepia(79%) saturate(425%) hue-rotate(115deg) brightness(92%) contrast(89%)'

function activeTabIndex(pathname: string, addOpen: boolean) {
  if (addOpen) return 2
  if (pathname.startsWith('/app/profile') || pathname.startsWith('/app/payments')) return 4
  if (pathname.startsWith('/app/competition')) return 3
  if (pathname.startsWith('/app/athlete')) return 1
  return 0
}

const itemClass =
  'flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 px-0.5 pt-1 text-text-muted outline-none'

function ItemBody({ icon, label, active }: { icon: ReactNode; label: string; active: boolean }) {
  return (
    <>
      <span className="glass-icon flex size-7 items-center justify-center">{icon}</span>
      <span
        className={`w-full truncate text-center text-[10px] leading-none transition-colors ${
          active ? 'font-semibold text-brand-green' : 'font-medium'
        }`}
      >
        {label}
      </span>
    </>
  )
}

function OnboardingIconGlyph({ kind, color, active }: { kind: OnboardingIcon; color: string; active?: boolean }) {
  const props = { size: 22, className: 'shrink-0', style: { color } as const }
  switch (kind) {
    case 'home':
      return (
        <img
          src={imgHome}
          alt=""
          className="size-[22px] opacity-90"
          style={active ? { filter: greenIconFilter } : { opacity: 0.45 }}
        />
      )
    case 'children':
      return <IconUsers {...props} />
    case 'events':
      return <IconCalendar {...props} />
    case 'profile':
      return <IconUser {...props} />
  }
}

function OnboardingNavContent({
  label,
  icon,
  active,
}: {
  label: string
  icon: OnboardingIcon
  active: boolean
}) {
  const iconColor = active ? parentGreen : parentIconMuted
  const labelColor = active ? parentGreen : parentMuted

  return (
    <>
      <span className="flex size-6 items-center justify-center">
        <OnboardingIconGlyph kind={icon} color={iconColor} active={active} />
      </span>
      <span
        className={`text-center text-[11px] leading-none ${active ? 'font-semibold' : 'font-medium'}`}
        style={{ color: labelColor }}
      >
        {label}
      </span>
    </>
  )
}

function ParentTab({ tab }: { tab: Tab }) {
  return (
    <NavLink to={tab.to} end={tab.end} className={itemClass}>
      {({ isActive }) => <ItemBody icon={tab.icon} label={tab.label} active={isActive} />}
    </NavLink>
  )
}

export function ParentMobileNav({
  always = false,
  variant = 'default',
}: {
  always?: boolean
  variant?: 'default' | 'onboarding'
}) {
  const { setAddChildOpen, addChildOpen } = useParentChild()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const activeIndex = activeTabIndex(pathname, addChildOpen)

  if (variant === 'onboarding') {
    return (
      <nav
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-[#e4e7ec] bg-white pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-1 ${always ? '' : 'lg:hidden'}`}
        aria-label="Разделы приложения"
      >
        <div className="mx-auto grid h-[4.25rem] max-w-lg grid-cols-4 items-center px-2">
          <NavLink to="/app" end className="flex h-full flex-col items-center justify-center gap-1">
            {({ isActive }) => <OnboardingNavContent label="Главная" icon="home" active={isActive} />}
          </NavLink>
          <button
            type="button"
            onClick={() => navigate('/app?link=1')}
            className="flex h-full flex-col items-center justify-center gap-1"
          >
            <OnboardingNavContent label="Мои дети" icon="children" active={false} />
          </button>
          <NavLink to="/app/competition" className="flex h-full flex-col items-center justify-center gap-1">
            {({ isActive }) => <OnboardingNavContent label="События" icon="events" active={isActive} />}
          </NavLink>
          <NavLink to="/app/profile" className="flex h-full flex-col items-center justify-center gap-1">
            {({ isActive }) => <OnboardingNavContent label="Профиль" icon="profile" active={isActive} />}
          </NavLink>
        </div>
      </nav>
    )
  }

  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] ${always ? '' : 'lg:hidden'}`}
      aria-label="Разделы дневника"
    >
      <div className="mx-auto max-w-sm">
        <GlassTabBar
          tone="parent"
          label="Разделы дневника"
          activeIndex={activeIndex}
          items={[
            <ParentTab key="home" tab={tabs[0]} />,
            <ParentTab key="history" tab={tabs[1]} />,
            <button
              key="add"
              type="button"
              onClick={() => setAddChildOpen(true)}
              aria-expanded={addChildOpen}
              aria-label="Добавить ребёнка"
              className={itemClass}
            >
              <ItemBody
                active={addChildOpen}
                label="Добавить"
                icon={
                  <span className="flex size-6 items-center justify-center rounded-full bg-brand-green text-white">
                    <IconPlus size={14} />
                  </span>
                }
              />
            </button>,
            <ParentTab key="competition" tab={tabs[2]} />,
            <ParentTab key="profile" tab={tabs[3]} />,
          ]}
        />
      </div>
    </nav>
  )
}
