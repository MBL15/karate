import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { coachApi } from '../../api/coach'
import type { GroupSummary } from '../../api/types'
import { useAuth } from '../../context/AuthContext'
import { BrandMark } from '../ui/BrandMark'
import { IconPlus } from '../ui/Icons'

const imgGrid = '/assets/coach/grid.svg'
const imgUsers = '/assets/coach/users.svg'
const imgCalendar = '/assets/coach/calendar.svg'
const imgAward = '/assets/coach/award.svg'
const imgTrophy = '/assets/coach/trophy.svg'
const imgAvatar = '/assets/coach/avatar-coach.svg'

const items = [
  { to: '/coach', label: 'Главная', icon: imgGrid, end: true },
  { to: '/coach/students', label: 'Ученики', icon: imgUsers },
  { to: '/coach/schedule', label: 'Занятия', icon: imgCalendar },
  { to: '/coach/awards', label: 'Награды', icon: imgAward },
  { to: '/coach/competitions', label: 'Соревнования', icon: imgTrophy },
]

export function CoachSidebar() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<GroupSummary[]>([])

  useEffect(() => {
    coachApi.groups().then(setGroups).catch(() => setGroups([]))
  }, [])

  return (
    <aside className="gradient-app-sidebar hidden w-64 shrink-0 flex-col px-4 py-6 lg:flex">
      <BrandMark variant="coach" size="md" showLabel />

      <div className="mt-8">
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-text-on-dark">Ваши группы</p>
        <ul className="mt-2 space-y-1">
          {groups.map((group) => (
            <li key={group.id}>
              <Link
                to="/coach/students"
                className="block min-h-11 w-full rounded-xl px-3 py-2.5 text-left text-sm text-text-on-dark transition hover:bg-white/8 hover:text-white"
              >
                {group.name} · {group.studentCount} уч.
              </Link>
            </li>
          ))}
        </ul>
        <Link
          to="/coach/students"
          className="mt-2 flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-text-on-dark transition hover:bg-white/8 hover:text-white"
        >
          <IconPlus size={16} />
          Добавить ученика
        </Link>
      </div>

      <nav className="mt-8 space-y-1" aria-label="Разделы кабинета">
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
          <p className="text-xs text-text-on-dark">Главный тренер</p>
        </div>
      </div>
    </aside>
  )
}
