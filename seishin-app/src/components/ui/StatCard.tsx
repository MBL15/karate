type StatCardProps = {
  value: string | number
  label: string
  accent?: 'green' | 'blue' | 'amber' | 'default'
  hint?: string
}

const accents = {
  green: { border: 'border-l-brand-green', value: 'text-brand-green' },
  blue: { border: 'border-l-brand-blue', value: 'text-brand-blue' },
  amber: { border: 'border-l-warning', value: 'text-warning' },
  default: { border: 'border-l-border', value: 'text-text' },
}

export function StatCard({ value, label, accent = 'default', hint }: StatCardProps) {
  const style = accents[accent]
  return (
    <div className={`card border-l-4 p-5 ${style.border}`}>
      <p className={`text-3xl font-bold tracking-tight ${style.value}`}>{value}</p>
      <p className="mt-1 text-sm font-medium text-text">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-text-muted">{hint}</p>}
    </div>
  )
}
