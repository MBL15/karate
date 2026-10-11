import { useState } from 'react'
import { useStoredState } from '../../../hooks/useStoredState'
import { IconClipboard, IconPlus } from '../../ui/Icons'

export const TOPICS_KEY = 'training-topics'

export type TrainingTopicEntry = { title: string; text: string; updatedAt: string }
export type TrainingTopics = Record<string, TrainingTopicEntry>

const SUGGESTIONS = ['Кихон', 'Ката', 'Кумитэ', 'ОФП', 'Растяжка', 'Подготовка к аттестации']
const TITLE_MAX = 60
const TEXT_MAX = 240

export function TrainingTopic({ eventKey, planned = false }: { eventKey: string; planned?: boolean }) {
  const label = planned ? 'План тренировки' : 'Тема тренировки'
  const [topics, setTopics] = useStoredState<TrainingTopics>(TOPICS_KEY, {})
  const saved = topics[eventKey]
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')

  const start = () => {
    setTitle(saved?.title ?? '')
    setText(saved?.text ?? '')
    setEditing(true)
  }

  const save = () => {
    const t = title.trim()
    const d = text.trim()
    setTopics((all) => {
      const next = { ...all }
      if (!t && !d) delete next[eventKey]
      else next[eventKey] = { title: t, text: d, updatedAt: new Date().toISOString() }
      return next
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <section className="mt-3 rounded-3xl border border-brand-blue/20 bg-white p-4">
        <p className="text-sm font-bold text-text">{label}</p>
        {planned && <p className="mt-0.5 text-xs text-text-secondary">Пока тему видите только вы — родителям она придёт после обновления сервера</p>}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setTitle((v) => (v.trim() ? `${v.trim()}, ${s}` : s).slice(0, TITLE_MAX))}
              className="rounded-full bg-surface-muted px-3 py-1.5 text-xs font-semibold text-text-secondary transition active:scale-95"
            >
              {s}
            </button>
          ))}
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
          placeholder="Например: Ката Пинан Нидан"
          aria-label="Тема тренировки"
          className="mt-3 min-h-11 w-full rounded-xl border border-border-light bg-white px-3 text-sm font-semibold text-text outline-none focus:border-brand-blue/50 focus:ring-4 focus:ring-brand-blue/10"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, TEXT_MAX))}
          rows={3}
          placeholder={planned ? 'Коротко: что будем отрабатывать, что взять с собой' : 'Коротко: что отрабатывали, что задать на дом'}
          aria-label="Описание тренировки"
          className="mt-2 w-full resize-none rounded-xl border border-border-light bg-white px-3 py-2.5 text-sm text-text outline-none focus:border-brand-blue/50 focus:ring-4 focus:ring-brand-blue/10"
        />
        <p className="text-right text-[11px] text-text-muted tabular-nums">
          {text.length}/{TEXT_MAX}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="min-h-11 rounded-2xl bg-surface-muted text-sm font-semibold text-text-secondary"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={save}
            className="min-h-11 rounded-2xl bg-brand-blue text-sm font-semibold text-white transition active:scale-[0.98]"
          >
            Сохранить
          </button>
        </div>
      </section>
    )
  }

  if (saved) {
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
          <span className="block font-semibold text-text">{saved.title || 'Без названия'}</span>
          {saved.text && <span className="mt-0.5 block text-sm leading-snug text-text-secondary">{saved.text}</span>}
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
