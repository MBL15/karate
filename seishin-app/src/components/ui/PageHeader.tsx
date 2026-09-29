import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 overflow-hidden rounded-[2rem] bg-navy-950 px-6 py-6 text-white sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-white/70">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  )
}
