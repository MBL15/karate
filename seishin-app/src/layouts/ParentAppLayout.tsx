import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { SkipLink } from '../components/a11y/SkipLink'
import { AddChildModal } from '../components/parent/AddChildModal'

import { ParentMobileNav } from '../components/parent/ParentMobileNav'

import { ParentSidebar } from '../components/parent/ParentSidebar'

import { BrandMark } from '../components/ui/BrandMark'

import { ParentChildProvider } from '../context/ParentChildContext'

import { useAuth } from '../context/AuthContext'



function ParentAppLayoutInner() {

  const { user, logout } = useAuth()

  const navigate = useNavigate()
  const { pathname } = useLocation()
  const firstName = user?.name.split(' ')[0] ?? 'Родитель'



  return (

    <div className="min-h-screen bg-page">
      <SkipLink />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950">
        <div className="flex h-16 items-center justify-between px-5 lg:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="Karate Hub, на главную">
            <BrandMark variant="parent" size="sm" />
            <span className="hidden text-sm font-semibold text-white sm:inline">Дневник родителя</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-white">Привет, {firstName}!</p>
              <p className="text-xs text-white/80">Родитель</p>
            </div>
            <button
              type="button"
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="min-h-11 rounded-xl px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <ParentSidebar />
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-x-hidden overflow-y-auto bg-page pb-[5.75rem] outline-none lg:pb-0">
          <div key={pathname} className="page-transition">
            <Outlet />
          </div>
        </main>

      </div>



      <ParentMobileNav />

      <AddChildModal />

    </div>

  )

}



export function ParentAppLayout() {

  return (

    <ParentChildProvider>

      <ParentAppLayoutInner />

    </ParentChildProvider>

  )

}

