import { useNavigate } from 'react-router-dom'
import { IconArrowLeft } from '../ui/Icons'

export function BackButton({ fallback = '/app' }: { fallback?: string }) {
  const navigate = useNavigate()
  const canGoBack = ((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0

  return (
    <button
      type="button"
      onClick={() => (canGoBack ? navigate(-1) : navigate(fallback))}
      aria-label="Назад"
      className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-full text-text transition hover:bg-surface-muted active:scale-95"
    >
      <IconArrowLeft size={22} />
    </button>
  )
}
