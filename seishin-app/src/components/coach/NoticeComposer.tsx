import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { coachApi } from '../../api/coach'
import type { GroupSummary, StudentSummary } from '../../api/types'
import { useAuth } from '../../context/AuthContext'
import { useStoredState } from '../../hooks/useStoredState'
import { applyGroupEdits, EMPTY_GROUP_EDITS, GROUP_EDITS_KEY, type GroupEdits } from '../../utils/groupEdits'
import { plural } from './home/helpers'
import { IconAward, IconBell, IconCalendar, IconCheck, IconClipboard, IconTimer, IconTrophy, IconX } from '../ui/Icons'

type Topic = {
  id: string
  label: string
  icon: ComponentType<{ size?: number; className?: string }>
  tone: string
  text: (groups: string) => string
}

const TOPICS: Topic[] = [
  {
    id: 'cancel',
    label: 'Отмена тренировки',
    icon: IconX,
    tone: 'bg-error-bg text-error',
    text: (g) => `Здравствуйте! Тренировка${g} отменяется. О следующем занятии сообщу отдельно.`,
  },
  {
    id: 'move',
    label: 'Перенос',
    icon: IconTimer,
    tone: 'bg-[#fff4e0] text-[#d97706]',
    text: (g) => `Здравствуйте! Тренировка${g} переносится на другое время. Новое время — в расписании в приложении.`,
  },
  {
    id: 'payment',
    label: 'Оплата',
    icon: IconClipboard,
    tone: 'bg-[#fde8e8] text-[#d94b55]',
    text: () => 'Здравствуйте! Напоминаю об оплате занятий за этот месяц. Спасибо!',
  },
  {
    id: 'competition',
    label: 'Соревнование',
    icon: IconTrophy,
    tone: 'bg-brand-blue-light text-brand-blue',
    text: () => 'Здравствуйте! Скоро соревнования. Подтвердите, пожалуйста, участие ребёнка в приложении.',
  },
  {
    id: 'attestation',
    label: 'Аттестация',
    icon: IconAward,
    tone: 'bg-[#f3e8ff] text-[#7c3aed]',
    text: () => 'Здравствуйте! Скоро аттестация на пояс. Подробности — в разделе событий в приложении.',
  },
  {
    id: 'custom',
    label: 'Своё',
    icon: IconCalendar,
    tone: 'bg-surface-muted text-text-secondary',
    text: () => '',
  },
]

const MAX = 300

function StepTitle({ n, children }: { n: number; children: string }) {
  return (
    <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-text">
      <span className="flex size-5 items-center justify-center rounded-full bg-brand-blue text-[11px] font-bold text-white">{n}</span>
      {children}
    </p>
  )
}

