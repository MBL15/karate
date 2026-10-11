import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useParentProfile, type ParentProfileData } from '../../hooks/useParentProfile'
import { BottomSheet } from '../ui/BottomSheet'
import { IconLock, IconX } from '../ui/Icons'
import { ChildAvatar } from './ChildAvatar'

function Field({ label, error, children }: { label: string; error?: string | null; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-text">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error && <span className="mt-1 block text-xs text-error">{error}</span>}
    </label>
  )
}

const phoneOk = (v: string) => v.trim() === '' || v.replace(/\D/g, '').length >= 10
const emailOk = (v: string) => v.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

function Form({ initial, onSaved }: { initial: ParentProfileData; onSaved: (p: ParentProfileData) => void }) {
  const [form, setForm] = useState(initial)
  const [touched, setTouched] = useState(false)
  const set = (k: keyof ParentProfileData) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const errors = {
    firstName: form.firstName.trim() ? null : 'Укажите имя',
    lastName: form.lastName.trim() ? null : 'Укажите фамилию',
    phone: phoneOk(form.phone) ? null : 'Минимум 10 цифр',
    email: emailOk(form.email) ? null : 'Проверьте адрес',
  }
  const valid = Object.values(errors).every((e) => !e)
  const dirty = (Object.keys(form) as (keyof ParentProfileData)[]).some((k) => form[k].trim() !== initial[k].trim())

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!valid) return
    onSaved({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
    })
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Имя" error={touched ? errors.firstName : null}>
          <input value={form.firstName} onChange={set('firstName')} autoComplete="given-name" maxLength={40} className="input" />
        </Field>
        <Field label="Фамилия" error={touched ? errors.lastName : null}>
          <input value={form.lastName} onChange={set('lastName')} autoComplete="family-name" maxLength={40} className="input" />
        </Field>
      </div>
      <Field label="Телефон" error={touched ? errors.phone : null}>
        <input value={form.phone} onChange={set('phone')} type="tel" inputMode="tel" autoComplete="tel" placeholder="+7 900 000-00-00" className="input" />
      </Field>
      <Field label="Эл. почта" error={touched ? errors.email : null}>
        <input value={form.email} onChange={set('email')} type="email" inputMode="email" autoComplete="email" placeholder="name@mail.ru" className="input" />
      </Field>
      <button type="submit" disabled={!dirty} className="btn-primary w-full">
        Сохранить
      </button>
    </form>
  )
}

export function ParentSettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleId = useId()
  const { user } = useAuth()
  const { profile, fullName, save } = useParentProfile()
  const [saved, setSaved] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const close = () => {
    setSaved(false)
    setFormKey((k) => k + 1)
    onClose()
  }

  return (
    <BottomSheet open={open} titleId={titleId} onClose={close}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={titleId} className="font-display text-xl font-bold text-text">
          Настройки профиля
        </h2>
        <button
          type="button"
          onClick={close}
          aria-label="Закрыть"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-secondary transition active:scale-90"
        >
          <IconX size={16} />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-4 rounded-2xl bg-surface-muted p-4">
        <ChildAvatar photoKey="parent-photo" name={fullName} size={64} editable />
        <div className="min-w-0">
          <p className="truncate font-bold text-text">{fullName}</p>
          <p className="text-xs text-text-secondary">Нажмите на фото, чтобы заменить</p>
        </div>
      </div>

      <p className="mt-5 mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">Личные данные</p>
      {saved && (
        <p role="status" className="alert-success mb-3">
          Сохранено
        </p>
      )}
      <Form
        key={formKey}
        initial={profile}
        onSaved={(p) => {
          save(p)
          setSaved(true)
          setFormKey((k) => k + 1)
        }}
      />
      <p className="mt-2 text-[11px] leading-snug text-text-muted">
        Пока изменения видны только в этом приложении. Тренер увидит новое имя и телефон после подключения к серверу.
      </p>

      <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">Вход в аккаунт</p>
      <div className="card divide-y divide-border-light overflow-hidden p-0">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-sm text-text-secondary">Логин</span>
          <span className="truncate text-sm font-semibold text-text">{user?.login ?? '—'}</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-text-secondary">
            <IconLock size={16} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-text">Сменить пароль</span>
            <span className="block text-xs text-text-secondary">Понадобится текущий пароль</span>
          </span>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-bold text-text-muted">СКОРО</span>
        </div>
      </div>
    </BottomSheet>
  )
}
