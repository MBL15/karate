import type { ReactNode } from 'react'
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
  const heroBlock = hero ?? (
    <ParentHero title={title} subtitle={subtitle} compact right={headerRight} childSwitcher={childSwitcher} />
  )

  return (
    <div className="flex min-h-full flex-col">
      <div className="shrink-0">{heroBlock}</div>
      <div className="mx-auto w-full max-w-lg flex-1 overflow-x-hidden px-5 pb-8 lg:max-w-5xl lg:px-8">
        <div className="space-y-6 pt-5">
          {headerActions && <div className="flex flex-wrap gap-2">{headerActions}</div>}
          {children}
        </div>
      </div>
    </div>
  )
}
