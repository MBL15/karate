export type BlockKind = 'warmup' | 'kihon' | 'kata' | 'kumite' | 'ofp' | 'game' | 'cooldown'

export type PlanBlock = { id: string; kind: BlockKind; title: string; minutes: number }

export const TRAINING_BLOCKS: Record<BlockKind, { label: string; color: string; soft: string }> = {
  warmup: { label: 'Разминка', color: '#f59e0b', soft: '#fff4e0' },
  kihon: { label: 'Кихон', color: '#2563eb', soft: '#eaf1fe' },
  kata: { label: 'Ката', color: '#7c3aed', soft: '#f3e8ff' },
  kumite: { label: 'Кумитэ', color: '#ef4444', soft: '#fdecec' },
  ofp: { label: 'ОФП', color: '#16a34a', soft: '#e8f7ee' },
  game: { label: 'Игры', color: '#0ea5e9', soft: '#e0f4fd' },
  cooldown: { label: 'Заминка', color: '#64748b', soft: '#eef1f5' },
}

/** Теги «Блоки занятия» в теме тренировки → цвета как в шаблонах планов */
export const TOPIC_SUGGESTION_KIND: Record<string, BlockKind> = {
  Кихон: 'kihon',
  Ката: 'kata',
  Кумитэ: 'kumite',
  ОФП: 'ofp',
  Растяжка: 'cooldown',
  'Подготовка к аттестации': 'warmup',
}

const uid = () => Math.random().toString(36).slice(2, 10)

export function newPlanBlock(kind: BlockKind, minutes: number, title = TRAINING_BLOCKS[kind].label): PlanBlock {
  return { id: uid(), kind, title, minutes }
}

export function totalPlanMinutes(blocks: PlanBlock[]) {
  return blocks.reduce((sum, item) => sum + item.minutes, 0)
}

export function topicTagsToPlanBlocks(picked: string[]): PlanBlock[] {
  return picked.map((tag, index) => {
    const kind = TOPIC_SUGGESTION_KIND[tag] ?? 'warmup'
    return { id: `topic-${index}-${tag}`, kind, title: tag, minutes: 1 }
  })
}

export function TrainingBlockTimeline({ blocks, tall }: { blocks: PlanBlock[]; tall?: boolean }) {
  const total = totalPlanMinutes(blocks) || 1
  return (
    <div
      className={`flex w-full overflow-hidden rounded-full bg-border-light/50 ${tall ? 'h-3' : 'h-2.5'}`}
      role="img"
      aria-label={blocks.map((b) => b.title).join(', ')}
    >
      {blocks.map((item) => (
        <span
          key={item.id}
          className="h-full min-w-[8px] shrink-0 transition-[flex-grow] duration-300"
          style={{
            flexGrow: item.minutes,
            flexBasis: 0,
            backgroundColor: TRAINING_BLOCKS[item.kind].color,
          }}
        />
      ))}
      {total <= 0 && <span className="h-full w-full bg-border-light" />}
    </div>
  )
}

export function TopicPickedBlocksBar({
  picked,
  className = '',
  tall = true,
}: {
  picked: string[]
  className?: string
  tall?: boolean
}) {
  if (picked.length === 0) return null
  const blocks = topicTagsToPlanBlocks(picked)
  return (
    <div className={className}>
      <TrainingBlockTimeline blocks={blocks} tall={tall} />
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary" aria-label="Блоки в плане">
        {picked.map((tag) => {
          const kind = TOPIC_SUGGESTION_KIND[tag] ?? 'warmup'
          const color = TRAINING_BLOCKS[kind].color
          return (
            <li key={tag} className="flex items-center gap-1.5">
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
              {tag}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
