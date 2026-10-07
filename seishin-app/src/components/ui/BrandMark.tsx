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
  coach: 'bg-navy-900',
  parent: 'bg-brand-green text-navy-950',
  site: 'bg-brand-green text-navy-950',
}

export function BrandMark({ variant = 'site', size = 'md', showLabel = false }: BrandMarkProps) {
  const onDark = variant !== 'site'

  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center font-bold shadow-sm ${sizes[size]} ${variants[variant]} ${variant === 'coach' ? 'text-white' : ''}`}
      >
        空
      </span>
      {showLabel && (
        <div className="leading-tight">
          <p className={`font-display text-base font-semibold tracking-tight ${onDark ? 'text-white' : 'text-text'}`}>Karate Hub</p>
          <p
            className={`text-[10px] font-medium uppercase tracking-wider ${onDark ? 'text-text-on-dark' : 'text-text-secondary'}`}
          >
            Каратэ-клуб
          </p>
        </div>
      )}
    </div>
  )
}
