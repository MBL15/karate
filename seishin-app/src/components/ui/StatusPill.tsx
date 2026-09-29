import type { ReactNode } from 'react'

type StatusPillProps = {
  icon: ReactNode
  label: string
  value: string
  tone?: 'green' | 'amber' | 'red' | 'blue' | 'neutral'
  surface?: 'light' | 'dark'
}

const lightTones = {
  green: 'border-success/25 bg-success-bg text-success',
  amber: 'border-warning/25 bg-warning-bg text-warning',
  red: 'border-error/25 bg-error-bg text-error',
  blue: 'border-border bg-brand-blue-light text-text',
  neutral: 'border-border bg-surface-muted text-text-secondary',
}

const darkTones = {
  green: 'border-brand-green/35 bg-brand-green/12 text-brand-green-light',
  amber: 'border-warning/40 bg-warning/15 text-[#f5deb3]',
  red: 'border-error/40 bg-error/15 text-[#fecaca]',
  blue: 'border-white/20 bg-white/10 text-text-on-dark',
  neutral: 'border-white/15 bg-white/8 text-text-on-dark',
}

export function StatusPill({ icon, label, value, tone = 'neutral', surface = 'light' }: StatusPillProps) {
  const tones = surface === 'dark' ? darkTones : lightTones
  const iconBg = surface === 'dark' ? 'bg-white/10' : 'bg-surface'

  return (
    <div className={`flex min-w-0 flex-1 items-center gap-3 rounded-2xl border px-3.5 py-3 ${tones[tone]}`}>
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase leading-none tracking-wide opacity-75">{label}</p>
        <p className="mt-1 truncate text-sm font-semibold leading-snug">{value}</p>
      </div>
    </div>
  )
}
