import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { ScheduleSlot } from '../../api/types'
import { slotRange, WEEKDAY_SHORT } from '../../utils/schedule'
import { IconCalendar, IconCheck, IconUsers } from '../ui/Icons'

type Group = { id: number; name: string }

function Step({
  n,
  done,
  active,
  title,
  hint,
  icon,
  children,
}: {
  n: number
  done: boolean
  active: boolean
  title: string
  hint: string
  icon: ReactNode
  children?: ReactNode
}) {
  return (
    <li className={`relative flex gap-3 rounded-2xl p-3 transition ${active ? 'bg-brand-blue-light/60' : ''}`}>
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
          done ? 'bg-brand-green text-white' : active ? 'bg-brand-blue text-white shadow-[var(--shadow-blue)]' : 'bg-surface-muted text-text-muted'
        }`}
        aria-hidden
      >
        {done ? <IconCheck size={16} /> : icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${done ? 'text-text-secondary line-through decoration-text-muted/50' : 'text-text'}`}>
          <span className="sr-only">Шаг {n}. </span>
          {title}
        </p>
        <p className="mt-0.5 text-xs leading-snug text-text-secondary">{hint}</p>
        {active && children && <div className="mt-2.5">{children}</div>}
      </div>
    </li>
  )
}

export function CoachSetupCard({
  groups,
  totalStudents,
  slots,
  autoSchedule,
  onCreateGroups,
  onInvite,
  onSchedule,
  onKeepAuto,
  onRemoveAuto,
  busy,
}: {
  groups: Group[]
  totalStudents: number
  slots: ScheduleSlot[]
  autoSchedule: boolean
  onCreateGroups: () => void
  onInvite: () => void
  onSchedule: (groupId: number | null) => void
  onKeepAuto: () => void
  onRemoveAuto: () => void
  busy: boolean
}) {
  const unscheduled = groups.filter((g) => !slots.some((s) => s.groupId === g.id))
  const groupsDone = groups.length > 0
  const studentsDone = totalStudents > 0
  const scheduleDone = groupsDone && unscheduled.length === 0 && !autoSchedule
  const doneCount = [groupsDone, studentsDone, scheduleDone].filter(Boolean).length
  const current = !groupsDone ? 'groups' : !studentsDone ? 'students' : !scheduleDone ? 'schedule' : null
  const autoGroup = autoSchedule ? groups.find((g) => g.id === slots[0]?.groupId) : null
  const byRange = new Map<string, number[]>()
  for (const s of [...slots].sort((a, b) => a.weekday - b.weekday)) {
    byRange.set(slotRange(s), [...(byRange.get(slotRange(s)) ?? []), s.weekday])
  }
  const autoDays = autoSchedule
    ? [...byRange.entries()].map(([range, days]) => `${days.map((d) => WEEKDAY_SHORT[d - 1]).join(', ')} ${range}`)
    : []

  const studentsStep = (
    <Step
      n={2}
      done={studentsDone}
      active={current === 'students'}
      title="Добавьте учеников"
      hint={studentsDone ? `В клубе ${totalStudents} уч.` : 'Отправьте родителям код клуба или добавьте детей вручную'}
      icon={
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="10" cy="8" r="3.5" />
          <path d="M3.5 19a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6" />
        </svg>
      }
    >
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onInvite} className="btn-coach min-h-10 rounded-xl px-4 text-sm">
          Пригласить по коду
        </button>
        <Link to="/coach/students?add=student" className="btn-secondary inline-flex min-h-10 items-center rounded-xl px-4 text-sm">
          Добавить вручную
        </Link>
      </div>
    </Step>
  )

  return (
    <section className="pop-in mt-5 rounded-3xl bg-white p-4 shadow-[var(--shadow-card)]" aria-labelledby="setup-title">
      <div className="flex items-start justify-between gap-3 px-1">
        <div>
          <h2 id="setup-title" className="font-display text-base font-semibold tracking-tight text-text">
            Первые шаги
          </h2>
          <p className="mt-0.5 text-xs text-text-secondary">Настройте клуб — займёт пару минут</p>
        </div>
        <span className="rounded-full bg-brand-blue-light px-2.5 py-1 text-xs font-bold text-brand-blue tabular-nums">{doneCount} / 3</span>
      </div>
      <div className="mx-1 mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted">
        <div className="h-full rounded-full bg-brand-blue transition-all duration-500" style={{ width: `${(doneCount / 3) * 100}%` }} />
      </div>

      <ol className="mt-3 space-y-1">
        <Step
          n={1}
          done={groupsDone}
          active={current === 'groups'}
          title="Создайте группы"
          hint={groupsDone ? groups.map((g) => g.name).join(', ') : 'Например, «Младшая» и «Старшая» — по возрасту или уровню'}
          icon={<IconUsers size={18} />}
        >
          <button type="button" onClick={onCreateGroups} className="btn-coach min-h-10 rounded-xl px-4 text-sm">
            Создать группы
          </button>
        </Step>

        {studentsStep}

        <Step
          n={3}
          done={scheduleDone}
          active={current === 'schedule'}
          title={autoSchedule ? 'Проверьте расписание' : 'Составьте расписание'}
          hint={
            autoSchedule
              ? `Для «${autoGroup?.name ?? 'группы'}» стоит пример: ${autoDays.join(' · ')}. Оставьте его или поставьте своё.`
              : !groupsDone
                ? 'Выберите для каждой группы дни и время тренировок'
                : unscheduled.length
                  ? `Без расписания: ${unscheduled.map((g) => g.name).join(', ')}`
                  : 'Все группы в расписании'
          }
          icon={<IconCalendar size={18} />}
        >
          {autoSchedule ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => onSchedule(autoGroup?.id ?? null)} className="btn-coach min-h-10 rounded-xl px-4 text-sm">
                Изменить
              </button>
              <button type="button" disabled={busy} onClick={onKeepAuto} className="btn-secondary min-h-10 rounded-xl px-4 text-sm">
                Всё верно
              </button>
              <button type="button" disabled={busy} onClick={onRemoveAuto} className="min-h-10 rounded-xl px-2 text-sm font-semibold text-error">
                {busy ? 'Убираем…' : 'Убрать пример'}
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => onSchedule(unscheduled[0]?.id ?? null)} className="btn-coach min-h-10 rounded-xl px-4 text-sm">
              {unscheduled.length > 1 ? `Начать с «${unscheduled[0].name}»` : 'Поставить в расписание'}
            </button>
          )}
        </Step>
      </ol>
    </section>
  )
}
