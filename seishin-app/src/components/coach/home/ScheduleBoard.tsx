import type { GroupSummary, ScheduleSlot } from '../../../api/types'
import { hhmm, slotRange, WEEKDAY_SHORT } from '../../../utils/schedule'
import { IconCalendar, IconChevronRight, IconPlus, IconUsers } from '../../ui/Icons'
import { GROUP_TONES, plural } from './helpers'

function groupSummary(slots: ScheduleSlot[]) {
  const byRange = new Map<string, number[]>()
  for (const s of [...slots].sort((a, b) => a.weekday - b.weekday)) byRange.set(slotRange(s), [...(byRange.get(slotRange(s)) ?? []), s.weekday])
  return [...byRange.entries()].map(([range, days]) => `${days.map((d) => WEEKDAY_SHORT[d - 1]).join(', ')} · ${range}`)
}

export function ScheduleBoard({
  groups,
  slots,
  memberCount,
  todayWeekday,
  onEdit,
  onOpenMembers,
  onCreateGroup,
}: {
  groups: GroupSummary[]
  slots: ScheduleSlot[]
  memberCount: (groupId: number) => number
  todayWeekday: number
  onEdit: (groupId: number | null) => void
  onOpenMembers: (groupId: number) => void
  onCreateGroup: () => void
}) {
  const toneOf = (groupId: number) => GROUP_TONES[Math.max(groups.findIndex((g) => g.id === groupId), 0) % GROUP_TONES.length]
  const own = slots.filter((s) => groups.some((g) => g.id === s.groupId))
  const perWeek = own.length

  return (
    <section className="mt-8" aria-labelledby="schedule-title">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 id="schedule-title" className="font-display text-lg font-bold tracking-tight text-text">
            Расписание групп
          </h2>
          <p className="text-xs text-text-secondary">
            {perWeek ? `${perWeek} ${plural(perWeek, 'тренировка', 'тренировки', 'тренировок')} в неделю · повторяется каждую неделю` : 'Поставьте группам дни и время'}
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateGroup}
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand-blue-light px-3.5 text-sm font-semibold text-brand-blue transition active:scale-95"
        >
          <IconPlus size={14} />
          Группа
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl bg-white px-5 py-7 text-center shadow-[var(--shadow-card)]">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-blue-light text-brand-blue">
            <IconCalendar size={26} />
          </span>
          <p className="mt-3 font-semibold text-text">Сначала создайте группы</p>
          <p className="mt-1 max-w-xs text-sm text-text-secondary">Например, «Младшая» и «Старшая». Потом выберете для каждой дни и время.</p>
          <button type="button" onClick={onCreateGroup} className="btn-coach mt-4 min-h-11 rounded-2xl px-5">
            Создать группы
          </button>
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-4 shadow-[var(--shadow-card)]">
          <ol className="space-y-1.5" aria-label="Неделя">
            {WEEKDAY_SHORT.map((label, i) => {
              const day = i + 1
              const daySlots = own.filter((s) => s.weekday === day).sort((a, b) => a.startTime.localeCompare(b.startTime))
              const isToday = day === todayWeekday
              return (
                <li key={day} className="flex items-start gap-2.5">
                  <span
                    className={`flex h-9 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                      isToday ? 'bg-brand-blue text-white' : day > 5 ? 'bg-surface-muted text-[#d94b55]' : 'bg-surface-muted text-text'
                    }`}
                  >
                    {label}
                  </span>
                  {daySlots.length === 0 ? (
                    <span className="flex h-9 flex-1 items-center border-b border-dashed border-border-light text-xs text-text-muted">выходной</span>
                  ) : (
                    <div className="flex min-h-9 flex-1 flex-wrap gap-1.5">
                      {daySlots.map((slot) => {
                        const tone = toneOf(slot.groupId)
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => onEdit(slot.groupId)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition active:scale-95"
                            style={{ backgroundColor: tone.bg, color: tone.fg }}
                          >
                            <span className="tabular-nums">{hhmm(slot.startTime)}</span>
                            <span className="max-w-[7rem] truncate text-text">{slot.groupName}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </li>
              )
            })}
          </ol>

          <ul className="mt-4 space-y-2 border-t border-border-light pt-4">
            {groups.map((g) => {
              const tone = toneOf(g.id)
              const groupSlots = own.filter((s) => s.groupId === g.id)
              const lines = groupSummary(groupSlots)
              const count = memberCount(g.id)
              return (
                <li key={g.id} className={`rounded-2xl border p-3 ${groupSlots.length ? 'border-border-light' : 'border-[#f59e0b]/40 bg-[#fff8ec]'}`}>
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: tone.bg, color: tone.fg }}>
                      <IconUsers size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-text">{g.name}</p>
                      {lines.length ? (
                        lines.map((line) => (
                          <p key={line} className="truncate text-xs text-text-secondary tabular-nums">
                            {line}
                          </p>
                        ))
                      ) : (
                        <p className="text-xs font-semibold text-[#b45309]">Нет расписания</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onEdit(g.id)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                        groupSlots.length ? 'bg-brand-blue-light text-brand-blue' : 'bg-brand-blue text-white shadow-[var(--shadow-blue)]'
                      }`}
                    >
                      {groupSlots.length ? 'Изменить' : 'Поставить'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenMembers(g.id)}
                    className="mt-2 flex w-full items-center gap-1 pl-[3.25rem] text-left text-xs font-semibold text-text-secondary"
                  >
                    {count ? `${count} ${plural(count, 'ученик', 'ученика', 'учеников')}` : 'Нет учеников'} · состав и статистика
                    <IconChevronRight size={12} />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
