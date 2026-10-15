import { useEffect, useState } from 'react'
import { coachApi } from '../../../api/coach'
import { ApiError } from '../../../api/client'
import { IconClipboard, IconPlus } from '../../ui/Icons'
import { TopicPickedBlocksBar } from '../../../utils/trainingPlanBlocks'

export const TOPICS_KEY = 'training-topics'

export type TrainingTopicEntry = { title: string; text: string; updatedAt: string }
export type TrainingTopics = Record<string, TrainingTopicEntry>

const SUGGESTIONS = ['Кихон', 'Ката', 'Кумитэ', 'ОФП', 'Растяжка', 'Подготовка к аттестации']
const TITLE_MAX = 60
const TEXT_MAX = 240

function parseTopicTitle(title: string) {
  const picked: string[] = []
  const custom: string[] = []
  for (const part of title.split(/,\s*/).map((s) => s.trim()).filter(Boolean)) {
    if (SUGGESTIONS.includes(part)) picked.push(part)
    else custom.push(part)
  }
  return { picked, custom: custom.join(', ') }
}

function buildTopicTitle(picked: string[], custom: string) {
  const parts = [...picked]
  const extra = custom.trim()
  if (extra) parts.push(extra)
  return parts.join(', ').slice(0, TITLE_MAX)
}

function TopicTags({ title, className = '' }: { title: string; className?: string }) {
  const { picked, custom } = parseTopicTitle(title)
  if (picked.length === 0 && !custom) return null
  return (
    <span className={`flex flex-wrap gap-1.5 ${className}`}>
      {picked.map((tag) => (
        <span key={tag} className="rounded-full bg-brand-blue-light px-2.5 py-1 text-xs font-semibold text-brand-blue">
          {tag}
        </span>
      ))}
      {custom && <span className="text-sm font-semibold text-text">{custom}</span>}
    </span>
  )
}

