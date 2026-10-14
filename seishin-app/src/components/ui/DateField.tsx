import { useEffect, useId, useState } from 'react'

function parseIso(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return date
}

function toIso(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function isoToDisplay(iso: string) {
  const date = parseIso(iso)
  if (!date) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`
}

/** Парсит дд.мм.гггг (также / и -), год 00–99 → 2000–2099. */
export function parseDateText(text: string): string | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  const match = trimmed.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})$/)
  if (!match) return null
  let day = Number(match[1])
  let month = Number(match[2])
  let year = Number(match[3])
  if (year < 100) year += 2000
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null
  return toIso(date)
}

export function DateField({
  id,
  value,
  onChange,
  min,
  max,
  className = 'input-coach',
  placeholder = 'дд.мм.гггг',
  required = false,
  onBlur,
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  className?: string
  placeholder?: string
  required?: boolean
  onBlur?: () => void
}) {
  const errorId = useId()
  const [draft, setDraft] = useState(() => isoToDisplay(value))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDraft(isoToDisplay(value))
    setError(null)
  }, [value])

  const allowed = (iso: string) => (!min || iso >= min) && (!max || iso <= max)

  const commit = (text: string) => {
    const iso = parseDateText(text)
    if (!iso) {
      if (!text.trim() && !required) {
        setError(null)
        return
      }
      setError(text.trim() ? 'Формат: дд.мм.гггг' : 'Укажите дату')
      return
    }
    if (!allowed(iso)) {
      setError('Дата вне допустимого диапазона')
      return
    }
    setError(null)
    onChange(iso)
    setDraft(isoToDisplay(iso))
  }

  return (
    <div className="w-full">
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="bday"
        placeholder={placeholder}
        value={draft}
        onChange={(event) => {
          const next = event.target.value
          setDraft(next)
          setError(null)
          const iso = parseDateText(next)
          if (iso && allowed(iso)) onChange(iso)
        }}
        onBlur={() => {
          commit(draft)
          onBlur?.()
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commit(draft)
          }
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${className} w-full ${error ? 'ring-2 ring-error/30' : ''}`}
      />
      {error ? (
        <p id={errorId} className="mt-1 text-xs font-medium text-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}
