import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

type LogoutButtonProps = {
  className?: string
  variant?: 'profile' | 'header'
  label?: string
}

export function LogoutButton({ className = '', variant = 'profile', label }: LogoutButtonProps) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const text = label ?? (variant === 'header' ? 'Выйти' : 'Выйти из аккаунта')

  const styles =
    variant === 'header'
      ? 'min-h-11 rounded-xl px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10'
      : 'btn-secondary w-full border-error/20 text-error hover:bg-error-bg'

  return (
    <button
      type="button"
      onClick={() => {
        logout()
        navigate('/login')
      }}
      className={`${styles} ${className}`.trim()}
    >
      {text}
    </button>
  )
}
