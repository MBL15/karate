import { useState, type ComponentType } from 'react'
import { IconActivity, IconAward, IconCalendar, IconChart, IconCheck, IconDumbbell, IconSparkles, IconTrophy } from './Icons'

type Art = {
  from: string
  to: string
  glyph: ComponentType<{ size?: number; className?: string }>
  /** PNG/SVG from `public/assets/badges/`; when set, it replaces the drawn medal. */
  image?: string
}

const ART: Record<string, Art> = {
  дисциплина: { from: '#818cf8', to: '#4338ca', glyph: IconCheck },
  техника: { from: '#c084fc', to: '#7e22ce', glyph: IconSparkles },
  старание: { from: '#fb923c', to: '#c2410c', glyph: IconDumbbell },
  прогресс: { from: '#4ade80', to: '#15803d', glyph: IconChart },
  лидер: { from: '#fde047', to: '#ca8a04', glyph: IconTrophy },
  кумитэ: { from: '#f87171', to: '#b91c1c', glyph: IconActivity },
  посещаемость: { from: '#60a5fa', to: '#1d4ed8', glyph: IconCalendar },
}

const FALLBACK: Art = { from: '#fbbf24', to: '#d97706', glyph: IconAward }

export function badgeArt(name: string): Art {
  return ART[name.trim().toLowerCase()] ?? FALLBACK
}

const SIZES = {
  xs: { box: 18, icon: 10, ribbon: false },
  sm: { box: 36, icon: 17, ribbon: false },
  md: { box: 52, icon: 24, ribbon: true },
  lg: { box: 68, icon: 30, ribbon: true },
} as const

export function BadgeToken({
  name,
  size = 'md',
  dim = false,
  className = '',
}: {
  name: string
  size?: keyof typeof SIZES
  dim?: boolean
  className?: string
}) {
  const art = badgeArt(name)
  const s = SIZES[size]
  const [broken, setBroken] = useState(false)
  const Glyph = art.glyph
  const ribbonH = Math.round(s.box * 0.32)

  return (
    <span
      className={`relative inline-flex shrink-0 justify-center ${dim ? 'opacity-40 grayscale' : ''} ${className}`}
      style={{ width: s.box, height: s.box + (s.ribbon ? ribbonH * 0.55 : 0) }}
      aria-hidden
    >
      {s.ribbon && (
        <span className="absolute bottom-0 flex gap-[2px]" style={{ height: ribbonH }}>
          <span className="w-[9px] -rotate-12 rounded-b-[2px]" style={{ background: art.to }} />
          <span className="w-[9px] rotate-12 rounded-b-[2px]" style={{ background: art.from }} />
        </span>
      )}
      {art.image && !broken ? (
        <img
          src={art.image}
          alt=""
          width={s.box}
          height={s.box}
          onError={() => setBroken(true)}
          className="relative object-contain drop-shadow-md"
          style={{ width: s.box, height: s.box }}
        />
      ) : (
        <span
          className="relative flex items-center justify-center rounded-full text-white"
          style={{
            width: s.box,
            height: s.box,
            background: `linear-gradient(145deg, ${art.from}, ${art.to})`,
            boxShadow:
              size === 'xs'
                ? 'none'
                : `0 ${Math.round(s.box / 10)}px ${Math.round(s.box / 4)}px -${Math.round(s.box / 8)}px ${art.to}b3, inset 0 0 0 ${Math.max(1.5, s.box / 22)}px rgba(255,255,255,.45)`,
          }}
        >
          {size !== 'xs' && (
            <span
              className="absolute rounded-full border border-white/30"
              style={{ inset: Math.round(s.box * 0.12) }}
            />
          )}
          {size !== 'xs' && (
            <span
              className="pointer-events-none absolute top-[8%] left-[18%] h-[30%] w-[45%] -rotate-[20deg] rounded-full bg-white/35 blur-[1px]"
            />
          )}
          <Glyph size={s.icon} className="relative drop-shadow-[0_1px_1px_rgba(0,0,0,.25)]" />
        </span>
      )}
    </span>
  )
}
