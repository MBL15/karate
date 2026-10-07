import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'

export type QuickActionTone = 'navy' | 'gold' | 'blue' | 'ink'

type IconComponent = ComponentType<{ size?: number; className?: string }>

export type QuickAction = {
  to: string
  label: string
  icon: IconComponent
  tone?: QuickActionTone
}

type QuickActionsProps = {
  actions: QuickAction[]
}

const toneClass: Record<QuickActionTone, string> = {
  navy: 'bg-navy-900 text-white shadow-[0_8px_16px_rgb(18_24_32_/_0.16)]',
  gold: 'bg-[linear-gradient(180deg,#f3d78a_0%,#c4961a_100%)] text-navy-950 shadow-[0_8px_16px_rgb(184_134_11_/_0.28)]',
  blue: 'bg-[#1d4e89] text-white shadow-[0_8px_16px_rgb(29_78_137_/_0.22)]',
  ink: 'bg-navy-800 text-[#f3d78a] shadow-[0_8px_16px_rgb(18_24_32_/_0.14)]',
}

const fallback: QuickActionTone[] = ['navy', 'gold', 'blue', 'ink']

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <nav
      aria-label="Быстрый доступ"
      className="grid grid-cols-4 overflow-hidden rounded-[1.35rem] border border-white/80 bg-white shadow-[var(--shadow-card)]"
    >
      {actions.map((action, index) => {
        const tone = action.tone ?? fallback[index % fallback.length]
        const Icon = action.icon
        return (
          <Link
            key={action.to}
            to={action.to}
            className={`flex min-h-[5.75rem] cursor-pointer flex-col items-center justify-center gap-2 px-1 py-3.5 transition duration-200 hover:bg-[#faf7f0] active:scale-[0.98] active:bg-surface-muted ${
              index > 0 ? 'border-l border-border-light' : ''
            }`}
          >
            <span className={`flex size-11 items-center justify-center rounded-2xl ${toneClass[tone]}`}>
              <Icon size={20} />
            </span>
            <span className="text-center text-[11px] font-semibold leading-none tracking-tight text-text">
              {action.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
