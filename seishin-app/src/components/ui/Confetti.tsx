import { useState, type CSSProperties } from 'react'

const palette = ['#2563eb', '#16a34a', '#60a5fa', '#4ade80', '#facc15', '#f472b6']

type Piece = {
  left: number
  delay: number
  duration: number
  drift: number
  spin: number
  width: number
  height: number
  color: string
  round: boolean
}

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, index) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 2.2 + Math.random() * 1.6,
    drift: (Math.random() - 0.5) * 160,
    spin: 360 + Math.random() * 720,
    width: 6 + Math.random() * 6,
    height: 8 + Math.random() * 8,
    color: palette[index % palette.length],
    round: Math.random() > 0.7,
  }))
}

export function Confetti({ count = 90 }: { count?: number }) {
  const [pieces] = useState(() => makePieces(count))

  return (
    <div aria-hidden className="confetti pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((piece, index) => (
        <span
          key={index}
          className="confetti-piece"
          style={
            {
              left: `${piece.left}%`,
              width: piece.width,
              height: piece.round ? piece.width : piece.height,
              background: piece.color,
              borderRadius: piece.round ? '9999px' : '2px',
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              '--confetti-drift': `${piece.drift}px`,
              '--confetti-spin': `${piece.spin}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

export function SuccessCheck({ tone }: { tone: 'coach' | 'parent' }) {
  const color = tone === 'coach' ? '#2563eb' : '#16a34a'
  return (
    <span className="success-pop relative flex size-24 items-center justify-center">
      <span
        aria-hidden
        className="success-ring absolute inset-0 rounded-full"
        style={{ backgroundColor: tone === 'coach' ? '#eaf1fe' : '#e8f7ee' }}
      />
      <svg width="96" height="96" viewBox="0 0 96 96" fill="none" className="relative" aria-hidden>
        <circle cx="48" cy="48" r="34" fill={color} />
        <path
          d="M33 49l10 10 20-22"
          stroke="#fff"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="success-check-path"
        />
      </svg>
    </span>
  )
}
