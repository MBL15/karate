import { IconTrophy } from '../ui/Icons'
import { PLACE_UI, type ChildCompetitionResult } from '../../utils/competitionResults'
import { PARENT_CARD } from './parentUi'

function Medal({ color, count, label }: { color: string; count: number; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-surface-muted px-2 py-3">
      <span className="flex size-9 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: color }}>
        {count}
      </span>
      <span className="mt-1.5 text-[11px] font-semibold text-text-secondary">{label}</span>
    </div>
  )
}

export function CompetitionResultsCard({ results }: { results: ChildCompetitionResult[] }) {
  const sorted = [...results].sort((a, b) => b.eventDate.localeCompare(a.eventDate))
  const count = (place: number) => results.filter((r) => r.place === place).length

  return (
    <section className={PARENT_CARD}>
      <div className="flex items-center gap-2">
        <IconTrophy size={18} className="text-brand-blue" />
        <h2 className="font-display text-base font-bold text-text">Результаты соревнований</h2>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        <Medal color={PLACE_UI[1].medal} count={count(1)} label="Золото" />
        <Medal color={PLACE_UI[2].medal} count={count(2)} label="Серебро" />
        <Medal color={PLACE_UI[3].medal} count={count(3)} label="Бронза" />
        <Medal color="#4f6bed" count={results.length} label="Стартов" />
      </div>

      {sorted.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-surface-muted p-3 text-sm leading-relaxed text-text-secondary">
          Места и категории с турниров, в которых ребёнок принимал участие. Тренер уже может вносить итоги у себя — родителям они начнут приходить
          после обновления сервера.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-border-light">
          {sorted.map((r) => (
            <li key={r.competitionId} className="flex items-center gap-3 py-3">
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${PLACE_UI[r.place].className}`}>
                {PLACE_UI[r.place].short}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text">{r.competitionName}</p>
                <p className="truncate text-xs text-text-secondary">
                  {new Date(`${r.eventDate}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {r.category ? ` · ${r.category}` : ''}
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-text-secondary">{PLACE_UI[r.place].label}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
