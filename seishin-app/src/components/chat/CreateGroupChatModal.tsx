import { useEffect, useId, useState, type FormEvent } from 'react'
import { coachApi } from '../../api/coach'
import type { GroupSummary } from '../../api/types'
import { ApiError } from '../../api/client'
import { Dialog } from '../a11y/Dialog'

type CreateGroupChatModalProps = {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function CreateGroupChatModal({ open, onClose, onCreated }: CreateGroupChatModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const [name, setName] = useState('')
  const [trainingGroupId, setTrainingGroupId] = useState<number | ''>('')
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName('')
    setTrainingGroupId('')
    setError(null)
    void coachApi.groups().then(setGroups).catch(() => setGroups([]))
  }, [open])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      await coachApi.createChatGroup({
        name: name.trim(),
        trainingGroupId: trainingGroupId === '' ? undefined : trainingGroupId,
      })
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось создать групповой чат')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} titleId={titleId} descriptionId={descriptionId} onClose={onClose}>
      <div className="card w-full p-6 shadow-xl">
        <h2 id={titleId} className="text-xl font-bold text-text">
          Новый групповой чат
        </h2>
        <p id={descriptionId} className="mt-2 text-sm text-text-secondary">
          Родители из выбранной тренировочной группы будут добавлены автоматически.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {error && (
            <p role="alert" className="alert-error">
              {error}
            </p>
          )}
          <div>
            <label className="label" htmlFor="group-chat-name">
              Название
            </label>
            <input
              id="group-chat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Родители · Детская группа"
              className="input-coach"
              maxLength={120}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="group-chat-group">
              Тренировочная группа
            </label>
            <select
              id="group-chat-group"
              value={trainingGroupId}
              onChange={(e) => setTrainingGroupId(e.target.value ? Number(e.target.value) : '')}
              className="input-coach"
              required
            >
              <option value="">Выберите группу</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.studentCount} уч.)
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
              Отмена
            </button>
            <button type="submit" className="btn-coach flex-1" disabled={loading || !name.trim() || trainingGroupId === ''}>
              {loading ? 'Создание…' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </Dialog>
  )
}
