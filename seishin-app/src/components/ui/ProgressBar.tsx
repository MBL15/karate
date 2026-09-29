type ProgressBarProps = {
  value: number
  label?: string
  showPercent?: boolean
  variant?: 'green' | 'blue' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  shine?: boolean
}

const heights = { sm: 'h-2', md: 'h-2.5', lg: 'h-3' }

export function ProgressBar({
  value,
  label,
  showPercent = true,
  variant = 'green',
  size = 'md',
  shine = false,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value))

  const fill =
    variant === 'green' ? 'bg-brand-green' : variant === 'blue' ? 'bg-brand-blue' : 'bg-brand-green'
  const track =
    variant === 'green'
      ? 'bg-brand-green-light'
      : variant === 'blue'
        ? 'bg-brand-blue-light'
        : 'bg-navy-900'
  const percentColor =
    variant === 'dark' ? 'text-brand-green' : variant === 'blue' ? 'text-brand-blue' : 'text-brand-green'

  return (
    <div>
      {(label || showPercent) && (
        <div className="mb-2.5 flex items-center justify-between gap-3 text-sm">
          {label && <span className="leading-snug text-text-secondary">{label}</span>}
          {showPercent && (
            <span className={`shrink-0 font-semibold leading-none ${percentColor}`}>{Math.round(pct)}%</span>
          )}
        </div>
      )}
      <div
        className={`overflow-hidden rounded-full ${track} ${heights[size]}`}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${Math.round(pct)} процентов`}
        aria-label={label ?? 'Прогресс'}
      >
        <div
          className={`h-full rounded-full ${fill} transition-all duration-500 ease-out ${shine ? 'progress-fill-shine' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
