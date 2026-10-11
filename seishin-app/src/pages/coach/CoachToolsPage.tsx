import { Link } from 'react-router-dom'
import { ToolArt, type ToolKind } from '../../components/coach/tools/ToolArt'
import { IconChevronRight } from '../../components/ui/Icons'
import { useStoredState } from '../../hooks/useStoredState'
import { pendingTaskCount, TASKS_KEY, type CoachTask } from '../../utils/coachTasks'

type Tool = {
  kind: ToolKind
  title: string
  subtitle: string
  to: string
  wide?: boolean
}

const tools: Tool[] = [
  {
    kind: 'fitness',
    title: 'Конструктор физической подготовки',
    subtitle: 'Готовые комплексы и свои планы',
    to: '/coach/tools/fitness',
    wide: true,
  },
  { kind: 'timer', title: 'Таймер / Секундомер', subtitle: 'Со звуком и сигналами', to: '/coach/tools/timer' },
  { kind: 'calendar', title: 'Календарь', subtitle: 'Тренировки, турниры, аттестации', to: '/coach/schedule' },
  { kind: 'plans', title: 'Планы тренировок', subtitle: 'Шаблоны и свои планы', to: '/coach/tools/plans' },
  { kind: 'analytics', title: 'Аналитика группы', subtitle: 'Прогресс, пояса, состав', to: '/coach/tools/analytics' },
  { kind: 'checks', title: 'Чек-листы', subtitle: 'Задачи и напоминания', to: '/coach/tools/checklists' },
  { kind: 'club', title: 'Настройки клуба', subtitle: 'Профиль, пояса, группы', to: '/coach/tools/club' },
  {
    kind: 'documents',
    title: 'Документы',
    subtitle: 'Шаблоны договоров и согласий',
    to: '/coach/tools/documents',
    wide: true,
  },
]

export function CoachToolsPage() {
  const [tasks] = useStoredState<CoachTask[]>(TASKS_KEY, [])
  const pending = pendingTaskCount(tasks)

  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-8 pt-[max(1.5rem,var(--safe-top-effective))] lg:max-w-3xl lg:px-8 lg:pt-8">
      <header className="tool-rise">
        <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight text-text">Инструменты</h1>
        <p className="mt-1 text-sm text-text-secondary">Помощник тренера в повседневной работе</p>
      </header>
      <div className="tool-stagger mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {tools.map((tool) => {
          const badge = tool.kind === 'checks' && pending > 0 ? pending : null
          return (
            <Link
              key={tool.kind}
              to={tool.to}
              className={`tool-tile relative rounded-3xl border border-border-light bg-white p-4 shadow-[var(--shadow-card)] hover:border-brand-blue/25 hover:shadow-[var(--shadow-elevated)] ${
                tool.wide ? 'col-span-2 flex items-center gap-3.5 lg:col-span-3' : 'flex flex-col items-start'
              }`}
            >
              <span className="tool-art">
                <ToolArt kind={tool.kind} />
              </span>
              <span className={tool.wide ? 'min-w-0 flex-1' : 'mt-3.5'}>
                <span className="block text-[15px] font-semibold leading-snug text-text">{tool.title}</span>
                <span className="mt-1 block text-xs leading-snug text-text-secondary">{tool.subtitle}</span>
              </span>
              {tool.wide && <IconChevronRight size={18} className="shrink-0 text-text-muted" />}
              {badge != null && (
                <span className="pop-in absolute top-3 right-3 flex min-w-6 items-center justify-center rounded-full bg-[#ef4444] px-1.5 py-0.5 text-xs font-bold text-white shadow-[0_4px_10px_rgb(239_68_68/0.35)]">
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
