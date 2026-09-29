import type { ReactNode } from 'react'

type CoachHeroProps = {
  eyebrow?: string
  title: string
  subtitle?: string
  right?: ReactNode
  children?: ReactNode
  compact?: boolean
}

export function CoachHero({ eyebrow, title, subtitle, right, children, compact }: CoachHeroProps) {
  return (
    <div className={`hero-app px-5 pt-5 ${compact ? 'pb-8' : 'pb-10'} rounded-b-[1.75rem]`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{eyebrow}</p>
          )}
          <h1 className="mt-1 text-xl font-bold tracking-tight text-white">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-white/70">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}
