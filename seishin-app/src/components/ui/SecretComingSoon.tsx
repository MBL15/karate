const palette = {
  coach: { main: '#2563eb', deep: '#1d4ed8', soft: '#eaf1fe', badge: 'bg-brand-blue-light text-brand-blue' },
  parent: { main: '#16a34a', deep: '#15803d', soft: '#e8f7ee', badge: 'bg-brand-green-light text-brand-green' },
}

function ToriiIllustration({ tone }: { tone: 'coach' | 'parent' }) {
  const c = palette[tone]
  return (
    <svg viewBox="0 0 320 260" className="h-auto w-full" fill="none" aria-hidden>
      <defs>
        <radialGradient id={`sun-${tone}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c.main} stopOpacity="0.16" />
          <stop offset="100%" stopColor={c.main} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`mist-${tone}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
        </linearGradient>
      </defs>
      <circle cx="160" cy="118" r="112" fill={`url(#sun-${tone})`} />
      <circle cx="160" cy="104" r="46" fill={c.soft} />
      <ellipse cx="160" cy="232" rx="120" ry="14" fill={c.soft} />
      <g>
        <path d="M58 58c34 10 170 10 204 0l-8 22H66L58 58Z" fill={c.main} />
        <rect x="80" y="94" width="160" height="12" rx="3" fill={c.main} />
        <rect x="96" y="80" width="18" height="150" rx="4" fill={c.deep} />
        <rect x="206" y="80" width="18" height="150" rx="4" fill={c.deep} />
        <rect x="152" y="80" width="16" height="26" rx="3" fill={c.deep} />
        <rect x="90" y="224" width="30" height="10" rx="3" fill={c.deep} />
        <rect x="200" y="224" width="30" height="10" rx="3" fill={c.deep} />
      </g>
      <rect x="0" y="196" width="320" height="64" fill={`url(#mist-${tone})`} />
    </svg>
  )
}

export function SecretComingSoon({ tone }: { tone: 'coach' | 'parent' }) {
  const c = palette[tone]
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-8rem)] w-full max-w-md flex-col items-center justify-center px-6 py-10 text-center">
      <div className="landing-rise w-full max-w-[17rem]">
        <ToriiIllustration tone={tone} />
      </div>
      <span className={`landing-rise mt-6 rounded-full px-3 py-1 text-xs font-semibold ${c.badge}`} style={{ animationDelay: '0.1s' }}>
        Скоро
      </span>
      <h1 className="landing-rise mt-3 text-2xl font-bold tracking-tight text-text" style={{ animationDelay: '0.16s' }}>
        Раздел в разработке
      </h1>
      <p className="landing-rise mt-3 max-w-xs text-sm leading-relaxed text-text-secondary" style={{ animationDelay: '0.22s' }}>
        Здесь появятся новые возможности. Мы сообщим, когда всё будет готово.
      </p>
    </div>
  )
}
