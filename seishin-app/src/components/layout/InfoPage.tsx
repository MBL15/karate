import type { ReactNode } from 'react'

type Tone = 'blue' | 'green'

const toneText: Record<Tone, string> = { blue: 'text-brand-blue', green: 'text-brand-green' }
const toneIcon: Record<Tone, string> = {
  blue: 'bg-brand-blue-light text-brand-blue',
  green: 'bg-brand-green-light text-brand-green',
}

export function InfoPage({
  eyebrow,
  title,
  lead,
  tone = 'blue',
  children,
}: {
  eyebrow: string
  title: string
  lead?: string
  tone?: Tone
  children: ReactNode
}) {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-10 pb-16 lg:px-8 lg:pt-14">
      <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${toneText[tone]}`}>{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-text sm:text-4xl">{title}</h1>
      {lead && <p className="mt-3 max-w-2xl text-base leading-7 text-text-secondary">{lead}</p>}
      <div className="mt-8">{children}</div>
    </div>
  )
}

export function FeatureList({
  items,
  tone = 'blue',
}: {
  items: { icon: ReactNode; title: string; text: string }[]
  tone?: Tone
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.title} className="flex gap-3 rounded-2xl border border-border-light bg-white p-4 shadow-[var(--shadow-card)]">
          <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${toneIcon[tone]}`}>{item.icon}</span>
          <span className="min-w-0">
            <span className="block font-semibold text-text">{item.title}</span>
            <span className="mt-0.5 block text-sm leading-relaxed text-text-secondary">{item.text}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
