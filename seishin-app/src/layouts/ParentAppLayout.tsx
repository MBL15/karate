import { Link, Outlet, useLocation } from 'react-router-dom'

import { SkipLink } from '../components/a11y/SkipLink'
import { AddChildModal } from '../components/parent/AddChildModal'

import { ParentMobileNav } from '../components/parent/ParentMobileNav'

import { ParentSidebar } from '../components/parent/ParentSidebar'

import { BrandMark } from '../components/ui/BrandMark'

import { ParentChildProvider } from '../context/ParentChildContext'

import { LogoutButton } from '../components/auth/LogoutButton'
import { useAuth } from '../context/AuthContext'
import { useParentChild } from '../context/ParentChildContext'



function ParentAppLayoutInner() {

  const { user } = useAuth()
  const { children, loading: childrenLoading } = useParentChild()

  const { pathname } = useLocation()
  const isSecretPage = pathname.endsWith('/secret')
  const emptyParent = !childrenLoading && children.length === 0
  const firstName = user?.name.split(' ')[0] ?? 'Родитель'



  return (

    <div className="min-h-screen bg-page">
      <SkipLink />

      <header className={`sticky top-0 z-40 border-b border-white/10 bg-navy-950 ${emptyParent ? 'hidden' : ''} ${isSecretPage ? 'hidden lg:block' : ''}`}>
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
            <LogoutButton variant="header" />
          </div>
        </div>
      </header>

      <div className={`flex ${isSecretPage ? 'min-h-screen lg:min-h-[calc(100vh-4rem)]' : 'min-h-[calc(100vh-4rem)]'}`}>
        {!emptyParent && <ParentSidebar />}
        <main
          id="main-content"
          tabIndex={-1}
          className={`flex-1 overflow-x-hidden overflow-y-auto outline-none lg:pb-0 ${
            emptyParent ? 'bg-white pb-[5.75rem]' : isSecretPage ? 'bg-[#f5f4f1] pb-[6.75rem]' : 'bg-page pb-[6.75rem]'
          }`}
        >
          <div key={pathname} className="page-transition">
            <Outlet />
          </div>
        </main>

      </div>



      <ParentMobileNav always={emptyParent} variant={emptyParent ? 'onboarding' : 'default'} />

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

