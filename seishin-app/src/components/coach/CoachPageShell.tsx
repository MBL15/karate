import type { ReactNode } from 'react'

import { CoachHero } from './CoachHero'



type CoachPageShellProps = {

  title: string

  subtitle?: string

  children: ReactNode

  headerRight?: ReactNode

  headerActions?: ReactNode

  hero?: ReactNode

}



export function CoachPageShell({

  title,

  subtitle,

  children,

  headerRight,

  headerActions,

  hero,

}: CoachPageShellProps) {

  const heroBlock = hero ?? <CoachHero title={title} subtitle={subtitle} compact right={headerRight} />



  return (

    <div className="flex min-h-full flex-col">

      <div className="shrink-0">{heroBlock}</div>



      <div className="relative z-10 mx-auto w-full max-w-5xl flex-1 overflow-x-hidden px-5 pb-8 lg:px-8">

        <div className="-mt-4 space-y-6 rounded-t-[1.75rem] bg-page pt-7 lg:-mt-5 lg:pt-8">

          {headerActions && (

            <div className="hidden flex-wrap justify-end gap-2 lg:flex">{headerActions}</div>

          )}

          {children}

        </div>

      </div>

    </div>

  )

}

