import type { ReactNode } from 'react'
import { IconDumbbell, IconTimer } from '../../../../components/ui/Icons'
import { CATEGORIES } from './exercises'
import { workSeconds, type Workout } from './generator'
import { approxMinutes, plural, setsLabel, volumeLabel } from './format'
import type { ComplexAuthor } from './dayComplex'
import { Pictogram } from './Pictogram'

function Stat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-surface-muted px-2 py-3 text-center">
      <span className="text-brand-blue">{icon}</span>
      <span className="mt-1.5 text-sm font-bold text-text">{value}</span>
      <span className="text-[11px] text-text-secondary">{label}</span>
    </div>
  )
}

function FlameIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-3 2-5 5-5 8 0 4 3 7 7 7Z" />
    </svg>
  )
}

export function ResultScreen({
  workout,
  author,
  onStart,
  onRegenerate,
  onEdit,
}: {
  workout: Workout
  author?: ComplexAuthor
  onStart: () => void
  onRegenerate?: () => void
  onEdit?: () => void
}) {
  const work = workout.items.reduce((s, i) => s + i.sets * workSeconds(i), 0)
  const rest = workout.items.reduce((s, i) => s + i.sets * i.rest, 0)
  const total = workout.totalSeconds

  return (
    <>
      <section className="rounded-3xl border border-border-light bg-white p-5 shadow-[var(--shadow-card)]">
        {author ? (
          <span className="inline-flex rounded-full bg-brand-blue-light px-2.5 py-1 text-[11px] font-bold tracking-[0.12em] text-brand-blue">
            КОМПЛЕКС ДНЯ
          </span>
        ) : (
          <p className="text-sm font-semibold text-brand-green">Твой комплекс готов</p>
        )}
        <h2 className="mt-1 text-[1.75rem] font-bold uppercase leading-tight tracking-tight text-text">{workout.title}</h2>
        <p className="text-sm text-text-secondary">{workout.minutes} минут</p>

        {author && (
          <figure className="mt-4 rounded-2xl bg-surface-muted p-3.5">
            <figcaption className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4ade80] to-[#16a34a] text-sm font-bold text-white">
                {author.initials}
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold text-text">{author.name}</span>
                <span className="block text-xs text-text-secondary">{author.role}</span>
              </span>
            </figcaption>
            <blockquote className="mt-2.5 text-sm leading-snug text-text">«{author.quote}»</blockquote>
          </figure>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat icon={<IconTimer size={20} />} value={approxMinutes(total)} label="длительность" />
          <Stat icon={<FlameIcon />} value={workout.load} label="нагрузка" />
          <Stat
            icon={<IconDumbbell size={20} />}
            value={`${workout.items.length} ${plural(workout.items.length, 'упражнение', 'упражнения', 'упражнений')}`}
            label="в комплексе"
          />
        </div>

        <div className="mt-4">
          <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full" aria-hidden>
            {workout.items.map((item) => (
              <span key={item.exercise.id} className="bar-grow h-full" style={{ flexGrow: (item.sets * workSeconds(item)) / total, backgroundColor: CATEGORIES[item.exercise.category].color }} />
            ))}
            <span className="h-full bg-[#e2e8f0]" style={{ flexGrow: rest / total }} />
            <span className="h-full bg-[#a78bfa]" style={{ flexGrow: workout.finisher.seconds / total }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-secondary">
            <span>Работа {approxMinutes(work)}</span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-[#e2e8f0]" /> Отдых {approxMinutes(rest)}
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-[#a78bfa]" /> Заминка {workout.finisher.seconds} сек
            </span>
          </div>
        </div>
      </section>

      {workout.insights.length > 0 && (
        <section className="rounded-3xl bg-brand-blue-light/60 p-4">
          <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-brand-blue">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2Z" />
            </svg>
            ПОЧЕМУ ТАК
          </p>
          <ul className="mt-2 space-y-1.5">
            {workout.insights.map((text) => (
              <li key={text} className="text-sm leading-snug text-text">
                {text}
              </li>
            ))}
          </ul>
        </section>
      )}

      <ol className="space-y-0">
        {workout.items.map((item, index) => {
          const meta = CATEGORIES[item.exercise.category]
          return (
            <li key={item.exercise.id} className="sheet-item" style={{ animationDelay: `${0.1 + index * 0.08}s` }}>
              <div className="rounded-3xl border border-border-light bg-white p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-start gap-3">
                  <span className="text-[2rem] font-bold leading-none tabular-nums" style={{ color: meta.color }}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[15px] font-bold uppercase leading-snug tracking-tight text-text">{item.exercise.name}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">{item.exercise.description}</p>
                  </div>
                  <Pictogram pose={item.exercise.pose} category={item.exercise.category} size={52} />
                </div>
                <div className="mt-3 flex items-end justify-between gap-3 rounded-2xl px-3.5 py-3" style={{ backgroundColor: meta.soft }}>
                  <div>
                    <p className="text-xl font-bold leading-tight text-text">
                      {item.sets} × {item.reps ?? `${item.seconds} с`}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {setsLabel(item.sets)} × {volumeLabel(item)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-text-secondary">Отдых</p>
                    <p className="text-sm font-bold text-text">{item.rest} сек</p>
                  </div>
                </div>
                {item.note && (
                  <p className="mt-2.5 text-xs leading-snug text-text-secondary">
                    <span className="font-semibold text-text">Совет автора: </span>
                    {item.note}
                  </p>
                )}
              </div>
              <div className="flex justify-center py-1.5 text-text-muted" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 5v14M6 13l6 6 6-6" />
                </svg>
              </div>
            </li>
          )
        })}
        <li className="sheet-item" style={{ animationDelay: `${0.1 + workout.items.length * 0.08}s` }}>
          <div className="flex items-center gap-3 rounded-3xl border border-[#ddd6fe] bg-[#f5f3ff] p-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#7c3aed]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M12 21c-4-3-8-6-8-11a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 5-4 8-8 11Z" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold tracking-wide text-[#7c3aed]">ФИНИШ</p>
              <p className="text-[15px] font-semibold text-text">{workout.finisher.name}</p>
              <p className="text-xs text-text-secondary">{workout.finisher.description}</p>
            </div>
            <span className="text-sm font-bold text-text">{workout.finisher.seconds} с</span>
          </div>
        </li>
      </ol>

      <div className="space-y-2.5 pt-2">
        <button
          type="button"
          onClick={onStart}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand-blue text-base font-semibold text-white shadow-[var(--shadow-blue)] transition hover:brightness-110 active:scale-[0.99]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
          </svg>
          Начать тренировку
        </button>
        {onRegenerate && onEdit && (
          <div className="grid grid-cols-[1.5fr_1fr] gap-2.5">
            <button type="button" onClick={onRegenerate} className="btn-secondary min-h-12 rounded-2xl px-3 text-sm whitespace-nowrap">
              ↻ Сгенерировать заново
            </button>
            <button type="button" onClick={onEdit} className="btn-secondary min-h-12 rounded-2xl">
              ✎ Изменить
            </button>
          </div>
        )}
      </div>
    </>
  )
}
