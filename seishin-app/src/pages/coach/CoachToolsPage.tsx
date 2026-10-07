import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { coachApi } from '../../api/coach'
import type { CoachDashboard, GroupSummary } from '../../api/types'
import { ApiError } from '../../api/client'
import { LogoutButton } from '../../components/auth/LogoutButton'
import {
  IconArrowLeft,
  IconCalendar,
  IconChart,
  IconClipboard,
  IconDumbbell,
  IconHeadset,
  IconSettings,
  IconSparkles,
  IconTimer,
  IconUsers,
} from '../../components/ui/Icons'

type ToolId = 'fitness' | 'timer' | 'kata' | 'plans' | 'analytics' | 'club' | 'access'

const tools: {
  id: ToolId | 'calendar' | 'checks'
  title: string
  subtitle: string
  icon: typeof IconDumbbell
  iconClass: string
  wide?: boolean
  to?: string
}[] = [
  {
    id: 'fitness',
    title: 'Конструктор физической подготовки',
    subtitle: 'Готовые комплексы и свои планы',
    icon: IconDumbbell,
    iconClass: 'bg-[#d9f3e4] text-[#1f7a4d]',
    wide: true,
  },
  {
    id: 'timer',
    title: 'Таймер / Секундомер',
    subtitle: 'С секундами и отсчётами',
    icon: IconTimer,
    iconClass: 'bg-[#fde8e8] text-[#d94b55]',
  },
  {
    id: 'calendar',
    title: 'Календарь',
    subtitle: 'Тренировки, турниры, аттестации',
    icon: IconCalendar,
    iconClass: 'bg-[#fff4d6] text-[#a16207]',
    to: '/coach/schedule',
  },
  {
    id: 'kata',
    title: 'Библиотека ката',
    subtitle: 'Видео, описания, чек-листы',
    icon: IconSparkles,
    iconClass: 'bg-[#eadcfd] text-[#6d28d9]',
  },
  {
    id: 'plans',
    title: 'Планы тренировок',
    subtitle: 'Шаблоны и свои планы',
    icon: IconClipboard,
    iconClass: 'bg-[#dbe7fb] text-[#1d4e89]',
    to: '/coach/schedule',
  },
  {
    id: 'analytics',
    title: 'Аналитика группы',
    subtitle: 'Посещаемость, прогресс',
    icon: IconChart,
    iconClass: 'bg-[#fff4d6] text-[#a16207]',
  },
  {
    id: 'checks',
    title: 'Чек-листы',
    subtitle: 'Аттестации, соревнования, инвентарь',
    icon: IconClipboard,
    iconClass: 'bg-[#d9f3e4] text-[#1f7a4d]',
    to: '/coach/attendance',
  },
  {
    id: 'club',
    title: 'Настройки клуба',
    subtitle: 'Код клуба для учеников',
    icon: IconSettings,
    iconClass: 'bg-[#eceae4] text-text-secondary',
  },
  {
    id: 'access',
    title: 'Доступы и ассистенты',
    subtitle: 'Роли тренеров, приглашения',
    icon: IconUsers,
    iconClass: 'bg-[#dbe7fb] text-[#1d4e89]',
  },
]