export function NoticeComposer() {
  const { user } = useAuth()
  const [rawGroups, setRawGroups] = useState<GroupSummary[]>([])
  const [rawMembers, setRawMembers] = useState<Record<number, StudentSummary[]>>({})
  const [loading, setLoading] = useState(true)
  const [edits] = useStoredState<GroupEdits>(GROUP_EDITS_KEY, EMPTY_GROUP_EDITS)
  const [picked, setPicked] = useState<number[] | null>(null)
  const [topic, setTopic] = useState<string | null>(null)
  const [text, setText] = useState('')

  useEffect(() => {
    let alive = true
    coachApi
      .groups()
      .then(async (list) => {
        const entries = await Promise.all(list.map(async (g) => [g.id, await coachApi.groupStudents(g.id).catch(() => [])] as const))
        if (!alive) return
        setRawGroups(list)
        setRawMembers(Object.fromEntries(entries))
      })
      .catch(() => undefined)
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const { groups, members } = useMemo(() => applyGroupEdits(rawGroups, rawMembers, edits), [rawGroups, rawMembers, edits])
  const selected = picked ?? groups.map((g) => g.id)
  const allOn = groups.length > 0 && selected.length === groups.length
  const recipients = new Set(selected.flatMap((id) => (members[id] ?? []).map((s) => s.id))).size
  const groupSuffix = selected.length === 1 ? ` в группе «${groups.find((g) => g.id === selected[0])?.name ?? ''}»` : ''

  const toggleGroup = (id: number) => setPicked(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])

  const chooseTopic = (t: Topic) => {
    setTopic(t.id)
    setText(t.text(groupSuffix))
  }

  const chip = (on: boolean) =>
    `inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition active:scale-95 ${
      on ? 'bg-brand-blue text-white shadow-sm' : 'bg-surface-muted text-text'
    }`

  return (
    <div className="mt-4 space-y-5">
      <section className="sheet-item" style={{ animationDelay: '0.06s' }}>
        <StepTitle n={1}>Кому</StepTitle>
        {loading ? (
          <div className="flex gap-1.5">
            <span className="skeleton h-9 w-28 rounded-full" />
            <span className="skeleton h-9 w-24 rounded-full" />
          </div>
        ) : groups.length === 0 ? (
          <p className="text-xs text-text-secondary">Сначала создайте группу и добавьте учеников.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            <button type="button" aria-pressed={allOn} onClick={() => setPicked(allOn ? [] : groups.map((g) => g.id))} className={chip(allOn)}>
              {allOn && <IconCheck size={13} />}
              Все группы
            </button>
            {groups.map((g) => {
              const on = selected.includes(g.id)
              return (
                <button key={g.id} type="button" aria-pressed={on} onClick={() => toggleGroup(g.id)} className={chip(on && !allOn)}>
                  {g.name}
                  <span className={`text-[11px] ${on && !allOn ? 'text-white/75' : 'text-text-muted'}`}>{members[g.id]?.length ?? 0}</span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <section className="sheet-item" style={{ animationDelay: '0.12s' }}>
        <StepTitle n={2}>О чём</StepTitle>
        <div className="grid grid-cols-3 gap-2">
          {TOPICS.map((t) => {
            const Icon = t.icon
            const on = topic === t.id
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={on}
                onClick={() => chooseTopic(t)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border px-1.5 py-2.5 text-center transition active:scale-95 ${
                  on ? 'border-brand-blue bg-brand-blue-light/50' : 'border-border-light bg-white'
                }`}
              >
                <span className={`flex size-9 items-center justify-center rounded-xl ${t.tone}`}>
                  <Icon size={17} />
                </span>
                <span className="text-[11px] leading-tight font-semibold text-text">{t.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="sheet-item" style={{ animationDelay: '0.18s' }}>
        <StepTitle n={3}>Текст</StepTitle>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX))}
          rows={4}
          placeholder="Выберите повод выше или напишите своё сообщение"
          className="input-coach min-h-24 w-full resize-none text-sm leading-snug"
        />
        <p className="mt-1 text-right text-[11px] text-text-muted tabular-nums">
          {text.length} / {MAX}
        </p>

        {text.trim() && (
          <div className="pop-in mt-2">
            <p className="mb-1.5 text-[11px] font-medium text-text-muted">Так увидит родитель</p>
            <div className="flex gap-3 rounded-2xl bg-surface-muted p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-blue text-white">
                <IconBell size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="truncate font-semibold text-text">{user?.name ? `Тренер ${user.name}` : 'Тренер'}</span>
                  <span className="shrink-0 text-text-muted">сейчас</span>
                </p>
                <p className="mt-0.5 line-clamp-3 text-[13px] leading-snug text-text-secondary">{text}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      <div>
        <button
          type="button"
          disabled
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-blue text-sm font-semibold text-white shadow-[var(--shadow-blue)] disabled:opacity-60"
        >
          <IconBell size={16} />
          {recipients > 0 ? `Отправить родителям · ${recipients} ${plural(recipients, 'ребёнок', 'ребёнка', 'детей')}` : 'Выберите группы'}
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold tracking-wide">СКОРО</span>
        </button>
        <p className="mt-2 text-center text-[11px] text-text-muted">Пуш-уведомления родителям появятся в следующих версиях.</p>
      </div>
    </div>
  )
}
