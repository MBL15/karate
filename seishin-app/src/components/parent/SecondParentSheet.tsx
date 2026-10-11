import { useId } from 'react'
import type { StudentSummary } from '../../api/types'
import { BottomSheet } from '../ui/BottomSheet'
import { IconCheck, IconX } from '../ui/Icons'

const STEPS = [
  'Второй родитель устанавливает приложение и регистрируется как родитель — на своё имя и свой телефон.',
  'Попросите у тренера личный код для каждого ребёнка: тренер создаёт его в карточке ученика («Код для родителя»).',
  'Второй родитель вводит код в «Добавить ребёнка по коду» — и сразу видит тот же дневник.',
]

const SHARED = ['Посещения, пояс и значки', 'Оплаты, мероприятия и ответы «придёт / не придёт»', 'Награды и история соревнований']

export function SecondParentSheet({ open, onClose, kids }: { open: boolean; onClose: () => void; kids: StudentSummary[] }) {
  const titleId = useId()
  const names = kids.map((c) => c.firstName).join(', ')

  return (
    <BottomSheet open={open} titleId={titleId} onClose={onClose}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="font-display text-xl font-bold text-text">
            Второй родитель
          </h2>
          <p className="mt-0.5 text-sm text-text-secondary">Свой аккаунт на своём телефоне — и те же дети{names ? `: ${names}` : ''}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-secondary transition active:scale-90"
        >
          <IconX size={16} />
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-border-light p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-text">Пригласить из приложения</p>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-bold text-text-muted">СКОРО</span>
        </div>
        <p className="mt-1 text-sm text-text-secondary">Вы сами создадите код для второго родителя — без обращения к тренеру.</p>
        <button type="button" disabled className="btn-secondary mt-3 min-h-11 w-full rounded-2xl text-sm opacity-60">
          Создать код приглашения
        </button>
      </div>

      <p className="mt-5 text-sm font-semibold text-text">Как подключить сейчас</p>
      <ol className="mt-2 space-y-2.5">
        {STEPS.map((step, i) => (
          <li key={step} className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-green-light text-xs font-bold text-brand-green">
              {i + 1}
            </span>
            <p className="text-sm leading-snug text-text">{step}</p>
          </li>
        ))}
      </ol>

      <div className="mt-5 rounded-2xl bg-surface-muted p-4">
        <p className="text-sm font-semibold text-text">Общее у обоих родителей</p>
        <ul className="mt-2 space-y-1.5">
          {SHARED.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-text">
              <IconCheck size={14} className="shrink-0 text-brand-green" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-text-secondary">
          Ответы общие: если один родитель ответил «не придёт», второй это увидит и сможет изменить. Фото пока хранятся на каждом телефоне отдельно.
        </p>
      </div>
    </BottomSheet>
  )
}
