import { useId, useState, type FormEvent } from 'react'
import { useParentChild } from '../../context/ParentChildContext'
import { ApiError } from '../../api/client'
import { Dialog } from '../a11y/Dialog'

export function AddChildModal() {
  const { addChildOpen, setAddChildOpen, addChild, children } = useParentChild()
  const titleId = useId()
  const descriptionId = useId()
  const errorId = useId()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const needsInvite = children.length === 0

  const resetForm = () => {
    setFirstName('')
    setLastName('')
    setBirthDate('')
    setInviteCode('')
    setError('')
    setSuccess('')
  }

  const close = () => {
    setAddChildOpen(false)
    resetForm()
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      const name = await addChild({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthDate,
        inviteCode: needsInvite ? inviteCode.trim() : undefined,
      })
      setSuccess(`${name} добавлен — тренер увидит его в списке учеников`)
      setFirstName('')
      setLastName('')
      setBirthDate('')
      setInviteCode('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось добавить ребёнка')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit =
    firstName.trim() && lastName.trim() && birthDate && (!needsInvite || inviteCode.length === 6)

  return (
    <Dialog open={addChildOpen} titleId={titleId} descriptionId={descriptionId} onClose={close}>
      <div className="w-full overflow-hidden rounded-3xl bg-surface shadow-[var(--shadow-elevated)]">
        <div className="bg-navy-950 px-6 py-5 text-white">
          <h2 id={titleId} className="text-lg font-bold">
            Добавить ребёнка
          </h2>
        </div>
        <div className="p-6">
          <p id={descriptionId} className="text-sm text-text-secondary">
            {needsInvite
              ? 'Заполните данные ребёнка и код приглашения от тренера — после этого вы подключитесь к клубу.'
              : 'Добавьте ещё одного ребёнка в ваш клуб.'}
          </p>
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            {error && (
              <p id={errorId} role="alert" className="alert-error">
                {error}
              </p>
            )}
            {success && (
              <p role="status" className="alert-success">
                {success}
              </p>
            )}
            {needsInvite && (
              <div>
                <label className="label" htmlFor="child-invite">
                  Код приглашения
                </label>
                <input
                  id="child-invite"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="482917"
                  className="input text-center text-xl tracking-[0.3em]"
                  aria-invalid={Boolean(error)}
                  aria-describedby="child-invite-hint"
                  required
                />
                <p id="child-invite-hint" className="mt-2 text-xs text-text-secondary">
                  6 цифр от тренера (раздел «Код для родителя»)
                </p>
              </div>
            )}
            <div>
              <label className="label" htmlFor="child-first-name">
                Имя
              </label>
              <input
                id="child-first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Михаил"
                className="input"
                required
                autoComplete="given-name"
              />
            </div>
            <div>
              <label className="label" htmlFor="child-last-name">
                Фамилия
              </label>
              <input
                id="child-last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Соколов"
                className="input"
                required
                autoComplete="family-name"
              />
            </div>
            <div>
              <label className="label" htmlFor="child-birth-date">
                Дата рождения
              </label>
              <input
                id="child-birth-date"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="input"
                required
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={close} className="btn-secondary flex-1">
                Закрыть
              </button>
              <button type="submit" disabled={submitting || !canSubmit} className="btn-primary flex-1">
                {submitting ? 'Сохранение…' : 'Добавить'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  )
}
