export type ToolKind =
  | 'fitness'
  | 'timer'
  | 'calendar'
  | 'plans'
  | 'analytics'
  | 'checks'
  | 'club'
  | 'documents'

const tiles: Record<ToolKind, string> = {
  fitness: 'from-[#e3f8ec] to-[#cdf1dc]',
  timer: 'from-[#ffe9e9] to-[#ffd6d6]',
  calendar: 'from-[#fff3dc] to-[#ffe6b8]',
  plans: 'from-[#e6efff] to-[#d3e2ff]',
  analytics: 'from-[#fff1e0] to-[#ffe0bd]',
  checks: 'from-[#e3f8ec] to-[#cdf1dc]',
  club: 'from-[#eef1f5] to-[#dfe4ec]',
  documents: 'from-[#f1ebff] to-[#e2d6ff]',
}

function Glyph({ kind }: { kind: ToolKind }) {
  switch (kind) {
    case 'fitness':
      return (
        <>
          <rect x="7" y="17" width="6" height="14" rx="2" fill="#16a34a" />
          <rect x="35" y="17" width="6" height="14" rx="2" fill="#16a34a" />
          <rect x="12" y="13" width="6" height="22" rx="2.5" fill="#22c55e" />
          <rect x="30" y="13" width="6" height="22" rx="2.5" fill="#22c55e" />
          <rect x="18" y="21.5" width="12" height="5" rx="2" fill="#15803d" />
        </>
      )
    case 'timer':
      return (
        <>
          <rect x="20" y="5" width="8" height="5" rx="2" fill="#dc2626" />
          <rect x="33" y="10" width="5" height="4" rx="1.5" transform="rotate(40 35 12)" fill="#dc2626" />
          <circle cx="24" cy="27" r="15" fill="#ef4444" />
          <circle cx="24" cy="27" r="11" fill="#fff" />
          <path d="M24 27V20" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
          <path d="M24 27l5 3" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
        </>
      )
    case 'calendar':
      return (
        <>
          <rect x="7" y="10" width="34" height="31" rx="7" fill="#f59e0b" />
          <path d="M7 17a7 7 0 0 1 7-7h20a7 7 0 0 1 7 7v3H7v-3Z" fill="#d97706" />
          <rect x="15" y="6" width="4" height="9" rx="2" fill="#b45309" />
          <rect x="29" y="6" width="4" height="9" rx="2" fill="#b45309" />
          {[0, 1, 2].map((col) =>
            [0, 1].map((row) => (
              <rect key={`${col}-${row}`} x={14 + col * 8} y={25 + row * 7} width="5" height="4" rx="1.5" fill="#fff" />
            )),
          )}
        </>
      )
    case 'plans':
      return (
        <>
          <rect x="10" y="9" width="28" height="33" rx="6" fill="#3b82f6" />
          <rect x="17" y="5" width="14" height="8" rx="3" fill="#1d4ed8" />
          <rect x="16" y="20" width="16" height="3.5" rx="1.75" fill="#fff" />
          <rect x="16" y="27" width="12" height="3.5" rx="1.75" fill="#fff" opacity="0.85" />
          <rect x="16" y="34" width="9" height="3.5" rx="1.75" fill="#fff" opacity="0.7" />
        </>
      )
    case 'analytics':
      return (
        <>
          <rect x="9" y="26" width="8" height="14" rx="3" fill="#fdba74" />
          <rect x="20" y="17" width="8" height="23" rx="3" fill="#fb923c" />
          <rect x="31" y="9" width="8" height="31" rx="3" fill="#ea580c" />
        </>
      )
    case 'checks':
      return (
        <>
          <rect x="10" y="9" width="28" height="33" rx="6" fill="#22c55e" />
          <rect x="17" y="5" width="14" height="8" rx="3" fill="#15803d" />
          <path d="M17 26.5l5 5 9-10" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      )
    case 'club':
      return (
        <>
          <g fill="#475569">
            {Array.from({ length: 8 }, (_, i) => (
              <rect key={i} x="21" y="5" width="6" height="9" rx="2" transform={`rotate(${i * 45} 24 24)`} />
            ))}
          </g>
          <circle cx="24" cy="24" r="13" fill="#64748b" />
          <circle cx="24" cy="24" r="5.5" fill="#fff" />
        </>
      )
    case 'documents':
      return (
        <>
          <path d="M12 9a4 4 0 0 1 4-4h12l10 10v24a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V9Z" fill="#8b5cf6" />
          <path d="M28 5v6a4 4 0 0 0 4 4h6L28 5Z" fill="#6d28d9" />
          <rect x="18" y="22" width="13" height="3" rx="1.5" fill="#fff" />
          <rect x="18" y="28" width="13" height="3" rx="1.5" fill="#fff" opacity="0.85" />
          <rect x="18" y="34" width="8" height="3" rx="1.5" fill="#fff" opacity="0.7" />
        </>
      )
  }
}

export function ToolArt({ kind, size = 48 }: { kind: ToolKind; size?: number }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tiles[kind]}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 48 48" width={size * 0.7} height={size * 0.7} fill="none">
        <Glyph kind={kind} />
      </svg>
    </span>
  )
}
