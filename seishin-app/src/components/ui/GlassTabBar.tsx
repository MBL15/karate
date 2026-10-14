import { useState, type CSSProperties, type ReactNode } from 'react'

const toneColor = {
  coach: '#2563eb',
  parent: '#16a34a',
} as const

export function GlassTabBar({
  tone,
  activeIndex,
  label,
  items,
}: {
  tone: 'coach' | 'parent'
  activeIndex: number
  label: string
  items: ReactNode[]
}) {
  const [pressed, setPressed] = useState<number | null>(null)
  const color = toneColor[tone]
  const target = pressed ?? activeIndex
  const count = items.length

  return (
    <div
      className="glass-bar relative rounded-[2rem] p-1.5"
      style={{ '--glass-tone': color } as CSSProperties}
      onPointerLeave={() => setPressed(null)}
    >
      <span
        className="glass-indicator pointer-events-none absolute top-1.5 bottom-1.5"
        style={{ left: `calc(0.375rem + ${target} * (100% - 0.75rem) / ${count})`, width: `calc((100% - 0.75rem) / ${count})` }}
        aria-hidden
      >
        <span className="glass-blob block size-full rounded-[1.5rem]" />
      </span>
      <ul aria-label={label} className="relative grid h-[3.75rem]" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
        {items.map((item, index) => (
          <li
            key={index}
            className="glass-slot flex"
            data-active={index === target ? '' : undefined}
            onPointerDown={() => setPressed(index)}
            onPointerUp={() => setPressed(null)}
            onPointerCancel={() => setPressed(null)}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
