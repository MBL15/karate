import { useRef, useState, type ChangeEvent } from 'react'
import { LogoutButton } from '../../auth/LogoutButton'
import { IconCheck } from '../../ui/Icons'
import { initials } from './helpers'

function greeting(date: Date) {
  const hour = date.getHours()
  if (hour < 5) return 'Доброй ночи'
  if (hour < 12) return 'Доброе утро'
  if (hour < 18) return 'Добрый день'
  return 'Добрый вечер'
}

export function CoachHeroCard({
  now,
  name,
  clubName,
  photo,
  joinCode,
  onPhoto,
  onRemovePhoto,
}: {
  now: Date
  name: string
  clubName?: string
  photo: string | null
  joinCode?: string | null
  onPhoto: (event: ChangeEvent<HTMLInputElement>) => void
  onRemovePhoto: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const copyCode = async () => {
    if (!joinCode) return
    const ok = await navigator.clipboard
      .writeText(joinCode)
      .then(() => true)
      .catch(() => false)
    if (!ok) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  const pickPhoto = () => {
    setMenuOpen(false)
    fileRef.current?.click()
  }

  return (
    <header className="relative rounded-[1.75rem] bg-gradient-to-br from-navy-950 to-brand-blue p-5 text-white shadow-[0_16px_36px_rgb(11_31_77_/_0.25)]">
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.75rem]" aria-hidden>
        <span className="absolute -top-16 -right-12 size-44 rounded-full bg-white/[0.08]" />
        <span className="absolute -bottom-20 -left-16 size-48 rounded-full bg-white/[0.05]" />
      </span>

      <div className="relative flex items-center gap-3.5">
        <div className="relative shrink-0">
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Фото и аккаунт"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex size-[4.5rem] items-center justify-center overflow-hidden rounded-full bg-white font-display text-2xl font-bold text-brand-blue shadow-[0_6px_16px_rgb(0_0_0_/_0.18)] ring-4 ring-white/20 transition active:scale-95"
          >
            {photo ? <img src={photo} alt="" className="size-full object-cover" /> : initials(name)}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
          {menuOpen && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden />}
          {menuOpen && (
            <div role="menu" className="pop-in absolute top-full left-0 z-20 mt-2 w-56 rounded-2xl border border-border-light bg-white p-2 text-text shadow-[var(--shadow-elevated)]">
              <p className="truncate px-2 pt-1 text-sm font-semibold">{name}</p>
              {clubName && <p className="truncate px-2 text-xs text-text-secondary">{clubName}</p>}
              <button
                type="button"
                role="menuitem"
                onClick={pickPhoto}
                className="mt-2 flex min-h-10 w-full items-center rounded-xl px-2 text-left text-sm font-medium hover:bg-surface-muted"
              >
                {photo ? 'Сменить фото' : 'Загрузить фото'}
              </button>
              {photo && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onRemovePhoto()
                    setMenuOpen(false)
                  }}
                  className="flex min-h-10 w-full items-center rounded-xl px-2 text-left text-sm font-medium text-error hover:bg-error-bg"
                >
                  Убрать фото
                </button>
              )}
              <div className="my-1 h-px bg-border-light" />
              <LogoutButton variant="menu" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white/75">{greeting(now)},</p>
          <h1 className="truncate font-display text-[1.375rem] leading-tight font-bold tracking-tight">{name}</h1>
          {clubName && (
            <p className="mt-1 inline-flex max-w-full items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium">
              <span className="size-1.5 shrink-0 rounded-full bg-[#4ade80]" aria-hidden />
              <span className="truncate">{clubName}</span>
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => void copyCode()}
          disabled={!joinCode}
          aria-label={joinCode ? `Код клуба ${joinCode}. Нажмите, чтобы скопировать` : 'Код клуба'}
          className={`flex shrink-0 flex-col items-center rounded-2xl px-3 py-2 ring-1 backdrop-blur-sm transition active:scale-95 ${
            copied ? 'bg-brand-green/90 ring-white/30' : 'bg-white/10 ring-white/20 hover:bg-white/15'
          }`}
        >
          <span className="text-[10px] font-semibold tracking-wide text-white/70 uppercase">{copied ? 'Скопирован' : 'Код клуба'}</span>
          <span className="mt-0.5 font-mono text-lg leading-none font-bold tracking-[0.12em]">{joinCode ?? '····'}</span>
          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-white/70">
            {copied ? (
              <IconCheck size={11} />
            ) : (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="9" y="9" width="12" height="12" rx="2" />
                <path d="M5 15V5a2 2 0 0 1 2-2h10" />
              </svg>
            )}
            {copied ? 'готово' : 'копировать'}
          </span>
        </button>
      </div>
    </header>
  )
}