import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { parentApi } from '../api/parent'
import type { UpcomingCompetition } from '../api/types'
import { ApiError } from '../api/client'
import { ParentHero } from '../components/parent/ParentHero'
import { ParentPageShell } from '../components/parent/ParentPageShell'
import { ParentError, ParentLoading } from '../components/parent/ParentScreenState'
import { IconActivity, IconCalendar, IconMapPin } from '../components/ui/Icons'
import { ParentEmptyHint } from '../components/parent/ParentEmptyHint'
import { useParentChild } from '../context/ParentChildContext'
import { formatDate } from '../utils/format'

export function CompetitionInvite() {
  const navigate = useNavigate()
  const { children, selectedChildId, selectedChild } = useParentChild()
  const [competition, setCompetition] = useState<UpcomingCompetition | null>(null)
  const [weight, setWeight] = useState('32')
  const [discipline, setDiscipline] = useState<'KATA' | 'KUMITE'>('KATA')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    parentApi
      .competitions()
      .then((list) => setCompetition(list[0] ?? null))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Ошибка'))
      .finally(() => setLoading(false))
  }, [])

  const respond = async (status: 'CONFIRMED' | 'DECLINED') => {
    if (!competition || !selectedChildId) return
    setSubmitting(true)
    setError(null)
    setMessage(null)
    try {
      await parentApi.respondCompetition(competition.competitionId, {
        studentId: selectedChildId,
        rsvpStatus: status,
        weightKg: status === 'CONFIRMED' ? Number(weight.replace(',', '.')) : undefined,
        discipline: status === 'CONFIRMED' ? discipline : undefined,
      })
      setMessage(status === 'CONFIRMED' ? 'Вы записаны на соревнование' : 'Ответ сохранён')
      setTimeout(() => navigate('/app'), 1200)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось отправить ответ')
    } finally {
      setSubmitting(false)
    }
  }

  const title = competition?.name ?? 'Соревнование'
  const subtitle = competition
    ? `${formatDate(competition.eventDate)} · ${selectedChild?.firstName ?? 'ребёнок'}`
    : undefined

  if (children.length === 0) {
    return (
      <div className="mx-auto w-full max-w-lg bg-white px-5 pt-[max(1.25rem,env(safe-area-inset-top,0px))] pb-6">
        <h1 className="text-[1.75rem] font-extrabold text-[#101828]">События</h1>
        <p className="mt-1 text-sm text-[#667085]">Турниры и мероприятия секции</p>
        <ParentEmptyHint
          title="Сначала привяжите ребёнка"
          description="После привязки здесь появятся приглашения на соревнования и ответы тренеру."
        />
      </div>
    )
  }

  return (
    <ParentPageShell
      title={title}
      subtitle={subtitle}
      headerRight={
        <Link to="/app" className="text-sm font-medium text-white/70 hover:text-white">
          Назад
        </Link>
      }
      hero={
        <ParentHero
          eyebrow={competition ? 'Приглашение' : 'Соревнование'}
          title={title}
          subtitle={subtitle}
          childSwitcher
          switcherRight={
            <Link to="/app" className="text-sm font-medium text-white/70 hover:text-white">
              Назад
            </Link>
          }
        />
      }
    >
      {loading ? (
        <ParentLoading />
      ) : error && !competition ? (
        <ParentError message={error} />
      ) : !competition ? (
        <ParentError message="Нет активных приглашений" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-5 lg:p-6">
            <p className="font-bold text-text">Приглашён {selectedChild?.firstName ?? 'ребёнок'}</p>
            <ul className="mt-4 space-y-3 text-sm text-text">
              <li className="flex items-center gap-3 text-text-secondary">
                <span className="flex size-9 items-center justify-center rounded-xl bg-brand-green-light text-brand-green">
                  <IconCalendar size={18} />
                </span>
                <span className="text-text">{formatDate(competition.eventDate)}, 09:00</span>
              </li>
              <li className="flex items-center gap-3 text-text-secondary">
                <span className="flex size-9 items-center justify-center rounded-xl bg-brand-blue-light text-brand-blue">
                  <IconMapPin size={18} />
                </span>
                <span className="text-text">Спорткомплекс Karate Hub</span>
              </li>
              <li className="flex items-center gap-3 text-text-secondary">
                <span className="flex size-9 items-center justify-center rounded-xl bg-warning-bg text-warning">
                  <IconActivity size={18} />
                </span>
                <span className="text-text">{discipline === 'KATA' ? 'Ката' : 'Кумитэ'}</span>
              </li>
            </ul>
          </div>

          <div className="card p-5 lg:p-6">
            <label className="font-bold text-text" htmlFor="invite-weight">Актуальный вес ребёнка</label>
            <p id="invite-weight-hint" className="mt-1 text-sm text-text-secondary">Нужен для определения весовой категории</p>
            <div className="mt-4 flex gap-3">
              <input
                id="invite-weight"
                type="text"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                aria-describedby="invite-weight-hint"
                className="input flex-1 text-lg font-semibold"
              />
              <span className="self-center text-sm text-text-secondary">кг</span>
            </div>
            <div className="mt-4 flex gap-2" role="group" aria-label="Дисциплина">
              {(['KATA', 'KUMITE'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDiscipline(d)}
                  aria-pressed={discipline === d}
                  className={`min-h-11 flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                    discipline === d ? 'bg-brand-green text-white' : 'bg-surface-muted text-text-secondary'
                  }`}
                >
                  {d === 'KATA' ? 'Ката' : 'Кумитэ'}
                </button>
              ))}
            </div>
          </div>

          {error && <p role="alert" className="alert-error lg:col-span-2">{error}</p>}
          {message && <p role="status" className="alert-success lg:col-span-2">{message}</p>}

          <div className="flex gap-3 pb-2 lg:col-span-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => respond('DECLINED')}
              className="btn-secondary flex-1 lg:max-w-xs"
            >
              Не участвуем
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => respond('CONFIRMED')}
              className="btn-primary flex-1 lg:max-w-xs"
            >
              Участвуем
            </button>
          </div>
        </div>
      )}
    </ParentPageShell>
  )
}
