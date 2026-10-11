import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-muted px-6 py-14 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-surface text-3xl shadow-[var(--shadow-card)]">
        {icon ?? '📭'}
      </span>
      <p className="mt-5 text-base font-semibold text-text">{title}</p>
      {description && <p className="mt-2 max-w-xs text-sm leading-relaxed text-text-secondary">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
