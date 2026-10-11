import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parentApi } from '../api/parent'
import type { Achievement } from '../api/types'
import { AttendanceStats } from '../components/parent/AttendanceStats'
import { ChildDevelopment } from '../components/parent/ChildDevelopment'
import { CompetitionResultsCard } from '../components/parent/CompetitionResultsCard'
import { ParentAlertsSheet } from '../components/parent/ParentAlertsSheet'
import { ParentError, ParentLoading } from '../components/parent/ParentScreenState'
import { ParentTopBar } from '../components/parent/ParentTopBar'
import { PARENT_CARD, PARENT_PAGE } from '../components/parent/parentUi'
import { BadgeToken } from '../components/ui/BadgeToken'
import { IconAward, IconUsers } from '../components/ui/Icons'
import { useParentChild } from '../context/ParentChildContext'
import { useFamilyAlerts } from '../hooks/useFamilyAlerts'
import { useParentChildData } from '../hooks/useParentChildData'
import { childGroupName } from '../utils/childGroup'
import type { ChildCompetitionResult } from '../utils/competitionResults'
import { formatDate } from '../utils/format'

type Tab = 'progress' | 'stats' | 'achievements'

/** Сервер пока не отдаёт итоги соревнований родителю — см. PROJECT_KNOWLEDGE §9. */
const NO_RESULTS: ChildCompetitionResult[] = []

const TABS: { id: Tab; label: string }[] = [
  { id: 'progress', label: 'Развитие' },
  { id: 'stats', label: 'Посещения' },
  { id: 'achievements', label: 'Награды' },
]

function BadgesGrid({ achievements }: { achievements: Achievement[] }) {
  if (achievements.length === 0) {
    return (
      <div className={`${PARENT_CARD} py-10 text-center`}>
        <IconAward size={32} className="mx-auto text-text-muted" />
        <p className="mt-3 font-semibold text-text">Пока нет значков</p>
        <p className="mt-1 text-sm text-text-secondary">Тренер выдаёт их за успехи на тренировках</p>
      </div>
    )
  }
  const sorted = [...achievements].sort((a, b) => Number(b.earnedCount > 0) - Number(a.earnedCount > 0))
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {sorted.map((a) => (
        <div key={a.badgeId} className={`${PARENT_CARD} flex flex-col items-center px-2 text-center`} title={a.description}>
          <BadgeToken name={a.name} size="lg" dim={a.earnedCount === 0} />
          <p className="mt-2 line-clamp-2 text-xs font-semibold leading-tight text-text">{a.name}</p>
          <p className="mt-1 text-[11px] text-text-muted">
            {a.earnedCount > 0 ? `получен ×${a.earnedCount}` : 'ещё не получен'}
          </p>
        </div>
      ))}
    </div>
  )
}

function AchievementsTab({ achievements, results }: { achievements: Achievement[]; results: ChildCompetitionResult[] }) {
  return (
    <div className="space-y-4">
      <CompetitionResultsCard results={results} />
      <h2 className="px-1 font-display text-base font-bold text-text">Значки</h2>
      <BadgesGrid achievements={achievements} />
    </div>
  )
}

export function ParentAthlete() {
  const [params, setParams] = useSearchParams()
  const { selectedChildId } = useParentChild()
  const { home, history, achievements, loading, error, reload } = useParentChildData(selectedChildId)
  const [recommendation, setRecommendation] = useState<string | null>(null)
  const [alertsOpen, setAlertsOpen] = useState(false)
  const wanted = params.get('tab')
  const tab: Tab = TABS.some((t) => t.id === wanted) ? (wanted as Tab) : 'progress'

  useEffect(() => {
    setRecommendation(null)
    if (!selectedChildId) return
    let cancelled = false
    parentApi
      .profile(selectedChildId)
      .then((p) => !cancelled && setRecommendation(p.coachRecommendation))
      .catch(() => !cancelled && setRecommendation(null))
    return () => {
      cancelled = true
    }
  }, [selectedChildId])

  const { count: alerts } = useFamilyAlerts()
  const group = home ? childGroupName(home.nextTraining?.groupName, history) : null

  return (
    <div className={PARENT_PAGE}>
      <ParentTopBar variant="back" alerts={alerts} onBell={() => setAlertsOpen(true)} />

      {home && !loading && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-border-light">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-green-light text-brand-green">
            <IconUsers size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Группа</p>
            {group ? (
              <p className="truncate text-sm font-semibold text-text">{group}</p>
            ) : (
              <p className="text-sm text-text-muted">Пока не назначена — уточните у тренера</p>
            )}
          </div>
          {home.nextTraining && (
            <span className="shrink-0 text-right text-xs text-text-secondary">
              Следующая
              <br />
              <span className="font-semibold text-text">
                {formatDate(home.nextTraining.date)}, {home.nextTraining.startTime.slice(0, 5)}
              </span>
            </span>
          )}
        </div>
      )}

      <div role="tablist" aria-label="Разделы" className="mt-4 grid grid-cols-3 gap-1 rounded-full bg-surface-muted p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setParams(t.id === 'progress' ? {} : { tab: t.id }, { replace: true })}
            className={`min-h-10 rounded-full text-sm font-semibold transition ${
              tab === t.id
                ? 'bg-white text-brand-green shadow-sm ring-1 ring-brand-green/25'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {loading ? (
          <ParentLoading />
        ) : error || !home ? (
          <ParentError message={error ?? 'Нет данных'} onRetry={reload} />
        ) : tab === 'progress' ? (
          <ChildDevelopment home={home} history={history} achievements={achievements} results={NO_RESULTS} recommendation={recommendation} />
        ) : tab === 'stats' ? (
          <AttendanceStats key={selectedChildId} history={history} />
        ) : (
          <AchievementsTab achievements={achievements} results={NO_RESULTS} />
        )}
      </div>

      <ParentAlertsSheet open={alertsOpen} onClose={() => setAlertsOpen(false)} />
    </div>
  )
}
