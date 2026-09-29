import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useParentChild } from '../../context/ParentChildContext'
import { childShortName } from '../../utils/format'
import { BrandMark } from '../ui/BrandMark'
import { IconPlus } from '../ui/Icons'

const imgHome = '/assets/parent/house.svg'
const imgUser = '/assets/parent/user.svg'
const imgAward = '/assets/parent/award.svg'
const imgTrophy = '/assets/parent/trophy.svg'
const imgFolder = '/assets/parent/folder.svg'
const imgAvatar = '/assets/parent/avatar.svg'

const items = [
  { to: '/app', label: 'Главная', icon: imgHome, end: true },
  { to: '/app/profile', label: 'Профиль', icon: imgUser },
  { to: '/app/achievements', label: 'Награды', icon: imgAward },
  { to: '/app/competition', label: 'Соревнования', icon: imgTrophy },
  { to: '/app/history', label: 'Архив', icon: imgFolder },
]

export function ParentSidebar() {
  const { user } = useAuth()
  const { children, selectedChildId, setSelectedChildId, setAddChildOpen } = useParentChild()

  return (
    <aside className="gradient-app-sidebar hidden w-64 shrink-0 flex-col px-4 py-6 lg:flex">
      <BrandMark variant="parent" size="md" showLabel />

      <div className="mt-8">
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-text-on-dark">Ваши дети</p>
        {children.length >= 2 ? (
          <p className="mt-2 px-3 text-xs leading-relaxed text-white/70">
            Выберите ребёнка — обновятся профиль и награды
          </p>
        ) : (
          <p className="mt-2 px-3 text-xs leading-relaxed text-white/70">
            Добавьте ребёнка, чтобы вести дневник
          </p>
        )}
        <ul className="mt-2 space-y-1" aria-label="Ваши дети">
          {children.map((child) => (
            <li key={child.id}>
              <button
                type="button"
                onClick={() => setSelectedChildId(child.id)}
                aria-pressed={selectedChildId === child.id}
                className={`min-h-11 w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  selectedChildId === child.id
                    ? 'bg-white/15 font-semibold text-white'
                    : 'text-text-on-dark hover:bg-white/8 hover:text-white'
                }`}
              >
                {childShortName(child.firstName, child.age)} · {child.beltName}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setAddChildOpen(true)}
          className="mt-2 flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-text-on-dark transition hover:bg-white/8 hover:text-white"
        >
          <IconPlus size={16} />
          Добавить ребёнка
        </button>
      </div>

      <nav className="mt-8 space-y-1" aria-label="Разделы дневника">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-white/15 font-semibold text-white shadow-sm'
                  : 'text-text-on-dark hover:bg-white/8 hover:text-white'
              }`
            }
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-white/10">
              <img src={item.icon} alt="" aria-hidden="true" className="size-[18px] brightness-0 invert" />
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-3 rounded-xl bg-white/8 p-3">
        <img src={imgAvatar} alt="" className="size-10 rounded-full ring-2 ring-white/20" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
          <p className="text-xs text-text-on-dark">Родитель</p>
        </div>
      </div>
    </aside>
  )
}
