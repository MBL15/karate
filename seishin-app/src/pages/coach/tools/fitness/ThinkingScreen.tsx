import { useEffect, useState } from 'react'
import { IconCheck } from '../../../../components/ui/Icons'

export function ThinkingScreen({ messages, onDone }: { messages: string[]; onDone: () => void }) {
  const [shown, setShown] = useState(1)

  useEffect(() => {
    if (shown > messages.length) {
      const id = window.setTimeout(onDone, 450)
      return () => window.clearTimeout(id)
    }
    const id = window.setTimeout(() => setShown((n) => n + 1), 620)
    return () => window.clearTimeout(id)
  }, [shown, messages.length, onDone])

  return (
    <div className="flex min-h-[60svh] flex-col items-center justify-center py-6">
      <div className="relative flex size-28 items-center justify-center">
        <span className="ai-orb absolute inset-0 rounded-full bg-gradient-to-br from-[#60a5fa] via-[#2563eb] to-[#16a34a] opacity-90" aria-hidden />
        <span className="ai-ring absolute -inset-3 rounded-full border-2 border-brand-blue/20" aria-hidden />
        <svg width="40" height="40" viewBox="0 0 24 24" fill="#fff" className="relative" aria-hidden>
          <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2Zm7 12 .9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9L19 14Z" />
        </svg>
      </div>
      <p className="mt-6 text-lg font-bold text-text">Собираю комплекс…</p>
      <ul className="mt-5 w-full max-w-sm space-y-2.5" aria-live="polite">
        {messages.slice(0, shown).map((text, i) => {
          const done = i < shown - 1 || shown > messages.length
          return (
            <li key={text} className="sheet-item flex items-start gap-3 rounded-2xl border border-border-light bg-white px-4 py-3 shadow-[var(--shadow-card)]">
              <span
                className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full transition ${
                  done ? 'bg-brand-green text-white' : 'bg-brand-blue-light'
                }`}
              >
                {done ? <IconCheck size={11} /> : <span className="ai-dot size-1.5 rounded-full bg-brand-blue" />}
              </span>
              <span className={`text-sm ${done ? 'text-text-secondary' : 'font-medium text-text'}`}>{text}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