export function TrainingTopic({
  groupId,
  sessionDate,
  startTime,
  planned = false,
}: {
  groupId: number
  sessionDate: string
  startTime: string
  planned?: boolean
}) {
  const label = planned ? 'План тренировки' : 'Тема тренировки'
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [customTitle, setCustomTitle] = useState('')
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    coachApi
      .sessionPlan(groupId, sessionDate, startTime)
      .then((plan) => {
        if (!alive || !plan) return
        setTitle(plan.topicTitle ?? '')
        setText(plan.topicText ?? '')
      })
      .catch(() => undefined)
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [groupId, sessionDate, startTime])

  const start = () => {
    const parsed = parseTopicTitle(title)
    setPicked(parsed.picked)
    setCustomTitle(parsed.custom)
    setEditing(true)
    setError(null)
  }

  const cancel = () => {
    const parsed = parseTopicTitle(title)
    setPicked(parsed.picked)
    setCustomTitle(parsed.custom)
    setEditing(false)
    setError(null)
  }

  const toggleTag = (tag: string) => {
    setPicked((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const save = async () => {
    const t = buildTopicTitle(picked, customTitle).trim()
    const d = text.trim()
    setError(null)
    try {
      await coachApi.saveSessionPlan({
        groupId,
        sessionDate,
        startTime,
        topicTitle: t || null,
        topicText: d || null,
      })
      setTitle(t)
      setText(d)
      setEditing(false)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось сохранить тему')
    }
  }

  const hasContent = Boolean(title.trim() || text.trim())

  if (loading && !hasContent) {
    return null
  }

  if (editing) {
    return (
      <section className="mt-3 overflow-hidden rounded-3xl border border-brand-blue/20 bg-white">
        <div className="border-b border-border-light px-4 py-3">
          <p className="text-sm font-bold text-text">{label}</p>
          <p className="mt-0.5 text-xs text-text-secondary">Нажмите блоки ещё раз, чтобы убрать. Родители увидят план в карточке тренировки.</p>
          {error && <p className="mt-2 text-xs font-medium text-error">{error}</p>}
        </div>

        <div className="bg-surface-muted px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Блоки занятия</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => {
              const on = picked.includes(s)
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleTag(s)}
                  aria-pressed={on}
                  className={`min-h-9 rounded-full px-3.5 text-xs font-semibold transition active:scale-95 ${
                    on ? 'bg-brand-blue text-white shadow-[var(--shadow-blue)]' : 'bg-white text-text-secondary'
                  }`}
                >
                  {s}
                </button>
              )
            })}
          </div>
          {picked.length > 0 && (
            <>
              <TopicPickedBlocksBar picked={picked} className="mt-3" />
              <p className="mt-2.5 text-xs text-text-secondary">
                В плане:{' '}
                <span className="font-semibold text-text">{picked.join(', ')}</span>
              </p>
            </>
          )}
          {customTitle.trim() && (
            <p className="mt-2 text-xs text-text-secondary">
              Уточнение: <span className="font-semibold text-text">{customTitle.trim()}</span>
            </p>
          )}
        </div>

        <div className="space-y-2 px-4 py-3">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Уточнение <span className="font-normal normal-case text-text-muted">(необязательно)</span>
          </label>
          <input
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value.slice(0, TITLE_MAX))}
            placeholder="Например: Пинан Нидан, спарринг лёгкий"
            aria-label="Уточнение к плану"
            className="min-h-11 w-full rounded-xl border border-border-light bg-white px-3 text-sm font-semibold text-text outline-none focus:border-brand-blue/50 focus:ring-4 focus:ring-brand-blue/10"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, TEXT_MAX))}
            rows={3}
            placeholder={
              planned ? 'Коротко: что будем отрабатывать, что взять с собой' : 'Коротко: что отрабатывали на занятии'
            }
            aria-label="Описание тренировки"
            className="w-full resize-none rounded-xl border border-border-light bg-white px-3 py-2.5 text-sm text-text outline-none focus:border-brand-blue/50 focus:ring-4 focus:ring-brand-blue/10"
          />
          <p className="text-right text-[11px] text-text-muted tabular-nums">
            {text.length}/{TEXT_MAX}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-border-light px-4 py-3">
          <button
            type="button"
            onClick={cancel}
            className="min-h-11 rounded-2xl bg-surface-muted text-sm font-semibold text-text-secondary"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => void save()}
            className="min-h-11 rounded-2xl bg-brand-blue text-sm font-semibold text-white transition active:scale-[0.98]"
          >
            Сохранить
          </button>
        </div>
      </section>
    )
  }

  if (hasContent) {
    const parsed = parseTopicTitle(title)
    const showTags = parsed.picked.length > 0 || parsed.custom
    return (
      <button
        type="button"
        onClick={start}
        className="mt-3 flex w-full items-start gap-3 rounded-3xl bg-surface-muted p-4 text-left transition active:scale-[0.99]"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-blue">
          <IconClipboard size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted">{label}</span>
          {showTags ? (
            <>
              <TopicTags title={title} className="mt-1.5" />
              {parsed.picked.length > 0 && (
                <>
                  <TopicPickedBlocksBar picked={parsed.picked} className="mt-2.5" tall={false} />
                  <span className="mt-1.5 block text-xs text-text-secondary">
                    В плане: <span className="font-semibold text-text">{parsed.picked.join(', ')}</span>
                  </span>
                </>
              )}
            </>
          ) : (
            <span className="block font-semibold text-text">{title.trim() || 'Без названия'}</span>
          )}
          {text.trim() && <span className="mt-1.5 block text-sm leading-snug text-text-secondary">{text.trim()}</span>}
        </span>
        <span className="shrink-0 text-xs font-semibold text-brand-blue">Изменить</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={start}
      className="mt-3 flex min-h-12 w-full items-center gap-3 rounded-3xl border border-dashed border-border px-4 text-left text-sm font-semibold text-brand-blue transition active:scale-[0.99]"
    >
      <IconPlus size={16} />
      {planned ? 'Запланировать тему занятия' : 'Добавить тему и краткое описание'}
    </button>
  )
}
