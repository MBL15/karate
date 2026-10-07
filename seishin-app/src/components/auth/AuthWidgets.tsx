import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { IconArrowLeft, IconEye, IconEyeOff } from '../ui/Icons'
import { BrandMark } from '../ui/BrandMark'

export const coachAccent = '#2f6fed'
export const parentAccent = '#1fa971'

export function AuthShell({
  children,
  heroTitle,
  heroLead,
  points,
  showHome = true,
}: {
  children: ReactNode
  heroTitle: string
  heroLead: string
  points: string[]
  showHome?: boolean
}) {
  return (
    <div className="min-h-screen bg-page lg:grid lg:min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
      <aside className="gradient-hero sticky top-0 hidden h-screen flex-col justify-between self-start overflow-hidden px-10 py-12 text-white xl:px-14 lg:flex">
        <div aria-hidden className="pointer-events-none absolute -top-20 -right-16 size-72 rounded-full border border-white/10" />
        <div aria-hidden className="pointer-events-none absolute bottom-16 -left-20 size-56 rounded-full border border-white/10" />
        <BrandMark variant="parent" size="lg" showLabel />
        <div className="relative max-w-md">
          <p className="font-display text-3xl leading-tight font-semibold tracking-tight">{heroTitle}</p>
          <p className="mt-3 text-base leading-7 text-text-on-dark">{heroLead}</p>
          <ul className="mt-8 space-y-3">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm leading-6 text-white">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-green text-navy-950">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-text-on-dark">Секция каратэ · кабинет тренера и дневник родителя</p>
      </aside>

      <div className="flex min-h-screen flex-col lg:justify-center lg:bg-surface lg:px-10 lg:py-12 xl:px-16">
        <header className="gradient-hero flex items-center justify-between gap-4 px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-10 text-white lg:hidden">
          <BrandMark variant="parent" size="md" showLabel />
          {showHome && (
            <Link to="/" className="shrink-0 rounded-xl px-3 py-2 text-sm font-semibold text-white/90">
              На главную
            </Link>
          )}
        </header>
        <div className="-mt-6 flex flex-1 flex-col rounded-t-[1.75rem] bg-surface px-5 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-elevated)] sm:px-8 lg:mt-0 lg:flex-none lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none">
          {showHome && (
            <div className="mb-6 hidden lg:block">
              <Link to="/" className="text-sm font-semibold text-text-secondary hover:text-text">
                На главную
              </Link>
            </div>
          )}
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col">{children}</div>
        </div>
      </div>
    </div>
  )
}

export function AuthBack({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Назад к выбору роли"
      className="-ml-2 flex size-12 items-center justify-center rounded-full text-text-secondary hover:bg-surface-muted"
    >
      <IconArrowLeft size={22} />
    </button>
  )
}

export function AuthField({
  id,
  label,
  icon,
  tone = 'parent',
  error,
  hint,
  revealable = false,
  revealLabel = 'пароль',
  ...input
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon?: ReactNode
  tone?: 'coach' | 'parent'
  error?: string
  hint?: string
  revealable?: boolean
  revealLabel?: string
}) {
  const [shown, setShown] = useState(false)
  const describedBy = [hint && !error ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined
  const type = revealable ? (shown ? 'text' : 'password') : input.type

  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-muted">{icon}</span>
        )}
        <input
          {...input}
          id={id}
          type={type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${tone === 'coach' ? 'input-coach' : 'input'} min-h-12 aria-invalid:border-error aria-invalid:focus-visible:border-error aria-invalid:focus-visible:ring-error/40 ${icon ? 'pl-11' : ''} ${revealable ? 'pr-14' : ''}`}
        />
        {revealable && (
          <button
            type="button"
            aria-pressed={shown}
            aria-label={shown ? `Скрыть ${revealLabel}` : `Показать ${revealLabel}`}
            onClick={() => setShown((value) => !value)}
            className="absolute top-1/2 right-0 flex size-12 -translate-y-1/2 items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted hover:text-text"
          >
            {shown ? <IconEyeOff size={18} /> : <IconEye size={18} />}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs leading-5 text-text-secondary">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-error">
          {error}
        </p>
      )}
    </div>
  )
}

export function AuthButton({
  tone,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone: 'coach' | 'parent' }) {
  return (
    <button {...props} className={`${tone === 'coach' ? 'btn-coach' : 'btn-primary'} min-h-12 w-full text-base`}>
      {children}
    </button>
  )
}

export function CodeBoxes({ value, accent }: { value: string; accent: string }) {
  return (
    <div className="flex justify-center gap-2" aria-hidden>
      {Array.from({ length: 6 }, (_, index) => {
        const filled = Boolean(value[index])
        return (
          <span
            key={index}
            className="flex h-12 w-11 items-center justify-center rounded-xl border bg-white text-lg font-semibold text-[#101828]"
            style={{ borderColor: filled ? accent : '#e4e7ec' }}
          >
            {value[index] ?? ''}
          </span>
        )
      })}
    </div>
  )
}

const keypadLetters: Record<string, string> = {
  '2': 'ABC',
  '3': 'DEF',
  '4': 'GHI',
  '5': 'JKL',
  '6': 'MNO',
  '7': 'PQRS',
  '8': 'TUV',
  '9': 'WXYZ',
}

export function OtpKeypad({
  onDigit,
  onDelete,
}: {
  onDigit: (digit: string) => void
  onDelete: () => void
}) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']
  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map((key) => {
        if (!key) return <span key="spacer" />
        if (key === 'del') {
          return (
            <button
              key="del"
              type="button"
              aria-label="Удалить цифру"
              onClick={onDelete}
              className="flex h-14 items-center justify-center rounded-2xl bg-[#f3f5f8] text-lg text-[#344054]"
            >
              ⌫
            </button>
          )
        }
        return (
          <button
            key={key}
            type="button"
            onClick={() => onDigit(key)}
            className="flex h-14 flex-col items-center justify-center rounded-2xl bg-[#f3f5f8] text-[#101828]"
          >
            <span className="text-lg font-semibold leading-none">{key}</span>
            {keypadLetters[key] && (
              <span className="mt-1 text-[9px] tracking-[0.14em] text-[#98a2b3]">{keypadLetters[key]}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function FieldIcon({ children }: { children: ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  )
}
