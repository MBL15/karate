import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { authApi } from '../../api/auth'
import { ApiError } from '../../api/client'
import { useParentChild } from '../../context/ParentChildContext'
import { localIso } from '../../utils/athletePath'
import { BottomSheet } from '../ui/BottomSheet'
import { IconArrowLeft, IconCheck, IconUsers, IconX } from '../ui/Icons'

const FIELD =
  'min-h-12 w-full rounded-2xl border border-border-light bg-white px-4 text-[15px] text-text outline-none transition placeholder:text-text-muted focus:border-brand-green/50 focus:ring-4 focus:ring-brand-green/10'

type Step = 'code' | 'child' | 'other' | 'done'

const normName = (value: string) => value.trim().toLowerCase().replace(/ё/g, 'е')

const formatBirth = (iso: string) => {
  const [y, m, d] = iso.split('-')
  return y && m && d ? `${d}.${m}.${y}` : iso
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-text">
        {label}
      </label>
      {children}
    </div>
  )
}

function StepDots({ step }: { step: Step }) {
  const index = step === 'code' ? 0 : step === 'done' ? 2 : 1
  return (
    <div className="mt-4 flex gap-1.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className={`h-1 flex-1 rounded-full ${i <= index ? 'bg-brand-green' : 'bg-surface-muted'}`} />
      ))}
    </div>
  )
}

