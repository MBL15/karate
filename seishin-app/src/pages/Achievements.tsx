import { useCallback, useEffect, useState } from 'react'
import { parentApi } from '../api/parent'
import type { Achievement } from '../api/types'
import { ApiError } from '../api/client'
import { ParentHero } from '../components/parent/ParentHero'
import { ParentPageShell } from '../components/parent/ParentPageShell'
import { ParentError, ParentLoading } from '../components/parent/ParentScreenState'
import { EmptyState } from '../components/ui/EmptyState'
import { IconAward, IconCheck } from '../components/ui/Icons'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StatCard } from '../components/ui/StatCard'
import { useParentChild } from '../context/ParentChildContext'

function AchievementCard({ item }: { item: Achievement }) {
  const pct = item.requiredCount > 0 ? (item.earnedCount / item.requiredCount) * 100 : 0

  return (
    <div
      className={`card overflow-hidden p-0 transition ${
        item.completed ? 'achievement-completed ring-1 ring-brand-green/20' : ''
      }`}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div
            className={`relative flex size-14 shrink-0 items-center justify-center rounded-2xl ${
              item.completed ? 'bg-warning-bg text-warning' : 'bg-surface-muted text-text-muted'
            }`}
          >
            <IconAward size={28} />
            {item.completed && (
              <span className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full bg-brand-green text-white">
                <IconCheck size={12} />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="font-bold text-text">{item.name}</p>
              {item.completed && <span className="badge-success shrink-0">Получено</span>}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">{item.description}</p>
          </div>
        </div>

        <div className="mt-4">
          <ProgressBar
            value={pct}
            label={`${item.earnedCount} из ${item.requiredCount}`}
            showPercent={!item.completed}
            variant={item.completed ? 'green' : 'blue'}
            size="sm"
          />
        </div>
      </div>
    </div>
  )
}

export function Achievements() {
  const { selectedChild, selectedChildId } = useParentChild()
  const [items, setItems] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!selectedChildId) return
    setLoading(true)
    setError(null)
    parentApi
      .achievements(selectedChildId)
      .then(setItems)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Ошибка'))
      .finally(() => setLoading(false))
  }, [selectedChildId])

  useEffect(() => {
    load()
  }, [load])

  const earned = items.filter((a) => a.completed).length
  const points = items.reduce((sum, a) => sum + a.earnedCount * 10, 0)
  const subtitle = selectedChild ? `${selectedChild.firstName} · достижения и прогресс` : 'Достижения и прогресс'

  const stats = [
    { value: earned, label: 'получено' },
    { value: items.length, label: 'всего' },
    { value: points, label: 'баллов' },
  ]

  return (
    <ParentPageShell
      title="Награды"
      subtitle={subtitle}
      childSwitcher
      hero={
        <ParentHero eyebrow="Дневник" title="Награды" subtitle={subtitle} childSwitcher>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/10 px-2 py-3 text-center backdrop-blur-sm"
              >
                <p className="text-xl font-extrabold text-white">{loading ? '—' : stat.value}</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </ParentHero>
      }
    >
      {!selectedChildId ? (
        <ParentError message="Выберите ребёнка, чтобы посмотреть награды" />
      ) : loading ? (
        <ParentLoading />
      ) : error ? (
        <ParentError message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<IconAward size={32} className="text-text-muted" />}
          title="Пока нет наград"
          description="Они появятся после занятий — тренер выдаёт бейджи за успехи на тренировках"
        />
      ) : (
        <>
          <div className="hidden gap-4 sm:grid sm:grid-cols-3 lg:grid">
            <StatCard label="Получено" value={earned} accent="green" />
            <StatCard label="Всего наград" value={items.length} accent="blue" />
            <StatCard label="Баллов" value={points} accent="amber" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {items.map((item, i) => {
              const stagger = ['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4'][i % 4]
              return (
                <div key={item.badgeId} className={`fade-in-up ${stagger}`}>
                  <AchievementCard item={item} />
                </div>
              )
            })}
          </div>
        </>
      )}
    </ParentPageShell>
  )
}
