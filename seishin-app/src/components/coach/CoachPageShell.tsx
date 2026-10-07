import type { ReactNode } from 'react'

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
  if (hero) {
    return (
      <div className="flex min-h-full flex-col">
        <div className="shrink-0">{hero}</div>
        <div className="relative z-10 mx-auto w-full max-w-5xl flex-1 overflow-x-hidden px-5 pb-8 lg:px-8">
          <div className="-mt-4 space-y-6 rounded-t-[1.75rem] bg-page pt-7 lg:-mt-5 lg:pt-8">{children}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-8 pt-[max(1.5rem,var(--safe-top-effective))] lg:max-w-3xl lg:px-8 lg:pt-8">
      <header className="mb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[1.65rem] font-bold leading-tight tracking-tight text-text">{title}</h1>
            {subtitle && <p className="mt-1 text-sm leading-relaxed text-text-secondary">{subtitle}</p>}
          </div>
          {headerRight}
        </div>
        {headerActions && <div className="mt-4 flex flex-wrap gap-2">{headerActions}</div>}
      </header>
      <div className="space-y-4">{children}</div>
    </div>
  )
}
