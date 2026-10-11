import type { ReactNode } from 'react'
import { BackButton } from './BackButton'
import { ChildSwitchPill } from './ChildSwitch'

type ParentHeroProps = {
  eyebrow?: string
  title: string
  subtitle?: string
  right?: ReactNode
  children?: ReactNode
  compact?: boolean
  childSwitcher?: boolean
}

export function ParentHero({ eyebrow, title, subtitle, right, children, childSwitcher }: ParentHeroProps) {
  return (
    <div className="mx-auto w-full max-w-lg px-5 pt-[max(1.25rem,var(--safe-top-effective))] lg:max-w-5xl lg:px-8 lg:pt-8">
      <div className="flex items-center gap-1">
        <BackButton />
        <div className="min-w-0 flex-1">
          {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-brand-green">{eyebrow}</p>}
          <h1 className="truncate font-display text-[1.75rem] font-bold leading-tight tracking-tight text-text">{title}</h1>
        </div>
        {right}
        {childSwitcher && <ChildSwitchPill />}
      </div>
      {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
      {children}
    </div>
  )
}
