import type { Tone } from './AuthWidgets'

export type WizardStep = {
  label: string
  skipped?: boolean
}

export function StepProgress({ steps, current, tone }: { steps: WizardStep[]; current: number; tone: Tone | null }) {
  const fill = tone === 'parent' ? 'bg-brand-green' : 'bg-brand-blue'
  const soft = tone === 'parent' ? 'bg-brand-green/35' : 'bg-brand-blue/35'
  const active = steps[current]

  return (
    <div className="mb-6">
      <ol aria-label="Шаги регистрации" className="flex gap-1.5">
        {steps.map((step, index) => {
          const reached = index <= current
          return (
            <li
              key={step.label}
              aria-current={index === current ? 'step' : undefined}
              title={step.skipped ? `${step.label} — скоро` : step.label}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-subtle"
            >
              <span className="sr-only">
                {index + 1}. {step.label}
                {step.skipped ? ' (скоро)' : ''}
              </span>
              <span
                aria-hidden
                className={`block h-full rounded-full transition-[width] duration-500 ease-out ${step.skipped ? soft : fill}`}
                style={{ width: reached ? '100%' : '0%' }}
              />
            </li>
          )
        })}
      </ol>
      <p className="mt-2.5 text-xs font-medium text-text-muted">
        Шаг {current + 1} из {steps.length} · {active?.label}
      </p>
    </div>
  )
}
