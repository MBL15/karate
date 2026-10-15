import { useState } from 'react'
import { SectionTitle, ToolCard, ToolShell } from '../../../components/coach/tools/ToolShell'
import { IconPlus, IconX } from '../../../components/ui/Icons'
import { useStoredState } from '../../../hooks/useStoredState'
import { plural } from '../../../components/coach/home/helpers'
import {
  type BlockKind,
  type PlanBlock,
  TRAINING_BLOCKS,
  TrainingBlockTimeline,
  newPlanBlock,
  totalPlanMinutes,
} from '../../../utils/trainingPlanBlocks'

type TrainingPlan = { id: string; name: string; audience: string; blocks: PlanBlock[]; updatedAt: number }

const uid = () => Math.random().toString(36).slice(2, 10)

const block = newPlanBlock

const TEMPLATES: Omit<TrainingPlan, 'id' | 'updatedAt'>[] = [
  {
    name: 'Базовая тренировка',
    audience: 'Все группы',
    blocks: [block('warmup', 10), block('kihon', 15), block('kata', 15), block('kumite', 10), block('ofp', 5), block('cooldown', 5)],
  },
  {
    name: 'Детская группа',
    audience: 'Младшие 5–8 лет',
    blocks: [block('game', 10, 'Разминка-игра'), block('kihon', 10), block('game', 10, 'Подвижные игры'), block('kata', 10), block('cooldown', 5)],
  },
  {
    name: 'Подготовка к аттестации',
    audience: 'Перед сдачей на пояс',
    blocks: [block('warmup', 15), block('kihon', 25), block('kata', 25), block('kumite', 15), block('cooldown', 10)],
  },
  {
    name: 'Соревновательная',
    audience: 'Сборная клуба',
    blocks: [block('warmup', 15), block('kumite', 30, 'Спарринги по раундам'), block('ofp', 20), block('cooldown', 10)],
  },
]

function minutesLabel(n: number) {
  return `${n} мин`
}

function PlanCard({ plan, onOpen, action }: { plan: Omit<TrainingPlan, 'id' | 'updatedAt'>; onOpen: () => void; action: string }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="tool-tile w-full rounded-3xl border border-border-light bg-white p-4 text-left shadow-[var(--shadow-card)] hover:border-brand-blue/25"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-text">{plan.name}</p>
          <p className="mt-0.5 truncate text-xs text-text-secondary">
            {plan.audience || 'Без группы'} · {plan.blocks.length} {plural(plan.blocks.length, 'блок', 'блока', 'блоков')}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-text">
          {minutesLabel(totalPlanMinutes(plan.blocks))}
        </span>
      </div>
      <div className="mt-3">
        <TrainingBlockTimeline blocks={plan.blocks} />
      </div>
      <p className="mt-3 text-xs font-semibold text-brand-blue">{action}</p>
    </button>
  )
}

function PlanEditor({
  initial,
  isNew,
  onSave,
  onDelete,
}: {
  initial: TrainingPlan
  isNew: boolean
  onSave: (plan: TrainingPlan) => void
  onDelete: () => void
}) {
  const [plan, setPlan] = useState(initial)
  const total = totalPlanMinutes(plan.blocks)

  const updateBlock = (id: string, patch: Partial<PlanBlock>) =>
    setPlan((p) => ({ ...p, blocks: p.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) }))

  const move = (index: number, delta: number) =>
    setPlan((p) => {
      const blocks = [...p.blocks]
      const target = index + delta
      if (target < 0 || target >= blocks.length) return p
      ;[blocks[index], blocks[target]] = [blocks[target], blocks[index]]
      return { ...p, blocks }
    })

  return (
    <div className="space-y-4">
      <ToolCard>
        <input
          value={plan.name}
          onChange={(e) => setPlan({ ...plan, name: e.target.value })}
          placeholder="Название плана"
          aria-label="Название плана"
          className="w-full bg-transparent text-xl font-bold text-text outline-none placeholder:text-text-muted"
        />
        <input
          value={plan.audience}
          onChange={(e) => setPlan({ ...plan, audience: e.target.value })}
          placeholder="Для кого: группа, возраст, цель"
          aria-label="Для кого"
          className="mt-1 w-full bg-transparent text-sm text-text-secondary outline-none placeholder:text-text-muted"
        />
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-text-secondary">Длительность</span>
          <span className="font-bold text-text">{minutesLabel(total)}</span>
        </div>
        <div className="mt-2">
          <TrainingBlockTimeline blocks={plan.blocks} tall />
        </div>
      </ToolCard>

      <ul className="space-y-2.5">
        {plan.blocks.map((item, index) => {
          const meta = TRAINING_BLOCKS[item.kind]
          return (
            <li key={item.id} className="pop-in flex items-center gap-3 rounded-2xl border border-border-light bg-white p-3 shadow-[var(--shadow-card)]">
              <div className="flex flex-col">
                <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Выше" className="px-1 text-text-muted disabled:opacity-30">
                  ▲
                </button>
                <button type="button" onClick={() => move(index, 1)} disabled={index === plan.blocks.length - 1} aria-label="Ниже" className="px-1 text-text-muted disabled:opacity-30">
                  ▼
                </button>
              </div>
              <span className="h-10 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: meta.color }}>
                  {meta.label}
                </p>
                <input
                  value={item.title}
                  onChange={(e) => updateBlock(item.id, { title: e.target.value })}
                  aria-label="Название блока"
                  className="w-full bg-transparent text-sm font-semibold text-text outline-none"
                />
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded-full bg-surface-muted p-1">
                <button type="button" onClick={() => updateBlock(item.id, { minutes: Math.max(1, item.minutes - 5) })} aria-label="Меньше" className="size-7 rounded-full text-sm font-bold text-text-secondary active:scale-90">
                  −
                </button>
                <span className="w-9 text-center text-xs font-semibold tabular-nums text-text">{item.minutes}′</span>
                <button type="button" onClick={() => updateBlock(item.id, { minutes: Math.min(120, item.minutes + 5) })} aria-label="Больше" className="size-7 rounded-full text-sm font-bold text-text-secondary active:scale-90">
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => setPlan((p) => ({ ...p, blocks: p.blocks.filter((b) => b.id !== item.id) }))}
                aria-label="Удалить блок"
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-error-bg hover:text-error"
              >
                <IconX size={14} />
              </button>
            </li>
          )
        })}
      </ul>

      <ToolCard>
        <SectionTitle>Добавить блок</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TRAINING_BLOCKS) as BlockKind[]).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => setPlan((p) => ({ ...p, blocks: [...p.blocks, block(kind, 10)] }))}
              className="flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition active:scale-95"
              style={{ backgroundColor: TRAINING_BLOCKS[kind].soft, color: TRAINING_BLOCKS[kind].color }}
            >
              <IconPlus size={14} />
              {TRAINING_BLOCKS[kind].label}
            </button>
          ))}
        </div>
      </ToolCard>

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => onSave({ ...plan, name: plan.name.trim() || 'Без названия', updatedAt: Date.now() })}
          disabled={plan.blocks.length === 0}
          className="btn-coach min-h-12 flex-1 rounded-2xl"
        >
          Сохранить план
        </button>
        {!isNew && (
          <button type="button" onClick={onDelete} className="btn-secondary min-h-12 rounded-2xl text-error">
            Удалить
          </button>
        )}
      </div>
    </div>
  )
}

