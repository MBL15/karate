import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { IconArrowLeft } from '../../ui/Icons'
import { ToolArt, type ToolKind } from './ToolArt'

export function BackLink({ to = '/coach/tools', label = 'Инструменты' }: { to?: string; label?: string }) {
  return (
    <Link
      to={to}
      className="group -ml-1 inline-flex min-h-10 items-center gap-1.5 rounded-full pr-3 pl-1 text-sm font-semibold text-text-secondary transition hover:text-brand-blue"
    >
      <span className="flex size-8 items-center justify-center rounded-full bg-white shadow-[var(--shadow-card)] transition group-hover:-translate-x-0.5">
        <IconArrowLeft size={16} />
      </span>
      {label}
    </Link>
  )
}

export function ToolShell({
  kind,
  title,
  subtitle,
  action,
  onBack,
  backLabel,
  children,
}: {
  kind: ToolKind
  title: string
  subtitle?: string
  action?: ReactNode
  onBack?: () => void
  backLabel?: string
  children: ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-10 pt-[max(1.25rem,var(--safe-top-effective))] lg:max-w-3xl lg:px-8 lg:pt-8">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="group -ml-1 inline-flex min-h-10 items-center gap-1.5 rounded-full pr-3 pl-1 text-sm font-semibold text-text-secondary transition hover:text-brand-blue"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-white shadow-[var(--shadow-card)] transition group-hover:-translate-x-0.5">
            <IconArrowLeft size={16} />
          </span>
          {backLabel}
        </button>
      ) : (
        <BackLink />
      )}
      <header className="tool-rise mt-4 flex items-center gap-3.5">
        <ToolArt kind={kind} size={52} />
        <div className="min-w-0 flex-1">
          <h1 className="text-[1.5rem] font-bold leading-tight tracking-tight text-text">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-text-secondary">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="tool-stagger mt-6 space-y-4">{children}</div>
    </div>
  )
}

export function ToolCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-border-light bg-white p-5 shadow-[var(--shadow-card)] ${className}`}>
      {children}
    </section>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-base font-bold text-text">{children}</h2>
      {action}
    </div>
  )
}
