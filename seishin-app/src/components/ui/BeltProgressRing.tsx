type BeltProgressRingProps = {
  value: number
  beltName: string
  nextLabel: string
  size?: number
  variant?: 'hero' | 'card'
}

export function BeltProgressRing({
  value,
  beltName,
  nextLabel,
  size = 148,
  variant = 'hero',
}: BeltProgressRingProps) {
  const pct = Math.min(100, Math.max(0, value))
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference
  const onDark = variant === 'hero'
  const gradientId = `beltGradient-${variant}`

  return (
    <div className="inline-flex flex-col items-center">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={onDark ? 'rgb(255 255 255 / 0.1)' : 'var(--color-border)'}
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={onDark ? '#967010' : '#b8860b'} />
              <stop offset="100%" stopColor={onDark ? '#d4a843' : '#c9a035'} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
          <span className={`text-3xl font-extrabold leading-none tracking-tight ${onDark ? 'text-white' : 'text-text'}`}>
            {Math.round(pct)}%
          </span>
          <span
            className={`mt-1 max-w-[6.5rem] text-[11px] font-semibold leading-snug ${onDark ? 'text-text-on-dark' : 'text-text-secondary'}`}
          >
            {beltName} пояс
          </span>
          <span className={`mt-1 text-[10px] leading-none ${onDark ? 'text-white/55' : 'text-text-muted'}`}>
            до {nextLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
