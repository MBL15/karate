import type { ClassEvent, GroupSummary, ScheduleSlot, SessionAttendance, StudentSummary } from '../../../api/types'
import { WEEKDAY_SHORT } from '../../../utils/schedule'
import { IconChevronRight, IconPlus, IconUsers } from '../../ui/Icons'
import { GROUP_TONES, plural, presentCount, shortDate } from './helpers'

export type LastTraining = { event: ClassEvent; session: SessionAttendance | null }

export function GroupsTab({
  groups,
  members,
  slots,
  lastTraining,
  onOpenGroup,
  onCreateGroup,
}: {
  groups: GroupSummary[]
  members: Record<number, StudentSummary[]>
  slots: ScheduleSlot[]
  lastTraining: Record<number, LastTraining>
  onOpenGroup: (groupId: number, tab: 'stats' | 'members' | 'schedule') => void
  onCreateGroup: () => void
}) {
  return (
    <section className="mt-5" aria-label="Группы">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold tracking-tight text-text">Мои группы</h2>
          {groups.length > 0 && <p className="text-xs text-text-secondary">Нажмите на группу — состав, расписание и статистика</p>}
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
        <div className="flex flex-col items-center rounded-3xl bg-white px-5 py-8 text-center shadow-[var(--shadow-card)]">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-blue-light text-brand-blue">
            <IconUsers size={26} />
          </span>
          <p className="mt-3 font-semibold text-text">Начните с групп</p>
          <p className="mt-1 max-w-xs text-sm text-text-secondary">
            Например, «Младшая» и «Старшая». Потом добавите в них учеников и поставите дни тренировок.
          </p>
          <button type="button" onClick={onCreateGroup} className="btn-coach mt-4 min-h-11 rounded-2xl px-5">
            Создать группы
          </button>
        </div>
      ) : (
        <ul className="tool-stagger space-y-3">
          {groups.map((group, index) => {
            const tone = GROUP_TONES[index % GROUP_TONES.length]
            const list = members[group.id] ?? []
            const groupSlots = slots.filter((s) => s.groupId === group.id)
            const days = [...new Set(groupSlots.map((s) => s.weekday))].sort().map((d) => WEEKDAY_SHORT[d - 1])
            const last = lastTraining[group.id]
            const marked = Boolean(last?.session?.sessionId)
            const total = last?.session?.entries.length || list.length
            const present = presentCount(last?.session)
            const percent = total ? Math.round((present / total) * 100) : 0
            const missing = list.length === 0 ? 'members' : groupSlots.length === 0 ? 'schedule' : null
            return (
              <li key={group.id}>
                <div className="rounded-3xl bg-white shadow-[var(--shadow-card)]">
                  <button
                    type="button"
                    onClick={() => onOpenGroup(group.id, 'stats')}
                    className="block w-full rounded-3xl p-4 text-left transition active:scale-[0.99]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: tone.bg, color: tone.fg }}>
                        <IconUsers size={22} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[17px] font-bold text-text">{group.name}</p>
                        <p className="text-xs text-text-secondary">
                          {list.length} {plural(list.length, 'ученик', 'ученика', 'учеников')}
                          {days.length ? ` · ${days.join(', ')}` : ''}
                        </p>
                      </div>
                      <IconChevronRight size={18} className="mt-3 shrink-0 text-text-muted" />
                    </div>

                    {last && marked ? (
                      <div className="mt-3.5">
                        <div className="flex items-baseline justify-between text-[11px]">
                          <span className="text-text-muted">Прошлая тренировка · {shortDate(last.event.date)}</span>
                          <span className="font-semibold text-text tabular-nums">
                            {present}/{total} · <span className="text-[#3dae6b]">{percent}%</span>
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#e7f6ee]">
                          <div className="bar-grow h-full rounded-full bg-[#3dae6b]" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    ) : last ? (
                      <p className="mt-3 rounded-2xl bg-[#fff8ec] px-3 py-2 text-xs text-[#b45309]">
                        Тренировка {shortDate(last.event.date)} не отмечена — откройте, чтобы отметить
                      </p>
                    ) : !missing ? (
                      <p className="mt-3 text-[11px] text-text-muted">Статистика появится после первой тренировки</p>
                    ) : null}
                  </button>

                  {missing && (
                    <button
                      type="button"
                      onClick={() => onOpenGroup(group.id, missing)}
                      className="flex w-full items-center gap-2 border-t border-border-light px-4 py-3 text-left text-sm font-semibold text-brand-blue"
                    >
                      <IconPlus size={14} />
                      <span className="flex-1">{missing === 'members' ? 'Добавить учеников' : 'Поставить дни и время'}</span>
                      <IconChevronRight size={16} />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
