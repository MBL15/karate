import type { ClassEvent, SessionAttendance } from '../../../api/types'
import { IconCalendar, IconChevronRight, IconMapPin } from '../../ui/Icons'
import { classKey, eventRange, hhmm, minutesUntil, presentCount, shortDate, toIso, untilLabel, weekdayLong } from './helpers'

export function TodayTab({
  now,
  classes,
  attendance,
  memberCount,
  nextEvent,
  onOpen,
  onSchedule,
}: {
  now: Date
  classes: ClassEvent[]
  attendance: Record<string, SessionAttendance>
  memberCount: (groupId: number) => number
  nextEvent: ClassEvent | null
  onOpen: (event: ClassEvent) => void
  onSchedule: () => void
}) {
  const sorted = [...classes].sort((a, b) => a.startTime.localeCompare(b.startTime))
  const title = weekdayLong(toIso(now))

  return (
    <section className="mt-5" aria-label="Тренировки сегодня">
      <div className="mb-3">
        <h2 className="font-display text-base font-semibold tracking-tight text-text">
          {title}, {now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
        </h2>
        {sorted.length > 0 && <p className="text-xs text-text-secondary">Откройте тренировку — отметки, сообщения родителям и значки</p>}
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl bg-white px-5 py-8 text-center shadow-[var(--shadow-card)]">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-blue-light text-brand-blue">
            <IconCalendar size={26} />
          </span>
          <p className="mt-3 font-semibold text-text">Сегодня тренировок нет</p>
          {nextEvent ? (
            <button type="button" onClick={() => onOpen(nextEvent)} className="mt-1 text-sm text-text-secondary">
              Следующая: <span className="font-semibold text-text">{nextEvent.groupName}</span> · {weekdayLong(nextEvent.date).toLowerCase()},{' '}
              {shortDate(nextEvent.date)} в {hhmm(nextEvent.startTime)}
            </button>
          ) : (
            <>
              <p className="mt-1 max-w-xs text-sm text-text-secondary">Поставьте группам дни и время — тренировки будут появляться здесь.</p>
              <button type="button" onClick={onSchedule} className="btn-coach mt-4 min-h-11 rounded-2xl px-5">
                Составить расписание
              </button>
            </>
          )}
        </div>
      ) : (
        <ul className="tool-stagger space-y-3">
          {sorted.map((event) => {
            const session = attendance[classKey(event)]
            const total = memberCount(event.groupId) || session?.entries.length || event.studentCount
            const minutes = minutesUntil(event, now)
            const marked = !event.upcoming && Boolean(session?.sessionId)
            const present = presentCount(session)
            const confirmed = session?.entries.filter((e) => e.parentIntent === 'CONFIRMED').length ?? 0
            const declined = session?.entries.filter((e) => e.parentIntent === 'DECLINED').length ?? 0
            const status = event.upcoming
              ? { text: untilLabel(minutes), cls: 'bg-brand-blue-light text-brand-blue', bar: 'bg-brand-blue' }
              : marked
                ? { text: 'Отмечено', cls: 'bg-brand-green-light text-brand-green', bar: 'bg-[#3dae6b]' }
                : { text: minutes > -90 ? 'Идёт сейчас' : 'Отметьте', cls: 'bg-[#fff4e0] text-[#d97706]', bar: 'bg-[#f59e0b]' }
            const value = event.upcoming ? confirmed : present
            const percent = total ? Math.round((value / total) * 100) : 0
            return (
              <li key={classKey(event)}>
                <button
                  type="button"
                  onClick={() => onOpen(event)}
                  className="block w-full rounded-3xl bg-white p-4 text-left shadow-[var(--shadow-card)] transition active:scale-[0.99]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex w-14 shrink-0 flex-col items-center rounded-2xl bg-surface-muted py-2">
                      <span className="text-base leading-none font-bold text-text tabular-nums">{hhmm(event.startTime)}</span>
                      {event.endTime && <span className="mt-1 text-[10px] text-text-muted tabular-nums">до {hhmm(event.endTime)}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-[17px] font-bold text-text">{event.groupName}</p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${status.cls}`}>{status.text}</span>
                      </div>
                      <p className="flex items-center gap-1 truncate text-xs text-text-secondary">
                        <IconMapPin size={12} />
                        {event.location || 'Зал клуба'} · {eventRange(event)}
                      </p>
                      <p className="mt-2 text-xs text-text-secondary">
                        {event.upcoming ? (
                          <>
                            Родители: <span className="font-semibold text-brand-green">будут {confirmed}</span> ·{' '}
                            <span className="font-semibold text-error">нет {declined}</span> · ждём ответа {Math.max(total - confirmed - declined, 0)}
                          </>
                        ) : marked ? (
                          <>
                            Пришли <span className="font-semibold text-text">{present}</span> из {total}
                          </>
                        ) : (
                          <span className="font-semibold text-[#d97706]">Отметьте, кто пришёл</span>
                        )}
                      </p>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-subtle">
                        <div className={`bar-grow h-full rounded-full ${status.bar}`} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                    <IconChevronRight size={18} className="mt-3 shrink-0 text-text-muted" />
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
