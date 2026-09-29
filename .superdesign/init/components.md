# Shared UI Components — seishin-app/src/components/ui/

## BrandMark.tsx
Brand logo mark with kanji 空. Props: variant (coach|parent|site), size (sm|md|lg), showLabel.

```tsx
type BrandMarkProps = {
  variant?: 'coach' | 'parent' | 'site'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const sizes = {
  sm: 'size-8 text-sm rounded-lg',
  md: 'size-10 text-base rounded-xl',
  lg: 'size-12 text-xl rounded-2xl',
}

const variants = {
  coach: 'bg-brand-blue',
  parent: 'bg-brand-green',
  site: 'bg-brand-blue',
}

export function BrandMark({ variant = 'site', size = 'md', showLabel = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex shrink-0 items-center justify-center font-bold text-white shadow-sm ${sizes[size]} ${variants[variant]}`}
      >
        空
      </span>
      {showLabel && (
        <div className="leading-tight">
          <p className="text-base font-bold text-text">SEISHIN</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-text-secondary">
            Каратэ-клуб
          </p>
        </div>
      )}
    </div>
  )
}
```

## ProgressBar.tsx
Progress indicator. Props: value, label, showPercent, variant (green|blue).

```tsx
type ProgressBarProps = {
  value: number
  label?: string
  showPercent?: boolean
  variant?: 'green' | 'blue'
}

export function ProgressBar({ value, label, showPercent = true, variant = 'green' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value))
  const fill = variant === 'green' ? 'bg-brand-green' : 'bg-brand-blue'
  const track = variant === 'green' ? 'bg-brand-green-light' : 'bg-brand-blue-light'

  return (
    <div>
      {(label || showPercent) && (
        <div className="mb-2 flex justify-between text-sm">
          {label && <span className="text-text-secondary">{label}</span>}
          {showPercent && <span className="font-semibold text-brand-green">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={`h-2.5 overflow-hidden rounded-full ${track}`}>
        <div
          className={`h-full rounded-full ${fill} transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
```

## StatCard.tsx
Stat display card with left accent border.

```tsx
type StatCardProps = {
  value: string | number
  label: string
  accent?: 'green' | 'blue' | 'amber' | 'default'
}

const accents = {
  green: 'border-l-brand-green',
  blue: 'border-l-brand-blue',
  amber: 'border-l-warning',
  default: 'border-l-border',
}

export function StatCard({ value, label, accent = 'default' }: StatCardProps) {
  return (
    <div className={`card border-l-4 p-5 ${accents[accent]}`}>
      <p className="stat-value">{value}</p>
      <p className="mt-1 text-sm text-text-secondary">{label}</p>
    </div>
  )
}
```

## PageHeader.tsx
Page title with optional subtitle and actions.

```tsx
import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-text-secondary">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
```

## EmptyState.tsx
Empty state placeholder with icon, title, description, action.

```tsx
import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-muted px-6 py-12 text-center">
      <span className="text-4xl">{icon}</span>
      <p className="mt-4 font-semibold text-text">{title}</p>
      {description && <p className="mt-2 max-w-sm text-sm text-text-secondary">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
```
