import { Link, NavLink } from 'react-router-dom'
import { BrandMark } from '../ui/BrandMark'
import { LoginRoleMenu } from './LoginRoleMenu'

const links = [
  { to: '/', label: 'Главная', end: true },
  { to: '/for-parents', label: 'Родителям' },
  { to: '/for-coaches', label: 'Тренерам' },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/98 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" aria-label="Karate Hub, на главную">
            <BrandMark variant="site" size="md" showLabel />
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Разделы сайта">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-brand-green-light text-brand-green' : 'text-text-secondary hover:text-text'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/register" className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-subtle hover:text-text sm:inline-flex">
              Регистрация
            </Link>
            <LoginRoleMenu />
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t border-border-light py-2 md:hidden" aria-label="Разделы сайта">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `shrink-0 rounded-xl px-4 py-2 text-sm font-medium ${
                  isActive ? 'bg-brand-green-light text-brand-green' : 'text-text-secondary'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
