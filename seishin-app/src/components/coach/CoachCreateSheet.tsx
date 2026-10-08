import { useNavigate } from 'react-router-dom'
import { Dialog } from '../a11y/Dialog'
import { IconArrowRight, IconCalendar, IconHeadset, IconMegaphone, IconTrophy, IconX } from '../ui/Icons'

const actions = [
  {
    id: 'competition',
    title: 'Заявка на соревнование',
    description: 'Создать турнир / заявку',
    to: '/coach/competitions?add=competition',
    icon: IconTrophy,
    iconClass: 'bg-[#f8e7b0] text-[#a16207]',
  },
  {
    id: 'notice',
    title: 'Уведомление родителям',
    description: 'Отправить сообщение',
    to: '/coach/chat',
    icon: IconMegaphone,
    iconClass: 'bg-[#dbe7fb] text-[#1d4e89]',
  },
  {
    id: 'training',
    title: 'Тренировка в группе',
    description: 'Создать тренировку',
    to: '/coach/schedule?add=slot',
    icon: IconCalendar,
    iconClass: 'bg-[#d9f3e4] text-[#1f7a4d]',
  },
  {
    id: 'katavr',
    title: 'Тренировка в KataVR',
    description: 'Создать тренировку',
    to: '/coach/secret',
    icon: IconHeadset,
    iconClass: 'bg-[#eadcfd] text-[#6d28d9]',
  },
] as const

export function CoachCreateSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()

  return (
    <Dialog open={open} titleId="coach-create-title" onClose={onClose}>
      <div className="relative overflow-hidden rounded-[1.75rem] bg-white p-5 shadow-[var(--shadow-elevated)]">
        <div className="flex items-center justify-between gap-3">
          <h2 id="coach-create-title" className="font-display text-xl font-semibold tracking-tight text-text">
            Создать
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="flex size-11 items-center justify-center rounded-full bg-surface-muted text-text-secondary transition hover:bg-surface-subtle"
          >
            <IconX size={18} />
          </button>
        </div>

        <ul className="mt-3">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <li key={action.id}>
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    navigate(action.to)
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-1 py-3 text-left transition hover:bg-surface-muted active:scale-[0.99]"
                >
                  <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${action.iconClass}`}>
                    <Icon size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-text">{action.title}</span>
                    <span className="mt-0.5 block text-xs text-text-secondary">{action.description}</span>
                  </span>
                  <IconArrowRight size={16} className="shrink-0 text-text-muted" />
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </Dialog>
  )
}
