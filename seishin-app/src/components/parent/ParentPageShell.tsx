import type { ReactNode } from 'react'

import { ParentChildHeroBar } from './ParentChildHeroBar'

import { ParentHero } from './ParentHero'



type ParentPageShellProps = {

  title: string

  subtitle?: string

  children: ReactNode

  headerRight?: ReactNode

  headerActions?: ReactNode

  hero?: ReactNode

  childSwitcher?: boolean

}



export function ParentPageShell({

  title,

  subtitle,

  children,

  headerRight,

  headerActions,

  hero,

  childSwitcher,

}: ParentPageShellProps) {

  const heroBlock =

    hero ?? (

      <ParentHero

        title={title}

        subtitle={subtitle}

        compact

        right={headerRight}

        childSwitcher={childSwitcher}

      />

    )



  return (

    <div className="flex min-h-full flex-col">

      <div className="shrink-0">{heroBlock}</div>



      <div className="relative z-10 mx-auto w-full max-w-5xl flex-1 overflow-x-hidden px-5 pb-8 lg:px-8">

        <div className="-mt-4 space-y-6 rounded-t-[1.75rem] bg-page pt-7 lg:-mt-5 lg:pt-8">

          {(headerActions || (childSwitcher && !hero)) && (

            <div className="hidden flex-wrap items-center justify-between gap-4 lg:flex">

              {childSwitcher && !hero && (

                <div className="max-w-xl flex-1">

                  <ParentChildHeroBar />

                </div>

              )}

              {headerActions && <div className="flex flex-wrap gap-2">{headerActions}</div>}

            </div>

          )}

          {children}

        </div>

      </div>

    </div>

  )

}