export function AddChildModal() {
  const { addChildOpen, setAddChildOpen, addChild, children, refresh, setSelectedChildId, clubs, clubsReady: loaded } =
    useParentChild()
  const titleId = useId()
  const [step, setStep] = useState<Step>('code')
  const [code, setCode] = useState('')
  const [clubName, setClubName] = useState('')
  const familyClubs = [...new Set(Object.values(clubs))]
  const clubsReady = children.length === 0 || loaded
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [doneText, setDoneText] = useState({ title: '', text: '' })

  const reset = () => {
    setStep('code')
    setCode('')
    setClubName('')
    setFirstName('')
    setLastName('')
    setBirthDate('')
    setError('')
  }

  const close = () => {
    setAddChildOpen(false)
    window.setTimeout(reset, 300)
  }

  const checkCode = async (value: string) => {
    if (value.length !== 6 || submitting || !clubsReady) return
    setSubmitting(true)
    setError('')
    try {
      const lookup = await authApi.lookupInvite(value)
      if (lookup.kind === 'STUDENT') {
        const linked = await authApi.linkChild(value)
        await refresh()
        setSelectedChildId(linked.studentId)
        setDoneText({
          title: `${linked.studentName} — в вашем дневнике`,
          text: `Клуб «${linked.clubName ?? lookup.clubName}»${linked.groupName ? `, группа «${linked.groupName}»` : ''}. Пояс, посещения и значки уже в дневнике.`,
        })
        setStep('done')
        return
      }
      setClubName(lookup.clubName)
      setStep(familyClubs.length > 0 && !familyClubs.includes(lookup.clubName) ? 'other' : 'child')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось проверить код')
    } finally {
      setSubmitting(false)
    }
  }

  const submitChild = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting || step !== 'child') return
    setSubmitting(true)
    setError('')
    try {
      const name = await addChild({ firstName: firstName.trim(), lastName: lastName.trim(), birthDate, inviteCode: code })
      setDoneText({
        title: `${name} в клубе`,
        text: `Тренер клуба «${clubName}» увидит ребёнка в списке учеников и добавит в группу.`,
      })
      setStep('done')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось добавить ребёнка')
    } finally {
      setSubmitting(false)
    }
  }

  const sameName = children.find(
    (c) => normName(c.firstName) === normName(firstName) && normName(c.lastName) === normName(lastName),
  )
  const duplicate = sameName && birthDate && sameName.birthDate === birthDate ? sameName : undefined
  const namesake = sameName && !duplicate ? sameName : undefined
  const canSubmit = firstName.trim() && lastName.trim() && birthDate && !duplicate

  const openExisting = (id: number) => {
    setSelectedChildId(id)
    close()
  }

  return (
    <BottomSheet open={addChildOpen} titleId={titleId} onClose={close}>
      <div className="flex items-start gap-2">
        {(step === 'child' || step === 'other') && (
          <button
            type="button"
            onClick={() => {
              setStep('code')
              setError('')
            }}
            aria-label="Назад к коду"
            className="-ml-2 flex size-9 shrink-0 items-center justify-center rounded-full text-text transition hover:bg-surface-muted"
          >
            <IconArrowLeft size={20} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="font-display text-xl font-bold text-text">
            {step === 'done'
              ? 'Готово'
              : step === 'child'
                ? 'Данные ребёнка'
                : step === 'other'
                  ? 'Другой клуб'
                  : 'Добавить ребёнка'}
          </h2>
          {step === 'code' && (
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              Введите код клуба или личный код ученика от тренера
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Закрыть"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-secondary transition active:scale-90"
        >
          <IconX size={16} />
        </button>
      </div>
      <StepDots step={step} />

      {step === 'code' && (
        <div className="mt-5">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, '').slice(0, 6)
              setCode(next)
              setError('')
              if (next.length === 6) void checkCode(next)
            }}
            placeholder="••••••"
            aria-label="Код от тренера, 6 цифр"
            autoFocus
            className={`${FIELD} min-h-16 text-center text-3xl font-bold tracking-[0.45em]`}
          />
          {error ? (
            <p role="alert" className="mt-3 rounded-2xl bg-error-bg px-4 py-3 text-sm text-error">
              {error}
            </p>
          ) : (
            <p className="mt-3 text-center text-xs leading-relaxed text-text-muted">
              {submitting
                ? 'Проверяем код…'
                : !clubsReady
                  ? 'Загружаем данные клуба…'
                  : 'Код из 6 цифр выдаёт тренер. Личный код сразу привяжет ребёнка, который уже занимается'}
            </p>
          )}
          <button
            type="button"
            disabled={code.length !== 6 || submitting || !clubsReady}
            onClick={() => void checkCode(code)}
            className="mt-4 min-h-12 w-full rounded-2xl bg-brand-green text-[15px] font-semibold text-white transition active:scale-[0.98] disabled:bg-surface-muted disabled:text-text-muted"
          >
            {submitting ? 'Проверяем…' : 'Продолжить'}
          </button>
        </div>
      )}

      {(step === 'child' || step === 'other') && (
        <form onSubmit={submitChild} className="mt-5 space-y-4">
          <div className="flex items-center gap-3 rounded-2xl bg-brand-green-light px-4 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-green">
              <IconUsers size={18} />
            </span>
            <span className="min-w-0">
              <span className="block text-xs text-text-secondary">{step === 'other' ? 'Новый клуб' : 'Клуб найден'}</span>
              <span className="block truncate font-semibold text-text">{clubName}</span>
            </span>
            <IconCheck size={18} className="ml-auto shrink-0 text-brand-green" />
          </div>

          {step === 'other' && (
            <div className="rounded-2xl bg-surface-muted p-4 text-sm leading-relaxed text-text-secondary">
              <p className="font-semibold text-text">Ребёнок в другом клубе</p>
              <p className="mt-1">
                Ваши дети сейчас занимаются в {familyClubs.length > 1 ? 'клубах' : 'клубе'} «{familyClubs.join('», «')}». Можно добавить ребёнка, который ходит в «{clubName}», —
                у каждого будет свой тренер и свой дневник.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field id="child-first-name" label="Имя">
              <input
                id="child-first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Михаил"
                className={FIELD}
                required
                autoComplete="given-name"
              />
            </Field>
            <Field id="child-last-name" label="Фамилия">
              <input
                id="child-last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Соколов"
                className={FIELD}
                required
                autoComplete="family-name"
              />
            </Field>
          </div>

          <Field id="child-birth-date" label="Дата рождения">
            <input
              id="child-birth-date"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className={FIELD}
              required
              max={localIso(new Date())}
            />
          </Field>

          {duplicate && (
            <div role="alert" className="rounded-2xl border border-error/20 bg-error-bg p-4 text-sm">
              <p className="font-bold text-error">Этот ребёнок уже в дневнике</p>
              <p className="mt-1 leading-relaxed text-text-secondary">
                {duplicate.firstName} {duplicate.lastName}, {formatBirth(duplicate.birthDate)} — уже добавлен. Повторно
                добавлять не нужно: появится пустой дубль без пояса и посещений.
              </p>
              <button
                type="button"
                onClick={() => openExisting(duplicate.id)}
                className="mt-3 min-h-10 w-full rounded-xl bg-white text-sm font-semibold text-brand-green transition active:scale-[0.98]"
              >
                Открыть дневник {duplicate.firstName}
              </button>
            </div>
          )}

          {namesake && (
            <div className="rounded-2xl bg-warning-bg p-4 text-sm leading-relaxed text-text-secondary">
              <p className="font-semibold text-text">У вас уже есть {namesake.firstName} {namesake.lastName}</p>
              <p className="mt-1">
                Дата рождения {formatBirth(namesake.birthDate)}. Если это тот же ребёнок —{' '}
                <button
                  type="button"
                  onClick={() => openExisting(namesake.id)}
                  className="font-semibold text-brand-green underline underline-offset-2"
                >
                  откройте его дневник
                </button>
                . Если другой — проверьте дату и добавляйте.
              </p>
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-2xl bg-error-bg px-4 py-3 text-sm text-error">
              {error}
            </p>
          )}

          {step === 'other' ? (
            <button
              type="button"
              disabled
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-surface-muted text-[15px] font-semibold text-text-muted"
            >
              Добавить в «{clubName}»
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold">СКОРО</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="min-h-12 w-full rounded-2xl bg-brand-green text-[15px] font-semibold text-white transition active:scale-[0.98] disabled:bg-surface-muted disabled:text-text-muted"
            >
              {submitting ? 'Добавляем…' : 'Добавить в клуб'}
            </button>
          )}
        </form>
      )}

      {step === 'done' && (
        <div className="mt-5 text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-brand-green-light text-brand-green">
            <IconCheck size={30} />
          </span>
          <p className="mt-4 text-lg font-bold text-text">{doneText.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">{doneText.text}</p>
          <p className="mt-3 text-xs text-text-muted">Переключаться между детьми можно, нажав на имя в шапке.</p>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={reset}
              className="min-h-12 rounded-2xl bg-surface-muted text-sm font-semibold text-text-secondary transition active:scale-[0.98]"
            >
              Добавить ещё
            </button>
            <button
              type="button"
              onClick={close}
              className="min-h-12 rounded-2xl bg-brand-green text-sm font-semibold text-white transition active:scale-[0.98]"
            >
              Готово
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  )
}