export function PlansTool() {
  const [plans, setPlans] = useStoredState<TrainingPlan[]>('training-plans', [])
  const [tab, setTab] = useState<'mine' | 'templates'>(plans.length ? 'mine' : 'templates')
  const [editing, setEditing] = useState<{ plan: TrainingPlan; isNew: boolean } | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  const startFrom = (source: Omit<TrainingPlan, 'id' | 'updatedAt'>) =>
    setEditing({
      isNew: true,
      plan: { ...source, id: uid(), updatedAt: Date.now(), blocks: source.blocks.map((b) => ({ ...b, id: uid() })) },
    })

  if (editing) {
    return (
      <ToolShell
        kind="plans"
        title={editing.isNew ? 'Новый план' : 'План тренировки'}
        subtitle="Блоки, порядок и длительность"
        onBack={() => setEditing(null)}
        backLabel="Все планы"
      >
        <PlanEditor
          key={editing.plan.id}
          initial={editing.plan}
          isNew={editing.isNew}
          onDelete={() => {
            setPlans((list) => list.filter((p) => p.id !== editing.plan.id))
            setEditing(null)
          }}
          onSave={(plan) => {
            setPlans((list) => (list.some((p) => p.id === plan.id) ? list.map((p) => (p.id === plan.id ? plan : p)) : [plan, ...list]))
            setSaved(plan.name)
            setTab('mine')
            setEditing(null)
          }}
        />
      </ToolShell>
    )
  }

  return (
    <ToolShell
      kind="plans"
      title="Планы тренировок"
      subtitle="Шаблоны и свои планы"
      action={
        <button
          type="button"
          onClick={() => startFrom({ name: '', audience: '', blocks: [block('warmup', 10), block('cooldown', 5)] })}
          aria-label="Новый план"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-blue text-white shadow-[var(--shadow-blue)] transition active:scale-95"
        >
          <IconPlus size={20} />
        </button>
      }
    >
      <div className="grid grid-cols-2 rounded-full bg-surface-muted p-1">
        {(['mine', 'templates'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            aria-pressed={tab === item}
            className={`min-h-10 rounded-full text-sm font-semibold transition ${tab === item ? 'bg-white text-text shadow-[var(--shadow-card)]' : 'text-text-secondary'}`}
          >
            {item === 'mine' ? `Мои планы (${plans.length})` : 'Шаблоны'}
          </button>
        ))}
      </div>

      {saved && <p className="alert-success pop-in">План «{saved}» сохранён</p>}

      <div key={tab} className="tool-stagger space-y-3">
        {tab === 'templates' &&
          TEMPLATES.map((template) => (
            <PlanCard key={template.name} plan={template} onOpen={() => startFrom(template)} action="Взять за основу →" />
          ))}
        {tab === 'mine' && plans.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border bg-white px-6 py-10 text-center">
            <p className="font-semibold text-text">Пока нет своих планов</p>
            <p className="mt-1 text-sm text-text-secondary">Начните с шаблона или создайте план с нуля.</p>
            <button type="button" onClick={() => setTab('templates')} className="btn-coach mt-4">
              Открыть шаблоны
            </button>
          </div>
        )}
        {tab === 'mine' &&
          plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onOpen={() => setEditing({ plan, isNew: false })} action="Открыть и изменить →" />
          ))}
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-secondary" aria-label="Цвета блоков">
        {(Object.keys(TRAINING_BLOCKS) as BlockKind[]).map((kind) => (
          <li key={kind} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: TRAINING_BLOCKS[kind].color }} aria-hidden />
            {TRAINING_BLOCKS[kind].label}
          </li>
        ))}
      </ul>
    </ToolShell>
  )
}
