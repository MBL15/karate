import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { SectionTitle, ToolCard, ToolShell } from '../../../components/coach/tools/ToolShell'
import { IconCheck, IconPlus, IconX } from '../../../components/ui/Icons'
import { useStoredState } from '../../../hooks/useStoredState'
import {
  TASKS_KEY,
  taskActions,
  taskStatus,
  todayIso,
  type CoachTask,
  type TaskAction,
  type TaskStatus,
} from '../../../utils/coachTasks'

const GROUPS: { status: TaskStatus; title: string; tone: string }[] = [
  { status: 'overdue', title: 'Просрочено', tone: 'text-error' },
  { status: 'today', title: 'Сегодня', tone: 'text-brand-blue' },
  { status: 'upcoming', title: 'Скоро', tone: 'text-text' },
  { status: 'done', title: 'Выполнено', tone: 'text-text-muted' },
]

function shiftDate(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dueLabel(task: CoachTask) {
  const today = todayIso()
  const label =
    task.due === today
      ? 'сегодня'
      : task.due === shiftDate(1)
        ? 'завтра'
        : task.due === shiftDate(-1)
          ? 'вчера'
          : new Date(`${task.due}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  return task.time ? `${label}, ${task.time}` : label
}

function TaskItem({ task, onToggle, onDelete }: { task: CoachTask; onToggle: () => void; onDelete: () => void }) {
  const meta = taskActions[task.action]
  const status = taskStatus(task)
  return (
    <li className="pop-in flex items-start gap-3 rounded-2xl border border-border-light bg-white p-3.5 shadow-[var(--shadow-card)]">
      <button
        type="button"
        onClick={onToggle}
        aria-label={task.done ? 'Вернуть в работу' : 'Отметить выполненной'}
        aria-pressed={task.done}
        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition duration-300 active:scale-90 ${
          task.done ? 'border-brand-green bg-brand-green text-white' : status === 'overdue' ? 'border-error/60' : 'border-border hover:border-brand-blue'
        }`}
      >
        {task.done && (
          <span className="pop-in">
            <IconCheck size={14} />
          </span>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-[15px] font-semibold leading-snug transition ${task.done ? 'text-text-muted line-through' : 'text-text'}`}>
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className={`rounded-full px-2 py-0.5 font-semibold ${meta.tone}`}>{meta.short}</span>
          <span className={status === 'overdue' ? 'font-semibold text-error' : 'text-text-secondary'}>{dueLabel(task)}</span>
        </div>
        {task.note && <p className="mt-1.5 text-sm text-text-secondary">{task.note}</p>}
        {meta.to && !task.done && (
          <Link to={meta.to} className="mt-2 inline-flex text-sm font-semibold text-brand-blue hover:underline">
            Перейти к выполнению →
          </Link>
        )}
      </div>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Удалить задачу"
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-text-muted transition hover:bg-error-bg hover:text-error"
      >
        <IconX size={14} />
      </button>
    </li>
  )
}

export function ChecklistsTool() {
  const [tasks, setTasks] = useStoredState<CoachTask[]>(TASKS_KEY, [])
  const [adding, setAdding] = useState(tasks.length === 0)
  const [action, setAction] = useState<TaskAction>('competition')
  const [title, setTitle] = useState(taskActions.competition.label)
  const [due, setDue] = useState(todayIso())
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const [showDone, setShowDone] = useState(false)

  const pickAction = (next: TaskAction) => {
    const wasDefault = Object.values(taskActions).some((meta) => meta.label === title) || !title.trim()
    setAction(next)
    if (wasDefault) setTitle(next === 'custom' ? '' : taskActions[next].label)
  }

  const add = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const task: CoachTask = {
      id: Math.random().toString(36).slice(2, 10),
      action,
      title: title.trim(),
      due,
      time: time || undefined,
      note: note.trim() || undefined,
      done: false,
      createdAt: Date.now(),
    }
    setTasks((list) => [task, ...list])
    setNote('')
    setTime('')
    setAdding(false)
  }

  const sorted = [...tasks].sort((a, b) => `${a.due}${a.time ?? ''}`.localeCompare(`${b.due}${b.time ?? ''}`))
  const doneCount = tasks.filter((t) => t.done).length
  const percent = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0

  return (
    <ToolShell
      kind="checks"
      title="Чек-листы"
      subtitle="Задачи и напоминания тренера"
      action={
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          aria-label={adding ? 'Скрыть форму' : 'Новая задача'}
          className={`flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-blue text-white shadow-[var(--shadow-blue)] transition duration-300 active:scale-95 ${adding ? 'rotate-45' : ''}`}
        >
          <IconPlus size={20} />
        </button>
      }
    >
      {tasks.length > 0 && (
        <ToolCard>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-text">
              Выполнено {doneCount} из {tasks.length}
            </span>
            <span className="font-bold text-brand-green">{percent}%</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-muted">
            <span className="block h-full rounded-full bg-brand-green transition-[width] duration-700" style={{ width: `${percent}%` }} />
          </div>
        </ToolCard>
      )}

      {adding && (
        <form onSubmit={add} className="pop-in rounded-3xl border border-border-light bg-white p-5 shadow-[var(--shadow-card)]">
          <SectionTitle>Что нужно сделать?</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(taskActions) as TaskAction[]).map((key) => {
              const meta = taskActions[key]
              const active = action === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => pickAction(key)}
                  aria-pressed={active}
                  className={`rounded-2xl border p-2.5 text-left transition active:scale-[0.98] ${
                    active ? 'border-brand-blue bg-brand-blue-light/60' : 'border-border-light hover:border-brand-blue/30'
                  }`}
                >
                  <span className="block text-[13px] font-semibold leading-tight text-text">{meta.label}</span>
                  <span className="mt-0.5 block text-[11px] text-text-secondary">{meta.hint}</span>
                </button>
              )
            })}
          </div>

          <label className="mt-4 block text-sm font-medium text-text">
            Задача
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например, подать заявку на кубок города" className="input-coach mt-1.5" required />
          </label>

          <p className="mt-4 text-sm font-medium text-text">Когда напомнить</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {[
              { label: 'Сегодня', value: todayIso() },
              { label: 'Завтра', value: shiftDate(1) },
              { label: 'Через неделю', value: shiftDate(7) },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setDue(option.value)}
                className={`min-h-9 rounded-full px-3.5 text-sm font-semibold transition ${
                  due === option.value ? 'bg-brand-blue text-white' : 'bg-surface-muted text-text-secondary'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="input-coach" aria-label="Дата" required />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input-coach" aria-label="Время" />
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Заметка (необязательно)"
            rows={2}
            className="input-coach mt-2 resize-none"
          />
          <button type="submit" className="btn-coach mt-4 min-h-12 w-full rounded-2xl">
            Добавить напоминание
          </button>
        </form>
      )}

      {tasks.length === 0 && !adding && (
        <div className="rounded-3xl border border-dashed border-border bg-white px-6 py-10 text-center">
          <p className="font-semibold text-text">Задач пока нет</p>
          <p className="mt-1 text-sm text-text-secondary">Добавьте, что не хотите забыть: заявку, аттестацию, награды.</p>
        </div>
      )}

      {GROUPS.map((group) => {
        const items = sorted.filter((t) => taskStatus(t) === group.status)
        if (items.length === 0) return null
        if (group.status === 'done') {
          return (
            <div key={group.status}>
              <button type="button" onClick={() => setShowDone((v) => !v)} className="mb-2 flex items-center gap-2 text-sm font-bold text-text-muted">
                {group.title} ({items.length})
                <span className={`transition ${showDone ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {showDone && (
                <ul className="space-y-2.5">
                  {items.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={() => setTasks((list) => list.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)))}
                      onDelete={() => setTasks((list) => list.filter((t) => t.id !== task.id))}
                    />
                  ))}
                </ul>
              )}
            </div>
          )
        }
        return (
          <div key={group.status}>
            <h2 className={`mb-2 text-sm font-bold ${group.tone}`}>
              {group.title} ({items.length})
            </h2>
            <ul className="space-y-2.5">
              {items.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={() => setTasks((list) => list.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)))}
                  onDelete={() => setTasks((list) => list.filter((t) => t.id !== task.id))}
                />
              ))}
            </ul>
          </div>
        )
      })}
    </ToolShell>
  )
}
