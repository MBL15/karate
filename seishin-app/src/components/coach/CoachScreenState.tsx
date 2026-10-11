import { SkeletonDashboard } from '../ui/Skeleton'

export function CoachLoading() {
  return (
    <div role="status" aria-label="Загрузка">
      <SkeletonDashboard />
    </div>
  )
}

export function CoachError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card flex flex-col items-center p-8 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-error-bg text-2xl" aria-hidden>
        ⚠️
      </span>
      <p className="mt-4 font-semibold text-text">Не удалось загрузить</p>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-secondary">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-coach mt-6">
          Попробовать снова
        </button>
      )}
    </div>
  )
}
