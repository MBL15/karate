import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { IconPlus, IconTrophy, IconUser, IconUsers } from '../ui/Icons'

const imgGrid = '/assets/coach/grid.svg'
const imgUsers = '/assets/coach/users.svg'
const imgCalendar = '/assets/coach/calendar.svg'

type Tab = {
  to: string
  label: string
  icon: string
  end?: boolean
}

const tabs: Tab[] = [
  { to: '/coach', label: 'Главная', icon: imgGrid, end: true },
  { to: '/coach/students', label: 'База', icon: imgUsers },
  { to: '/coach/schedule', label: 'Занятия', icon: imgCalendar },
]

const addActions = [
  {
    id: 'student' as const,
    label: 'Ученика',
    description: 'Добавить в группу',
    icon: IconUser,
  },
  {
    id: 'group' as const,
    label: 'Группу',
    description: 'Новая группа занятий',
    icon: IconUsers,
  },
  {
    id: 'competition' as const,
    label: 'Соревнование',
    description: 'Турнир в календаре',
    icon: IconTrophy,
  },
]

function CoachTab({ tab }: { tab: Tab }) {
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

function SecretTab() {
  return (
    <NavLink
      to="/coach/secret"
      className={({ isActive }) =>
        `flex h-full w-full flex-col items-center justify-center gap-1.5 transition-colors ${
          isActive ? 'text-brand-green' : 'text-text-muted/60'
        }`
      }
      aria-label="Секретный раздел"
    >
      {({ isActive }) => (
        <>
          <span
            className={`flex size-6 items-center justify-center text-sm font-semibold leading-none ${
              isActive ? 'text-brand-green' : 'text-text-muted/70'
            }`}
          >
            ?
          </span>
          <span className="text-[10px] font-medium leading-none opacity-0" aria-hidden>
            ·
          </span>
        </>
      )}
    </NavLink>
  )
}

export function CoachMobileNav() {
  const navigate = useNavigate()
  const [addOpen, setAddOpen] = useState(false)

  const openAdd = (type: 'student' | 'group' | 'competition') => {
    setAddOpen(false)
    if (type === 'student') navigate('/coach/students?add=student')
    else if (type === 'group') navigate('/coach/students?add=group')
    else navigate('/coach/competitions?add=competition')
  }

  return (
    <>
      {addOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-navy-950/45 lg:hidden"
          aria-label="Закрыть меню добавления"
          onClick={() => setAddOpen(false)}
        />
      )}

      {addOpen && (
        <div
          role="menu"
          aria-label="Что добавить"
          className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-50 overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-elevated)] lg:hidden"
        >
          <p className="border-b border-border-light px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
            Что добавить?
          </p>
          <div className="p-2">
            {addActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.id}
                  type="button"
                  role="menuitem"
                  onClick={() => openAdd(action.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-surface-muted active:scale-[0.99]"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-green-light text-brand-green">
                    <Icon size={20} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-text">{action.label}</span>
                    <span className="block text-xs text-text-secondary">{action.description}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] lg:hidden"
        aria-label="Разделы кабинета"
      >
        <div className="relative mx-auto max-w-sm">
          <div className="rounded-[2rem] border border-border/90 bg-surface px-1 py-2.5 shadow-[0_4px_24px_rgb(18_24_32_/_0.1)]">
            <div className="grid min-h-[3.75rem] grid-cols-5 items-center">
              <CoachTab tab={tabs[0]} />
              <CoachTab tab={tabs[1]} />
              <button
                type="button"
                onClick={() => setAddOpen((open) => !open)}
                aria-expanded={addOpen}
                aria-haspopup="menu"
                aria-label={addOpen ? 'Закрыть меню добавления' : 'Добавить'}
                className="flex h-full w-full flex-col items-center justify-center gap-1.5 transition-transform active:scale-95"
              >
                <span
                  className={`flex size-9 items-center justify-center rounded-full bg-brand-green text-navy-950 shadow-[0_2px_8px_rgb(18_24_32_/_0.15)] transition-transform ${
                    addOpen ? 'rotate-45' : ''
                  }`}
                >
                  <IconPlus size={20} />
                </span>
                <span className="text-[10px] font-medium leading-none text-text-muted">Добавить</span>
              </button>
              <CoachTab tab={tabs[2]} />
              <SecretTab />
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
