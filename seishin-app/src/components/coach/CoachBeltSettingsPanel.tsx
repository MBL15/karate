import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { coachApi } from '../../api/coach'
import type { BeltAssignmentMode, BeltLevel, BeltSettings } from '../../api/types'
import { ApiError } from '../../api/client'

const MODE_OPTIONS: { value: BeltAssignmentMode; title: string; hint: string }[] = [
  {
    value: 'MANUAL',
    title: 'Только тренер',
    hint: 'Пояс выдаётся на аттестации вручную. Родители видят текущий уровень без шкалы.',
  },
  {
    value: 'ATTENDANCE',
    title: 'По посещаемости',
    hint: 'Прогресс считается по занятиям на текущем поясе. Можно включить автоповышение.',
  },
  {
    value: 'READINESS',
    title: 'Балл готовности',
    hint: 'Посещаемость, значки и рекомендация тренера формируют % до следующего пояса.',
  },
]

type Props = {
  onSaved?: () => void
  compact?: boolean
}

export function CoachBeltSettingsPanel({ onSaved, compact }: Props) {
  const [belts, setBelts] = useState<BeltLevel[]>([])
  const [settings, setSettings] = useState<BeltSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([coachApi.belts(), coachApi.beltSettings()])
      .then(([bl, st]) => {
        setBelts(bl)
        setSettings(st)
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Не удалось загрузить настройки'))
      .finally(() => setLoading(false))
  }, [])

  const saveSettings = async (e: FormEvent) => {
    e.preventDefault()
    if (!settings) return
    setSavingSettings(true)
    setMessage(null)
    setError(null)
    try {
      const saved = await coachApi.updateBeltSettings(settings)
      setSettings(saved)
      setMessage('Правила сохранены — прогресс учеников пересчитан')
      onSaved?.()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка сохранения')
    } finally {
      setSavingSettings(false)
    }
  }

  const saveBeltSessions = async (belt: BeltLevel, raw: string) => {
    const trimmed = raw.trim()
    const sessionsRequired = trimmed === '' ? null : Number(trimmed)
    if (sessionsRequired != null && (Number.isNaN(sessionsRequired) || sessionsRequired < 1)) return
    try {
      const updated = await coachApi.updateBeltLevel(belt.id, sessionsRequired)
      setBelts((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
      setMessage('Норма для уровня обновлена')
      onSaved?.()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось обновить норму')
    }
  }

  if (loading) {
    return <p className="py-6 text-center text-sm text-text-secondary">Загрузка правил поясов…</p>
  }

  if (error && !settings) {
    return <p className="alert-error">{error}</p>
  }

  if (!settings) {
    return null
  }

  return (
    <div className={compact ? 'space-y-4' : 'space-y-5'}>
      {message && <p className="alert-success">{message}</p>}
      {error && settings && <p className="alert-error">{error}</p>}

      <p className="text-sm text-text-secondary">
        Настройка действует на весь клуб. Родители видят текущий пояс и прогресс по выбранному правилу.
      </p>

      <form onSubmit={saveSettings} className="space-y-5">
        <div className={`grid gap-3 ${compact ? '' : 'lg:grid-cols-3'}`}>
          {MODE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`cursor-pointer rounded-xl border p-4 transition ${
                settings.assignmentMode === opt.value
                  ? 'border-brand-blue bg-brand-blue/5 ring-1 ring-brand-blue/30'
                  : 'border-border-light bg-surface-muted hover:border-brand-blue/20'
              }`}
            >
              <input
                type="radio"
                name="beltMode"
                className="sr-only"
                checked={settings.assignmentMode === opt.value}
                onChange={() => setSettings({ ...settings, assignmentMode: opt.value })}
              />
              <p className="font-semibold text-text">{opt.title}</p>
              <p className="mt-2 text-xs leading-relaxed text-text-secondary">{opt.hint}</p>
            </label>
          ))}
        </div>

        {settings.assignmentMode === 'ATTENDANCE' && (
          <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border-light bg-surface-muted p-4">
            <div>
              <label className="label">Занятий на пояс (по умолчанию)</label>
              <input
                type="number"
                min={1}
                max={500}
                className="input-coach w-28"
                value={settings.sessionsRequired}
                onChange={(e) => setSettings({ ...settings, sessionsRequired: Number(e.target.value) || 1 })}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
              <input
                type="checkbox"
                checked={settings.autoPromote}
                onChange={(e) => setSettings({ ...settings, autoPromote: e.target.checked })}
                className="size-4 rounded border-border"
              />
              Автоматически повышать пояс при выполнении нормы
            </label>
          </div>
        )}

        <button type="submit" className="btn-coach w-full sm:w-auto" disabled={savingSettings}>
          {savingSettings ? 'Сохранение…' : 'Сохранить правила'}
        </button>
      </form>

      {settings.assignmentMode === 'ATTENDANCE' && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Норма по уровням (пусто — клубная)
          </p>
          <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto">
            {belts.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border-light px-3 py-2"
              >
                <span
                  className="min-w-[100px] text-sm font-medium"
                  style={{ borderLeft: `4px solid ${b.color}`, paddingLeft: 8 }}
                >
                  {b.sortOrder}. {b.name}
                </span>
                <input
                  type="number"
                  min={1}
                  placeholder={String(settings.sessionsRequired)}
                  className="input-coach w-24 text-sm"
                  defaultValue={b.sessionsRequired ?? ''}
                  onBlur={(e) => saveBeltSessions(b, e.target.value)}
                />
                <span className="text-xs text-text-muted">занятий до следующего</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
