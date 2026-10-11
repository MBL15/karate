import { useState, type FormEvent } from 'react'
import { coachApi } from '../../api/coach'
import { ApiError } from '../../api/client'
import type { GroupSummary } from '../../api/types'
import { useStoredState } from '../../hooks/useStoredState'
import { EMPTY_GROUP_EDITS, GROUP_EDITS_KEY, type GroupEdits } from '../../utils/groupEdits'
import { BottomSheet } from '../ui/BottomSheet'
import { IconCheck, IconPlus, IconX } from '../ui/Icons'

const SUGGESTIONS = ['Младшая 5–7 лет', 'Средняя 8–11 лет', 'Старшая 12–15 лет', 'Взрослые', 'Начинающие', 'Соревновательная']

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

export function GroupQuickSheet({
  open,
  groups,
  onClose,
  onCreated,
}: {
  open: boolean
  groups: GroupSummary[]
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [added, setAdded] = useState<GroupSummary[]>([])
  const [edits, setEdits] = useStoredState<GroupEdits>(GROUP_EDITS_KEY, EMPTY_GROUP_EDITS)
  const [confirming, setConfirming] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const all = [...groups, ...added.filter((a) => !groups.some((g) => g.id === a.id))]
  const visible = all.filter((g) => !edits.hidden.includes(g.id))
  const findVisible = (title: string) => visible.find((g) => same(g.name, title))
  const confirmGroup = visible.find((g) => g.id === confirming)

  const create = async (value: string) => {
    const title = value.trim()
    if (!title || findVisible(title)) return
    setError(null)
    setConfirming(null)
    const hidden = all.find((g) => edits.hidden.includes(g.id) && same(g.name, title))
    if (hidden) {
      setEdits((e) => ({ ...e, hidden: e.hidden.filter((id) => id !== hidden.id) }))
      setName('')
      return
    }
    setSaving(true)
    try {
      const group = await coachApi.createGroup(title)
      setAdded((list) => [...list, group])
      setName('')
      onCreated()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось создать группу')
    } finally {
      setSaving(false)
    }
  }

  const remove = (group: GroupSummary, confirmed = false) => {
    if (group.assistantAccess) {
      setError('Эту группу ведёт другой тренер — удалить её может только он')
      return
    }
    if (group.studentCount > 0 && !confirmed) {
      setConfirming(group.id)
      return
    }
    setEdits((e) => {
      const members = { ...e.members }
      delete members[group.id]
      return { hidden: [...e.hidden, group.id], members }
    })
    setConfirming(null)
    setError(null)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void create(name)
  }

  return (
    <BottomSheet open={open} titleId="group-quick-title" onClose={onClose}>
      <div className="flex items-center gap-2">
        <h2 id="group-quick-title" className="flex-1 text-xl font-bold tracking-tight text-text">
          Группы клуба
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="flex size-10 items-center justify-center rounded-full bg-surface-muted text-text-secondary transition hover:bg-surface-subtle"
        >
          <IconX size={18} />
        </button>
      </div>
      <p className="mt-1 text-sm text-text-secondary">Создайте группы, по которым занимаются ученики. Расписание поставим следующим шагом.</p>

      <form onSubmit={submit} className="mt-5 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название группы"
          className="input-coach flex-1"
          aria-label="Название группы"
        />
        <button type="submit" disabled={saving || !name.trim()} className="btn-coach min-h-12 shrink-0 rounded-2xl px-4" aria-label="Создать группу">
          <IconPlus size={18} />
        </button>
      </form>

      <p className="mt-4 text-xs font-semibold tracking-wide text-text-muted uppercase">Быстрый выбор</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => {
          const group = findVisible(s)
          return (
            <button
              key={s}
              type="button"
              disabled={saving}
              aria-pressed={Boolean(group)}
              onClick={() => (group ? remove(group) : void create(s))}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition active:scale-95 ${
                group ? 'bg-brand-green-light text-brand-green hover:bg-error-bg hover:text-error' : 'bg-surface-muted text-text hover:bg-brand-blue-light hover:text-brand-blue'
              }`}
            >
              {group ? <IconCheck size={14} /> : <IconPlus size={14} />}
              {s}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-xs text-text-muted">Выбрали лишнее? Нажмите на группу ещё раз, чтобы убрать её.</p>

      {confirmGroup && (
        <div className="pop-in mt-3 rounded-2xl bg-error-bg p-3">
          <p className="text-sm font-semibold text-error">Убрать группу «{confirmGroup.name}»?</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            В ней {confirmGroup.studentCount} уч. — они останутся в клубе. Группа скроется только у вас, родители пока
            продолжат видеть её тренировки.
          </p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setConfirming(null)} className="btn-secondary min-h-10 flex-1 rounded-xl bg-white">
              Оставить
            </button>
            <button
              type="button"
              onClick={() => remove(confirmGroup, true)}
              className="min-h-10 flex-1 rounded-xl bg-error font-semibold text-white transition active:scale-[0.98]"
            >
              Убрать
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-3 rounded-2xl bg-error-bg px-4 py-3 text-sm font-medium text-error">{error}</p>}

      {visible.length > 0 && (
        <div className="mt-5 rounded-2xl bg-surface-muted p-3">
          <p className="text-xs font-semibold tracking-wide text-text-secondary uppercase">Ваши группы · {visible.length}</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {visible.map((g) => (
              <li key={g.id} className="pop-in flex items-center gap-1 rounded-full bg-white py-1 pr-1 pl-3 text-sm font-medium text-text shadow-[var(--shadow-card)]">
                {g.name}
                {!g.assistantAccess && (
                  <button
                    type="button"
                    onClick={() => remove(g)}
                    aria-label={`Убрать группу ${g.name}`}
                    className="flex size-7 items-center justify-center rounded-full text-text-muted transition hover:bg-error-bg hover:text-error active:scale-90"
                  >
                    <IconX size={13} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button type="button" onClick={onClose} className="btn-coach mt-5 min-h-13 w-full rounded-2xl text-base">
        {visible.length ? 'Готово' : 'Закрыть'}
      </button>
    </BottomSheet>
  )
}
