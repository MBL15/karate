import { Link } from 'react-router-dom'

export type QuickAction = {
  to: string
  label: string
  icon: string
}

type QuickActionsProps = {
  actions: QuickAction[]
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {actions.map((action) => (
        <Link
          key={action.to}
          to={action.to}
          className="group flex w-[4.75rem] shrink-0 flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-3 transition hover:border-brand-green/35 hover:shadow-[var(--shadow-card)] active:scale-[0.98] sm:w-[5.25rem]"
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand-green-light transition group-hover:bg-brand-green-muted">
            <img src={action.icon} alt="" aria-hidden="true" className="size-6 opacity-80" />
          </span>
          <span className="text-center text-[11px] font-semibold leading-tight text-text-secondary group-hover:text-text">
            {action.label}
          </span>
        </Link>
      ))}
    </div>
  )
}
