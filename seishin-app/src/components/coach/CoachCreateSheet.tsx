import { useEffect, useState, type ComponentType } from 'react'
import { useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import { coachApi } from '../../api/coach'
import { ApiError } from '../../api/client'
import { BottomSheet } from '../ui/BottomSheet'
import { NoticeComposer } from './NoticeComposer'
import {
  IconArrowLeft,
  IconAward,
  IconCalendar,
  IconCheck,
  IconChevronRight,
  IconClipboard,
  IconMegaphone,
  IconPlus,
  IconTrophy,
  IconUsers,
  IconX,
} from '../ui/Icons'

export type CreateView = 'root' | 'event' | 'invite' | 'notice'

type Action = {
  id: string
  title: string
  description: string
  icon: ComponentType<{ size?: number; className?: string }>
  tone: string
  run: () => void
}

function ActionList({ actions }: { actions: Action[] }) {
  return (
    <ul className="mt-4 space-y-2.5">
      {actions.map((action, index) => {
        const Icon = action.icon
        return (
          <li key={action.id} className="sheet-item" style={{ animationDelay: `${0.08 + index * 0.06}s` }}>
            <button
              type="button"
              onClick={action.run}
              className="group flex w-full items-center gap-3.5 rounded-2xl border border-border-light bg-white p-3.5 text-left shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-brand-blue/30 active:scale-[0.99]"
            >
              <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${action.tone}`}>
                <Icon size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-text">{action.title}</span>
                <span className="mt-0.5 block text-xs text-text-secondary">{action.description}</span>
              </span>
              <IconChevronRight size={18} className="shrink-0 text-text-muted transition group-hover:translate-x-0.5 group-hover:text-brand-blue" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function SheetHeader({ title, onBack, onClose }: { title: string; onBack?: () => void; onClose: () => void }) {
  return (
    <div className="flex items-center gap-2">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Назад"
          className="-ml-2 flex size-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted"
        >
          <IconArrowLeft size={20} />
        </button>
      )}
      <h2 id="coach-create-title" className="flex-1 text-xl font-bold tracking-tight text-text">
        {title}
      </h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Закрыть"
        className="flex size-10 items-center justify-center rounded-full bg-surface-muted text-text-secondary transition hover:bg-surface-subtle"
      >
        <IconX size={18} />
      </button>
    </div>
  )
}

function InviteView({ onManual }: { onManual: () => void }) {
  const [code, setCode] = useState<string | null>(null)
  const [clubName, setClubName] = useState('')
  const [qr, setQr] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let alive = true
    coachApi
      .createInviteCode()
      .then(async (invite) => {
        if (!alive) return
        setCode(invite.code)
        setClubName(invite.clubName)
        const link = `${window.location.origin}/register?role=parent&code=${invite.code}`
        const url = await QRCode.toDataURL(link, {
          width: 440,
          margin: 1,
          errorCorrectionLevel: 'M',
          color: { dark: '#0f172a', light: '#ffffff' },
        })
        if (alive) setQr(url)
      })
      .catch((err) => {
        if (alive) setError(err instanceof ApiError ? err.message : 'Не удалось получить код')
      })
    return () => {
      alive = false
    }
  }, [])

  const link = code ? `${window.location.origin}/register?role=parent&code=${code}` : ''

  const copy = async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const share = async () => {
    if (!code) return
    const text = `Код для подключения к клубу «${clubName}» в Каратэ Хаб: ${code}`
    if (navigator.share) {
      await navigator.share({ title: 'Каратэ Хаб', text, url: link }).catch(() => undefined)
    } else {
      const ok = await navigator.clipboard
        .writeText(`${text}\n${link}`)
        .then(() => true)
        .catch(() => false)
      if (!ok) return
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <div className="mt-4">
      <p className="sheet-item text-sm leading-6 text-text-secondary" style={{ animationDelay: '0.06s' }}>
        Передайте родителю код или дайте отсканировать QR — ребёнок присоединится к {clubName ? `клубу «${clubName}»` : 'клубу'}.
      </p>

      {error ? (
        <p role="alert" className="mt-4 rounded-xl bg-error-bg px-4 py-3 text-sm text-error">
          {error}
        </p>
      ) : (
        <>
          <div className="sheet-item mt-5 flex justify-center gap-1.5" style={{ animationDelay: '0.12s' }} aria-label={code ? `Код ${code.split('').join(' ')}` : 'Загрузка кода'}>
            {Array.from({ length: 6 }, (_, index) => (
              <span
                key={index}
                className={`flex h-14 w-11 items-center justify-center rounded-xl border-2 text-2xl font-bold text-text ${
                  code ? 'border-brand-blue/30 bg-brand-blue-light/50' : 'skeleton border-transparent'
                }`}
              >
                {code?.[index] ?? ''}
              </span>
            ))}
          </div>

          <div className="sheet-item mt-5 flex justify-center" style={{ animationDelay: '0.18s' }}>
            <div className="rounded-3xl border border-border-light bg-white p-3 shadow-[var(--shadow-card)]">
              {qr ? (
                <img src={qr} alt="QR-код для подключения к клубу" className="size-44" />
              ) : (
                <span className="skeleton block size-44 rounded-2xl" />
              )}
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-text-muted">Сканируйте камерой телефона</p>

          <div className="sheet-item mt-5 grid grid-cols-2 gap-2.5" style={{ animationDelay: '0.24s' }}>
            <button type="button" onClick={() => void copy()} disabled={!code} className="btn-secondary min-h-12 rounded-2xl">
              {copied ? <IconCheck size={16} /> : <IconClipboard size={16} />}
              {copied ? 'Скопировано' : 'Копировать'}
            </button>
            <button type="button" onClick={() => void share()} disabled={!code} className="btn-coach min-h-12 rounded-2xl">
              Поделиться
            </button>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={onManual}
        className="mt-3 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-2xl text-sm font-semibold text-text-secondary transition hover:bg-surface-muted hover:text-text"
      >
        <IconPlus size={16} />
        Добавить ученика вручную
      </button>
    </div>
  )
}

export function CoachCreateSheet({
  open,
  initialView = 'root',
  onClose,
}: {
  open: boolean
  initialView?: CreateView
  onClose: () => void
}) {
  const navigate = useNavigate()
  const [view, setView] = useState<CreateView>(initialView)
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setView(initialView)
  }

  const go = (to: string) => {
    onClose()
    navigate(to)
  }

  const rootActions: Action[] = [
    {
      id: 'event',
      title: 'Создать событие',
      description: 'Турнир, аттестация или тренировка',
      icon: IconTrophy,
      tone: 'bg-brand-blue-light text-brand-blue',
      run: () => setView('event'),
    },
    {
      id: 'notice',
      title: 'Уведомление родителям',
      description: 'Отмена, перенос, оплата, события',
      icon: IconMegaphone,
      tone: 'bg-[#fff4e5] text-[#d97706]',
      run: () => setView('notice'),
    },
    {
      id: 'invite',
      title: 'Добавить ученика',
      description: 'Код приглашения и QR-код',
      icon: IconUsers,
      tone: 'bg-brand-green-light text-brand-green',
      run: () => setView('invite'),
    },
  ]

  const eventActions: Action[] = [
    {
      id: 'competition',
      title: 'Турнир / заявка',
      description: 'Соревнование с приглашением родителям',
      icon: IconTrophy,
      tone: 'bg-brand-blue-light text-brand-blue',
      run: () => go('/coach/competitions?add=competition'),
    },
    {
      id: 'attestation',
      title: 'Аттестация',
      description: 'Сдача на пояс',
      icon: IconAward,
      tone: 'bg-[#f3e8ff] text-[#7c3aed]',
      run: () => go('/coach/competitions?add=competition&kind=attestation'),
    },
    {
      id: 'training',
      title: 'Тренировка',
      description: 'Занятие в расписании группы',
      icon: IconCalendar,
      tone: 'bg-brand-green-light text-brand-green',
      run: () => go('/coach/schedule?add=slot'),
    },
  ]

  return (
    <BottomSheet open={open} titleId="coach-create-title" onClose={onClose}>
      <div
        key={view}
        ref={(el) => el?.closest('[role="dialog"]')?.scrollTo({ top: 0 })}
        className={view === 'root' ? '' : 'wizard-step-forward'}
      >
        {view === 'root' && (
          <>
            <SheetHeader title="Создать" onClose={onClose} />
            <ActionList actions={rootActions} />
          </>
        )}
        {view === 'event' && (
          <>
            <SheetHeader title="Создать событие" onBack={() => setView('root')} onClose={onClose} />
            <ActionList actions={eventActions} />
          </>
        )}
        {view === 'notice' && (
          <>
            <SheetHeader title="Сообщение родителям" onBack={() => setView('root')} onClose={onClose} />
            <NoticeComposer />
          </>
        )}
        {view === 'invite' && (
          <>
            <SheetHeader title="Добавить ученика" onBack={() => setView('root')} onClose={onClose} />
            <InviteView onManual={() => go('/coach/students?add=student')} />
          </>
        )}
      </div>
    </BottomSheet>
  )
}
