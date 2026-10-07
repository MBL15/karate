import type { ReactNode } from 'react'

import { ParentChildHeroBar } from './ParentChildHeroBar'



type ParentHeroProps = {

  eyebrow?: string

  title: string

  subtitle?: string

  right?: ReactNode

  children?: ReactNode

  compact?: boolean

  childSwitcher?: boolean

  switcherRight?: ReactNode

}



export function ParentHero({

  eyebrow,

  title,

  subtitle,

  right,

  children,

  compact,

  childSwitcher,

  switcherRight,

}: ParentHeroProps) {

  return (

    <div
      className={`hero-app relative overflow-hidden rounded-b-[1.75rem] px-5 pt-5 shadow-[0_18px_40px_rgb(18_24_32_/_0.16)] ${compact ? 'pb-8' : 'pb-10'}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-green/80 to-transparent"
      />
      <div className="relative z-10">

        {childSwitcher && <ParentChildHeroBar right={switcherRight} />}

        <div className="flex items-start justify-between gap-3">

          <div className="min-w-0">

            {eyebrow && (

              <p className="text-xs font-semibold uppercase tracking-wider text-text-on-dark">{eyebrow}</p>

            )}

            <h1 className="mt-1 font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h1>

            {subtitle && <p className="mt-1 text-sm text-text-on-dark">{subtitle}</p>}

          </div>

          {right}

        </div>

        {children}

      </div>

    </div>

  )

}

