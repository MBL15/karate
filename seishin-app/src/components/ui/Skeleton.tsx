type SkeletonProps = {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} aria-hidden />
}

export function SkeletonCard() {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="mt-4 h-3 w-full" />
    </div>
  )
}

export function SkeletonHero() {
  return (
    <div className="space-y-4 px-1">
      <Skeleton className="mx-auto h-8 w-40 rounded-full" />
      <Skeleton className="mx-auto h-10 w-48" />
      <div className="rounded-2xl border border-border-light bg-surface p-5">
        <div className="mb-3 flex justify-between">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
      </div>
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 w-20 shrink-0 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
