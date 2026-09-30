import { NavLink } from 'react-router-dom'
import { useParentChild } from '../../context/ParentChildContext'
import { IconPlus } from '../ui/Icons'

const imgHome = '/assets/parent/house.svg'
const imgUser = '/assets/parent/user.svg'
const imgFolder = '/assets/parent/folder.svg'
const imgTrophy = '/assets/parent/trophy.svg'

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

export function ParentMobileNav() {
  const { setAddChildOpen } = useParentChild()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] lg:hidden"
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
