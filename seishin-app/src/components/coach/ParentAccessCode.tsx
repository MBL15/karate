import { useState } from 'react'
import { coachApi } from '../../api/coach'
import { ApiError } from '../../api/client'
import { IconCheck, IconUser } from '../ui/Icons'

function formatExpiry(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

export function ParentAccessCode({ studentId, studentName }: { studentId: number; studentName: string }) {
  const [code, setCode] = useState<{ code: string; expiresAt?: string | null } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const issue = async () => {
    setBusy(true)
    setError(null)
    setCopied(false)
    try {
      const res = await coachApi.createInviteCode(studentId)
      setCode({ code: res.code, expiresAt: res.expiresAt })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось создать код')
    } finally {
      setBusy(false)
    }
  }

  const message = code
    ? `Код для дневника «${studentName}» в приложении Каратэ Хаб: ${code.code}. Зарегистрируйтесь как родитель и введите код в «Добавить ребёнка по коду».`
    : ''

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setError('Не удалось скопировать — перепишите код вручную')
    }
  }

  const share = async () => {
    try {
      await navigator.share({ text: message })
    } catch {
      /* отменено пользователем */
    }
  }

  return (
    <section className="mt-5 rounded-3xl border border-border-light p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
          <IconUser size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-text">Доступ для родителей</p>
          <p className="text-xs leading-snug text-text-secondary">Мама и папа могут следить за ребёнком каждый со своего телефона</p>
        </div>
      </div>

      {code ? (
        <div className="pop-in mt-3 rounded-2xl bg-brand-blue-light/60 p-3 text-center">
          <p className="text-[11px] font-medium text-text-secondary">Личный код ученика</p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-[0.2em] text-text select-all">{code.code}</p>
          {code.expiresAt && <p className="mt-1 text-[11px] text-text-muted">Действует до {formatExpiry(code.expiresAt)}, один раз</p>}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={copy} className="btn-secondary flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-2xl text-sm">
              {copied ? <IconCheck size={14} /> : null}
              {copied ? 'Скопировано' : 'Копировать'}
            </button>
            {typeof navigator.share === 'function' && (
              <button type="button" onClick={share} className="btn-coach min-h-10 flex-1 rounded-2xl text-sm">
                Отправить
              </button>
            )}
          </div>
          <button type="button" onClick={issue} disabled={busy} className="mt-2 text-xs font-semibold text-brand-blue">
            Ещё код — для второго родителя
          </button>
        </div>
      ) : (
        <button type="button" onClick={issue} disabled={busy} className="btn-coach mt-3 min-h-11 w-full rounded-2xl text-sm">
          {busy ? 'Создаём…' : 'Код для родителя'}
        </button>
      )}

      {error && <p className="mt-2 text-xs text-error">{error}</p>}
      <p className="mt-2 text-[11px] leading-snug text-text-muted">
        Каждому родителю — свой код. Родитель вводит его в «Добавить ребёнка по коду» и сразу видит дневник этого ученика.
      </p>
    </section>
  )
}
