import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { DateField } from '../ui/DateField'
import { IconArrowLeft, IconEye, IconEyeOff } from '../ui/Icons'

export const coachAccent = '#2563eb'
export const parentAccent = '#16a34a'

export type Tone = 'coach' | 'parent'

export function AuthShell({ children, top }: { children: ReactNode; top?: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-white sm:items-center sm:justify-center sm:bg-surface-muted sm:px-6 sm:py-10">
      <img
        src="/assets/landing/hero-desktop.jpg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 hidden h-2/3 w-full object-cover object-bottom opacity-50 [mask-image:linear-gradient(to_top,black_55%,transparent)] sm:block"
      />
      <div className="flex w-full flex-1 flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:max-w-md sm:flex-none sm:rounded-[2rem] sm:border sm:border-border-light sm:bg-white sm:px-8 sm:py-8 sm:shadow-[var(--shadow-elevated)]">
        {top}
        <div className="flex flex-1 flex-col">{children}</div>
      </div>
    </div>
  )
}

export function AuthBack({ onClick, label = 'Назад' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="-ml-2 flex size-11 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted hover:text-text"
    >
      <IconArrowLeft size={22} />
    </button>
  )
}

export function RoleIcon({ tone, children, size = 'lg' }: { tone: Tone; children: ReactNode; size?: 'md' | 'lg' }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full ${size === 'lg' ? 'size-16' : 'size-14'} ${
        tone === 'coach' ? 'bg-brand-blue-light text-brand-blue' : 'bg-brand-green-light text-brand-green'
      }`}
    >
      {children}
    </span>
  )
}

export function AuthDateField({
  id,
  label,
  value,
  onChange,
  onBlur,
  min,
  max,
  tone = 'parent',
  error,
  required,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  min?: string
  max?: string
  tone?: Tone
  error?: string
  required?: boolean
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <DateField
        id={id}
        value={value}
        min={min}
        max={max}
        required={required}
        className={`${tone === 'coach' ? 'input-coach' : 'input'} min-h-12`}
        onChange={onChange}
        onBlur={onBlur}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-error">
          {error}
        </p>
      )}
    </div>
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
  tone?: Tone
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
          className={`${tone === 'coach' ? 'input-coach' : 'input'} min-h-12 text-base sm:text-sm aria-invalid:border-error aria-invalid:focus-visible:border-error aria-invalid:focus-visible:ring-error/40 ${icon ? 'pl-11' : ''} ${revealable ? 'pr-14' : ''}`}
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
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone: Tone }) {
  return (
    <button {...props} className={`${tone === 'coach' ? 'btn-coach' : 'btn-primary'} min-h-13 w-full rounded-2xl text-base`}>
      {children}
    </button>
  )
}

export function CodeBoxes({ value, accent }: { value: string; accent: string }) {
  return (
    <div className="flex justify-center gap-1.5 sm:gap-2" aria-hidden>
      {Array.from({ length: 6 }, (_, index) => {
        const filled = Boolean(value[index])
        return (
          <span
            key={index}
            className="flex h-14 max-w-12 min-w-0 flex-1 items-center justify-center rounded-xl border-2 bg-white text-xl font-semibold text-text transition-colors"
            style={{ borderColor: filled ? accent : '#e2e8f0' }}
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

export function FormSummary({
  summaryRef,
  title,
  items,
}: {
  summaryRef: React.RefObject<HTMLDivElement | null>
  title: string
  items: { id?: string; message: string }[]
}) {
  if (items.length === 0) return null
  return (
    <div ref={summaryRef} tabIndex={-1} role="alert" aria-labelledby="auth-error-title" className="mt-4 rounded-xl bg-error-bg px-4 py-3 text-sm text-error outline-none">
      <h2 id="auth-error-title" className="font-semibold">
        {title}
      </h2>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={`${item.id ?? 'server'}-${item.message}`}>
            {item.id ? (
              <a href={`#${item.id}`} className="underline underline-offset-2">
                {item.message}
              </a>
            ) : (
              item.message
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function LockIcon() {
  return (
    <FieldIcon>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </FieldIcon>
  )
}

export function FieldIcon({ children }: { children: ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  )
}
