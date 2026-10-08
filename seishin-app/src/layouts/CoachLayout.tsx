import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { SkipLink } from '../components/a11y/SkipLink'
import { LogoutButton } from '../components/auth/LogoutButton'
import { CoachCreateSheet } from '../components/coach/CoachCreateSheet'
import { CoachMobileNav } from '../components/coach/CoachMobileNav'
import { CoachSidebar } from '../components/coach/CoachSidebar'
import { BrandMark } from '../components/ui/BrandMark'
import { useAuth } from '../context/AuthContext'

export function CoachLayout() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const isSecretPage = pathname.endsWith('/secret')
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="coach-app-canvas min-h-screen">
      <SkipLink />
      <header className="sticky top-0 z-40 hidden border-b border-white/10 bg-navy-950 lg:block">
        <div className="flex h-16 items-center justify-between px-5 lg:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="Karate Hub, на главную">
            <BrandMark variant="coach" size="sm" />
            <span className="text-sm font-semibold text-white">Кабинет тренера</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-white/80">Главный тренер</p>
            </div>
            <LogoutButton variant="header" />
          </div>
        </div>
      </header>

      <div className={`flex min-h-screen lg:min-h-[calc(100vh-4rem)]`}>
        <CoachSidebar onCreate={() => setCreateOpen(true)} />
        <main
          id="main-content"
          tabIndex={-1}
          className={`flex-1 overflow-x-hidden overflow-y-auto pb-40 outline-none lg:pb-0 ${
            isSecretPage ? 'bg-[#f5f4f1]' : 'coach-app-canvas'
          }`}
        >
          <div key={pathname} className="page-transition">
            <Outlet />
          </div>
        </main>
      </div>

      <CoachMobileNav createOpen={createOpen} onToggleCreate={() => setCreateOpen((open) => !open)} />
      <CoachCreateSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
