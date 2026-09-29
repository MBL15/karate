import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconUser, IconUsers } from '../ui/Icons'

export function LoginRoleMenu() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-primary px-5"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="login-role-menu"
      >
        Войти
      </button>

      {open && (
        <div
          id="login-role-menu"
          className="absolute right-0 z-50 mt-3 w-[min(calc(100vw-2.5rem),24rem)] rounded-3xl border border-border-light bg-surface p-4 shadow-[var(--shadow-elevated)]"
        >
          <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Кто входит</p>
          <Link
            to="/login?role=coach"
            onClick={() => setOpen(false)}
            className="flex items-start gap-3 rounded-2xl p-4 transition hover:bg-brand-blue-light"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-blue text-white">
              <IconUsers size={20} />
            </span>
            <span>
              <span className="block font-bold text-text">Тренер</span>
              <span className="mt-0.5 block text-sm text-text-secondary">Кабинет группы, посещаемость, награды</span>
            </span>
          </Link>
          <Link
            to="/login?role=parent"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-start gap-3 rounded-2xl p-4 transition hover:bg-brand-green-light"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-green text-white">
              <IconUser size={20} />
            </span>
            <span>
              <span className="block font-bold text-text">Родитель</span>
              <span className="mt-0.5 block text-sm text-text-secondary">Дневник ребёнка, пояс, соревнования</span>
            </span>
          </Link>
          <Link
            to="/register"
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-2xl px-4 py-3 text-sm font-semibold text-text-secondary transition hover:bg-surface-muted hover:text-text"
          >
            Нет аккаунта? Регистрация
          </Link>
        </div>
      )}
    </div>
  )
}
