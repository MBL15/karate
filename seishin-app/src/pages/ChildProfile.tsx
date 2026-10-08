import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { parentApi } from '../api/parent'
import type { ParentChildProfile } from '../api/types'
import { ApiError } from '../api/client'
import { ParentHero } from '../components/parent/ParentHero'
import { ParentPageShell } from '../components/parent/ParentPageShell'
import { ParentError, ParentLoading } from '../components/parent/ParentScreenState'
import { ParentEmptyHint } from '../components/parent/ParentEmptyHint'
import { useAuth } from '../context/AuthContext'
import { useParentChild } from '../context/ParentChildContext'
import { LogoutButton } from '../components/auth/LogoutButton'
import { ProgressBar } from '../components/ui/ProgressBar'
import { initialLetter } from '../utils/format'
import { beltNextDisplayName, beltProgressValue, beltShowsPercent } from '../utils/beltProgress'

export function ChildProfile() {
  const { user } = useAuth()
  const { children, selectedChildId } = useParentChild()
  const [profile, setProfile] = useState<ParentChildProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedChildId) return
    setLoading(true)
    parentApi
      .profile(selectedChildId)
      .then(setProfile)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Ошибка'))
      .finally(() => setLoading(false))
  }, [selectedChildId])

  const title = profile ? `${profile.firstName} ${profile.lastName}` : 'Профиль'
  const subtitle = profile ? `${profile.age} лет · ${profile.clubName}` : undefined
  const firstName = user?.name?.split(' ')[0] || 'Родитель'

  if (children.length === 0) {
    return (
      <div className="mx-auto w-full max-w-lg bg-white px-5 pt-[max(1.25rem,env(safe-area-inset-top,0px))] pb-6">
        <h1 className="text-[1.75rem] font-extrabold text-[#101828]">Профиль</h1>
        <p className="mt-1 text-sm text-[#667085]">{firstName}</p>
        <ParentEmptyHint
          title="Ребёнок ещё не привязан"
          description="После ввода кода от тренера здесь появится карточка ребёнка с поясом и прогрессом."
        />
        <div className="mt-8">
          <LogoutButton />
        </div>
      </div>
    )
  }

  return (
    <ParentPageShell
      title={title}
      subtitle={subtitle}
      childSwitcher
      headerRight={
        <Link to="/app" className="text-sm font-medium text-white/70 hover:text-white">
          Назад
        </Link>
      }
      hero={
        <ParentHero
          eyebrow="Профиль"
          title={title}
          subtitle={subtitle}
          childSwitcher
          switcherRight={
            <Link to="/app" className="text-sm font-medium text-white/70 hover:text-white lg:hidden">
              Назад
            </Link>
          }
          right={
            <Link to="/app" className="hidden text-sm font-medium text-white/70 hover:text-white lg:inline">
              Назад
            </Link>
          }
        >
          {profile && (
            <div className="mt-8 flex flex-col items-center">
              <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-green text-2xl font-extrabold text-white">
                {initialLetter(profile.firstName)}
              </span>
            </div>
          )}
        </ParentHero>
      }
    >
      {!selectedChildId ? (
        <ParentError message="Выберите ребёнка, чтобы открыть профиль" />
      ) : loading ? (
        <ParentLoading />
      ) : error || !profile ? (
        <ParentError message={error ?? 'Нет данных'} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="hidden lg:flex lg:flex-col lg:items-center lg:rounded-2xl lg:border lg:border-border-light lg:bg-surface lg:p-8 lg:shadow-[var(--shadow-card)]">
            <span className="flex size-20 items-center justify-center rounded-2xl bg-brand-green text-3xl font-extrabold text-white">
              {initialLetter(profile.firstName)}
            </span>
            <p className="mt-4 text-lg font-bold text-text">{profile.firstName}</p>
            <p className="text-sm text-text-secondary">{profile.clubName}</p>
          </div>

          <div className="card overflow-hidden p-0">
            <div className="border-b border-border-light bg-surface-muted px-5 py-4 lg:px-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Текущий пояс</p>
                  <p className="mt-1 text-xl font-bold text-text">{profile.beltName}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div
                    className="h-8 w-24 rounded-lg border border-border shadow-inner"
                    style={{ backgroundColor: profile.beltColor }}
                    aria-hidden="true"
                  />
                  <span className="text-[10px] text-text-muted">
                    {profile.maxRank ? 'высший уровень' : `до ${beltNextDisplayName(profile)}`}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-5 lg:p-6">
              <p className="text-sm text-text-secondary">{profile.progressLabel}</p>
              {beltShowsPercent(profile) ? (
                <ProgressBar
                  value={beltProgressValue(profile)}
                  label={
                    profile.beltAssignmentMode === 'ATTENDANCE' && profile.sessionsRequired
                      ? `${profile.sessionsCompleted ?? 0} / ${profile.sessionsRequired} занятий`
                      : 'Прогресс аттестации'
                  }
                  shine
                />
              ) : (
                <p className="mt-4 rounded-xl bg-surface-muted px-4 py-3 text-sm text-text-secondary">
                  Следующий пояс присваивает тренер на аттестации.
                </p>
              )}
              {profile.coachRecommendation && (
                <div className="alert-info mt-5 text-sm">
                  <div>
                    <p className="font-semibold">Рекомендация тренера</p>
                    <p className="mt-1 leading-relaxed">{profile.coachRecommendation}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 max-w-lg">
        <LogoutButton />
      </div>
    </ParentPageShell>
  )
}