function formatClock(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds)
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function TimerTool({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<'stopwatch' | 'timer'>('stopwatch')
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [remain, setRemain] = useState(60)
  const [minutes, setMinutes] = useState(1)

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      if (mode === 'stopwatch') setElapsed((value) => value + 1)
      else setRemain((value) => (value <= 1 ? 0 : value - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [running, mode])

  useEffect(() => {
    if (mode === 'timer' && running && remain === 0) setRunning(false)
  }, [mode, running, remain])

  const startTimer = (event: FormEvent) => {
    event.preventDefault()
    setRemain(Math.max(1, minutes) * 60)
    setRunning(true)
  }

  return (
    <div>
      <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-text-secondary">
        <IconArrowLeft size={16} />
        Инструменты
      </button>
      <h1 className="mt-3 text-[1.65rem] font-bold tracking-tight text-text">Таймер</h1>
      <div className="mt-4 grid grid-cols-2 rounded-full bg-white p-1 shadow-[var(--shadow-card)]">
        <button
          type="button"
          onClick={() => {
            setMode('stopwatch')
            setRunning(false)
          }}
          className={`min-h-11 rounded-full text-sm font-semibold ${mode === 'stopwatch' ? 'bg-[#f5c518] text-navy-950' : 'text-text-secondary'}`}
        >
          Секундомер
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('timer')
            setRunning(false)
          }}
          className={`min-h-11 rounded-full text-sm font-semibold ${mode === 'timer' ? 'bg-[#f5c518] text-navy-950' : 'text-text-secondary'}`}
        >
          Таймер
        </button>
      </div>
      <div className="mt-6 rounded-[1.5rem] bg-white px-6 py-10 text-center shadow-[var(--shadow-card)]">
        <p className="font-mono text-5xl font-bold tracking-tight text-text">
          {formatClock(mode === 'stopwatch' ? elapsed : remain)}
        </p>
        {mode === 'stopwatch' ? (
          <div className="mt-6 flex justify-center gap-2">
            <button type="button" onClick={() => setRunning((value) => !value)} className="btn-coach">
              {running ? 'Пауза' : 'Старт'}
            </button>
            <button
              type="button"
              onClick={() => {
                setRunning(false)
                setElapsed(0)
              }}
              className="btn-secondary"
            >
              Сброс
            </button>
          </div>
        ) : (
          <form onSubmit={startTimer} className="mt-6 flex flex-wrap items-end justify-center gap-2">
            <label className="text-left text-sm text-text-secondary">
              Минуты
              <input
                type="number"
                min={1}
                max={180}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                className="input-coach mt-1 w-28"
              />
            </label>
            <button type="submit" className="btn-coach">
              {running ? 'Перезапустить' : 'Старт'}
            </button>
            <button
              type="button"
              onClick={() => setRunning(false)}
              className="btn-secondary"
            >
              Стоп
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function SoonTool({ title, text, onBack }: { title: string; text: string; onBack: () => void }) {
  return (
    <div>
      <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-text-secondary">
        <IconArrowLeft size={16} />
        Инструменты
      </button>
      <div className="mt-6 rounded-[1.5rem] bg-white px-6 py-10 text-center shadow-[var(--shadow-card)]">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#eadcfd] text-[#6d28d9]">
          <IconHeadset size={24} />
        </span>
        <h1 className="mt-5 text-xl font-bold text-text">{title}</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-text-secondary">{text}</p>
      </div>
    </div>
  )
}

export function CoachToolsPage() {
  const [panel, setPanel] = useState<ToolId | null>(null)
  const [dashboard, setDashboard] = useState<CoachDashboard | null>(null)
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [invite, setInvite] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (panel !== 'analytics' && panel !== 'club' && panel !== 'access') return
    Promise.all([coachApi.dashboard(), coachApi.groups()])
      .then(([dash, list]) => {
        setDashboard(dash)
        setGroups(list)
      })
      .catch(() => {
        setDashboard(null)
        setGroups([])
      })
    if (panel === 'club') {
      coachApi.createInviteCode()
        .then((res) => {
          setInvite(res.code)
          setMessage(null)
        })
        .catch((e) => {
          setInvite(null)
          setMessage(e instanceof ApiError ? e.message : 'Не удалось получить код клуба')
        })
    }
  }, [panel])

  const copyClubCode = async () => {
    if (!invite) return
    try {
      await navigator.clipboard.writeText(invite)
      setMessage('Код скопирован — отправьте его ученику')
    } catch {
      setMessage('Скопируйте код вручную')
    }
  }

  if (panel === 'timer') return <div className="mx-auto w-full max-w-lg px-5 pb-6 pt-6 lg:max-w-3xl lg:px-8 lg:pt-8"><TimerTool onBack={() => setPanel(null)} /></div>
  if (panel === 'fitness' || panel === 'kata') {
    return (
      <div className="mx-auto w-full max-w-lg px-5 pb-6 pt-6 lg:max-w-3xl lg:px-8 lg:pt-8">
        <SoonTool
          title={panel === 'fitness' ? 'Конструктор подготовки' : 'Библиотека ката'}
          text="Раздел уже на месте в кабинете. Наполнение — комплексы, видео и чек-листы — появится следующим обновлением."
          onBack={() => setPanel(null)}
        />
      </div>
    )
  }

  if (panel === 'analytics' || panel === 'club' || panel === 'access') {
    return (
      <div className="mx-auto w-full max-w-lg px-5 pb-6 pt-6 lg:max-w-3xl lg:px-8 lg:pt-8">
        <button type="button" onClick={() => setPanel(null)} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-text-secondary">
          <IconArrowLeft size={16} />
          Инструменты
        </button>
        <h1 className="mt-3 text-[1.65rem] font-bold tracking-tight text-text">
          {panel === 'analytics' ? 'Аналитика группы' : panel === 'club' ? 'Настройки клуба' : 'Доступы и ассистенты'}
        </h1>
        {message && <p className="alert-success mt-4">{message}</p>}
        {panel === 'analytics' && dashboard && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-[1.25rem] bg-white p-4 shadow-[var(--shadow-card)]">
              <p className="text-2xl font-bold text-text">{dashboard.totalStudents}</p>
              <p className="text-sm text-text-secondary">учеников</p>
            </div>
            <div className="rounded-[1.25rem] bg-white p-4 shadow-[var(--shadow-card)]">
              <p className="text-2xl font-bold text-text">{dashboard.totalGroups}</p>
              <p className="text-sm text-text-secondary">групп</p>
            </div>
            <Link to="/coach/students" className="col-span-2 rounded-[1.25rem] bg-white px-4 py-4 text-sm font-semibold text-text shadow-[var(--shadow-card)]">
              Открыть базу и посещаемость
            </Link>
          </div>
        )}
        {panel === 'club' && (
          <div className="mt-4 space-y-3 rounded-[1.25rem] bg-white p-4 shadow-[var(--shadow-card)]">
            <p className="font-semibold text-text">{dashboard?.clubName ?? 'Клуб'}</p>
            <p className="text-sm text-text-secondary">
              Один код на клуб. Отправьте его ученику: после ввода ребёнок присоединится к секции. Код можно использовать много раз.
            </p>
            {invite ? (
              <p className="font-mono text-3xl font-bold tracking-[0.28em] text-text">{invite}</p>
            ) : (
              <p className="text-sm text-text-secondary">Загрузка кода…</p>
            )}
            <button type="button" onClick={() => void copyClubCode()} disabled={!invite} className="btn-coach">
              Скопировать код
            </button>
            <LogoutButton label="Выйти из кабинета" />
          </div>
        )}
        {panel === 'access' && (
          <ul className="mt-4 space-y-2">
            {groups.map((group) => (
              <li key={group.id} className="rounded-[1.25rem] bg-white px-4 py-3 shadow-[var(--shadow-card)]">
                <p className="font-semibold text-text">{group.name}</p>
                <p className="text-sm text-text-secondary">
                  {group.studentCount} уч. · {group.assistantAccess ? 'доступ ассистента' : 'вы ведёте группу'}
                </p>
              </li>
            ))}
            <li>
              <Link to="/coach/students?add=student" className="btn-coach mt-2">
                Пригласить ученика
              </Link>
            </li>
          </ul>
        )}
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-6 pt-6 lg:max-w-3xl lg:px-8 lg:pt-8">
      <h1 className="text-[1.65rem] font-bold leading-tight tracking-tight text-text">Инструменты</h1>
      <p className="mt-1 text-sm text-text-secondary">Помощник тренера в повседневной работе</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {tools.map((tool) => {
          const Icon = tool.icon
          const className = `flex flex-col items-start rounded-[1.25rem] bg-white p-4 text-left shadow-[var(--shadow-card)] transition active:scale-[0.99] ${
            tool.wide ? 'col-span-2' : ''
          }`
          const body = (
            <>
              <span className={`flex size-11 items-center justify-center rounded-2xl ${tool.iconClass}`}>
                <Icon size={20} />
              </span>
              <span className="mt-3 text-sm font-semibold leading-snug text-text">{tool.title}</span>
              <span className="mt-1 text-xs leading-snug text-text-secondary">{tool.subtitle}</span>
            </>
          )
          if (tool.to) {
            return (
              <Link key={tool.id} to={tool.to} className={className}>
                {body}
              </Link>
            )
          }
          return (
            <button key={tool.id} type="button" onClick={() => setPanel(tool.id as ToolId)} className={className}>
              {body}
            </button>
          )
        })}
      </div>
    </div>
  )
}
