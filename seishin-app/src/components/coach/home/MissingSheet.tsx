import { useState } from 'react'
import type { StudentSummary } from '../../../api/types'
import { BottomSheet } from '../../ui/BottomSheet'
import { IconBell, IconCheck, IconX } from '../../ui/Icons'
import { initials, plural } from './helpers'

export type MissingStudent = { student: StudentSummary; groupId: number; groupName: string; streak: number }

function defaultMessage(m: MissingStudent) {
  return `Здравствуйте! ${m.student.firstName} пропустил(а) ${m.streak} ${plural(m.streak, 'тренировку', 'тренировки', 'тренировок')} подряд в группе «${m.groupName}». Всё ли в порядке? Будем рады видеть на следующем занятии!`
}

export function MissingSheet({
  open,
  missing,
  onClose,
  onOpenGroup,
}: {
  open: boolean
  missing: MissingStudent[]
  onClose: () => void
  onOpenGroup: (groupId: number) => void
}) {
  const titleId = 'missing-sheet-title'
  const [picked, setPicked] = useState<Set<number>>(() => new Set(missing.map((m) => m.student.id)))
  const [drafts, setDrafts] = useState<Record<number, string>>({})
  const [editing, setEditing] = useState<number | null>(null)

  const toggle = (id: number) =>
    setPicked((set) => {
      const next = new Set(set)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const count = picked.size

  return (
    <BottomSheet open={open} titleId={titleId} onClose={onClose}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="font-display text-xl font-bold text-text">
            Пропускают тренировки
          </h2>
          <p className="mt-0.5 text-xs text-text-secondary">Напомните родителям о себе — короткое сообщение часто возвращает ребёнка в зал.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Закрыть" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
          <IconX size={16} />
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {missing.map((m) => {
          const id = m.student.id
          const on = picked.has(id)
          const text = drafts[id] ?? defaultMessage(m)
          const open = editing === id
          return (
            <li key={`${m.groupId}-${id}`} className={`rounded-2xl border transition-colors ${on ? 'border-brand-blue/25 bg-brand-blue-light/30' : 'border-border-light bg-white'}`}>
              <div className="flex items-center gap-3 p-3">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  aria-label={`Отправить родителям ${m.student.firstName}`}
                  onClick={() => toggle(id)}
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    on ? 'border-brand-blue bg-brand-blue text-white' : 'border-border bg-white'
                  }`}
                >
                  {on && <IconCheck size={12} />}
                </button>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-blue-light text-xs font-bold text-brand-blue">
                  {initials(`${m.student.firstName} ${m.student.lastName}`)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-text">
                    {m.student.lastName} {m.student.firstName}
                  </p>
                  <p className="truncate text-xs text-text-secondary">
                    <span className="font-semibold text-[#e11d48]">
                      {m.streak} {plural(m.streak, 'пропуск', 'пропуска', 'пропусков')} подряд
                    </span>{' '}
                    · {m.groupName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(open ? null : id)}
                  aria-expanded={open}
                  className="shrink-0 rounded-full px-2.5 py-1.5 text-xs font-semibold text-brand-blue transition hover:bg-brand-blue-light active:scale-95"
                >
                  {open ? 'Готово' : 'Текст'}
                </button>
              </div>
              {open ? (
                <div className="pop-in px-3 pb-3">
                  <textarea
                    value={text}
                    onChange={(e) => setDrafts((d) => ({ ...d, [id]: e.target.value }))}
                    rows={4}
                    className="input-coach min-h-24 w-full resize-none text-sm leading-snug"
                  />
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <button type="button" onClick={() => onOpenGroup(m.groupId)} className="text-xs font-semibold text-text-secondary hover:text-text">
                      Открыть группу →
                    </button>
                    {drafts[id] != null && (
                      <button
                        type="button"
                        onClick={() =>
                          setDrafts((d) => {
                            const rest = { ...d }
                            delete rest[id]
                            return rest
                          })
                        }
                        className="text-xs font-semibold text-text-muted hover:text-text"
                      >
                        Вернуть шаблон
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <p className="line-clamp-2 px-3 pb-3 pl-[3.25rem] text-xs leading-snug text-text-secondary">{text}</p>
              )}
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        disabled
        className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-blue text-sm font-semibold text-white shadow-[var(--shadow-blue)] disabled:opacity-60"
      >
        <IconBell size={16} />
        {count > 0 ? `Отправить ${count} ${plural(count, 'родителю', 'родителям', 'родителям')}` : 'Выберите, кому отправить'}
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold tracking-wide">СКОРО</span>
      </button>
      <p className="mt-2 text-center text-[11px] text-text-muted">Пуш-уведомления родителям появятся в следующих версиях.</p>
    </BottomSheet>
  )
}
