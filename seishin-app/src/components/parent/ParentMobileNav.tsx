import { NavLink, useNavigate } from 'react-router-dom'
import { useParentChild } from '../../context/ParentChildContext'
import { IconCalendar, IconPlus, IconUser, IconUsers } from '../ui/Icons'

const imgHome = '/assets/parent/house.svg'
const imgUser = '/assets/parent/user.svg'
const imgFolder = '/assets/parent/folder.svg'
const imgTrophy = '/assets/parent/trophy.svg'

const parentGreen = '#1fa971'
const parentMuted = '#667085'
const parentIconMuted = '#98a2b3'

type Tab = {
  to: string
  label: string
  icon: string
  end?: boolean
}

const tabs: Tab[] = [
  { to: '/app', label: 'Главная', icon: imgHome, end: true },
  { to: '/app/history', label: 'Посещения', icon: imgFolder },
  { to: '/app/competition', label: 'Турниры', icon: imgTrophy },
  { to: '/app/profile', label: 'Профиль', icon: imgUser },
]

type OnboardingIcon = 'home' | 'children' | 'events' | 'profile'

const greenIconFilter =
  'invert(48%) sepia(79%) saturate(425%) hue-rotate(115deg) brightness(92%) contrast(89%)'

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
    <NavLink
      to={tab.to}
      end={tab.end}
      className={({ isActive }) =>
        `flex h-full w-full flex-col items-center justify-center gap-1.5 transition-colors ${
          isActive ? 'text-brand-green' : 'text-text-muted'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className="flex size-6 items-center justify-center">
            <img
              src={tab.icon}
              alt=""
              className={`size-[1.125rem] transition-opacity ${isActive ? 'opacity-100' : 'opacity-55'}`}
              style={
                isActive
                  ? { filter: 'invert(55%) sepia(65%) saturate(500%) hue-rotate(5deg) brightness(95%)' }
                  : undefined
              }
            />
          </span>
          <span className={`text-center text-[10px] leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
            {tab.label}
          </span>
        </>
      )}
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
  const { setAddChildOpen } = useParentChild()
  const navigate = useNavigate()

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
      <div className="relative mx-auto max-w-sm">
        <div className="rounded-[2rem] border border-border/90 bg-surface px-1 py-2.5 shadow-[0_4px_24px_rgb(18_24_32_/_0.1)]">
          <div className="grid min-h-[3.75rem] grid-cols-5 items-center">
            <ParentTab tab={tabs[0]} />
            <ParentTab tab={tabs[1]} />
            <button
              type="button"
              onClick={() => setAddChildOpen(true)}
              aria-label="Добавить ребёнка"
              className="flex h-full w-full flex-col items-center justify-center gap-1.5 transition-transform active:scale-95"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-brand-green text-navy-950 shadow-[0_2px_8px_rgb(18_24_32_/_0.15)]">
                <IconPlus size={20} />
              </span>
              <span className="text-[10px] font-medium leading-none text-text-muted">Добавить</span>
            </button>
            <ParentTab tab={tabs[2]} />
            <ParentTab tab={tabs[3]} />
          </div>
        </div>
      </div>
    </nav>
  )
}
