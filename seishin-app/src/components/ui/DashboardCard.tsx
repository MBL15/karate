import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Accent = 'green' | 'blue' | 'amber' | 'red' | 'neutral'

const accentStyles: Record<Accent, { icon: string; border: string }> = {
  green: { icon: 'bg-brand-green-light text-brand-green', border: 'hover:border-brand-green/30' },
  blue: { icon: 'bg-brand-blue-light text-brand-blue', border: 'hover:border-brand-blue/30' },
  amber: { icon: 'bg-warning-bg text-warning', border: 'hover:border-warning/30' },
  red: { icon: 'bg-error-bg text-error', border: 'hover:border-error/30' },
  neutral: { icon: 'bg-surface-muted text-text-secondary', border: 'hover:border-border' },
}

type DashboardCardProps = {
  label: string
  title: string
  description?: string
  icon: ReactNode
  accent?: Accent
  badge?: ReactNode
  to?: string
  onClick?: () => void
}

export function DashboardCard({
  label,
  title,
  description,
  icon,
  accent = 'neutral',
  badge,
  to,
  onClick,
}: DashboardCardProps) {
  const styles = accentStyles[accent]
  const content = (
    <>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`flex size-9 items-center justify-center rounded-xl ${styles.icon}`}>{icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</span>
        </div>
        {badge}
      </div>
      <p className="text-sm font-bold text-text">{title}</p>
      {description && <p className="mt-1 text-sm leading-relaxed text-text-secondary">{description}</p>}
    </>
  )

  const className = `card p-5 transition ${styles.border} ${to || onClick ? 'cursor-pointer active:scale-[0.99]' : ''}`

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${className} w-full text-left`}>
        {content}
      </button>
    )
  }

  return <div className={className}>{content}</div>
}
