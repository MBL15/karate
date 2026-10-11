import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useStoredState } from '../../hooks/useStoredState'
import { LOGGED_OUT_FLAG } from '../../utils/session'
import { BottomSheet } from '../ui/BottomSheet'

type LogoutButtonProps = {
  className?: string
  variant?: 'profile' | 'header' | 'menu'
  label?: string
  onOpen?: () => void
}

function LogoutIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="M10 17l-5-5 5-5" />
      <path d="M5 12h11" />
    </svg>
  )
}

export function LogoutButton({ className = '', variant = 'profile', label, onOpen }: LogoutButtonProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [photo] = useStoredState<string | null>('coach-photo', null)
  const isCoach = user?.role === 'COACH'
  const text = label ?? (variant === 'header' ? 'Выйти' : 'Выйти из аккаунта')
  const name = user?.name || (isCoach ? 'Тренер' : 'Родитель')
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  const styles = {
    header: 'min-h-11 rounded-xl px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10',
    profile: 'btn-secondary flex w-full items-center justify-center gap-2 border-error/20 text-error hover:bg-error-bg',
    menu: 'flex min-h-10 w-full items-center gap-2 rounded-xl px-2 text-left text-sm font-medium text-error hover:bg-error-bg',
  }[variant]

  const confirm = () => {
    const role = isCoach ? 'coach' : 'parent'
    setOpen(false)
    sessionStorage.setItem(LOGGED_OUT_FLAG, '1')
    logout()
    navigate(`/login?role=${role}`, { replace: true })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          onOpen?.()
          setOpen(true)
        }}
        className={`${styles} ${className}`.trim()}
      >
        {variant !== 'header' && <LogoutIcon size={16} />}
        {text}
      </button>

      <BottomSheet open={open} titleId="logout-title" onClose={() => setOpen(false)}>
        <div className="flex flex-col items-center pt-2 text-center">
          <span
            className={`flex size-16 items-center justify-center overflow-hidden rounded-full text-xl font-semibold text-white ring-4 ring-white ${
              isCoach ? 'bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] shadow-[var(--shadow-blue)]' : 'bg-brand-green'
            }`}
          >
            {isCoach && photo ? <img src={photo} alt="" className="size-full object-cover" /> : initials}
          </span>
          <h2 id="logout-title" className="mt-4 text-xl font-bold tracking-tight text-text">
            Выйти из аккаунта?
          </h2>
          <p className="mt-1 text-sm font-medium text-text">{name}</p>
          <p className="mt-0.5 text-xs text-text-secondary">{isCoach ? 'Кабинет тренера' : 'Дневник родителя'}</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-text-secondary">
            Данные клуба никуда не денутся. Чтобы вернуться, понадобятся логин и пароль.
          </p>
        </div>
        <div className="mt-6 grid gap-2.5">
          <button
            type="button"
            onClick={confirm}
            className="flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-error text-base font-semibold text-white transition hover:brightness-110 active:scale-[0.99]"
          >
            <LogoutIcon />
            Выйти
          </button>
          <button type="button" onClick={() => setOpen(false)} className="btn-secondary min-h-13 rounded-2xl text-base">
            Остаться
          </button>
        </div>
      </BottomSheet>
    </>
  )
}
