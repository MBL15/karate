import type { HistoryEntry } from '../../api/types'
import { attendanceDayClass, attendanceStatusLabel, formatDate } from '../../utils/format'

export function AttendanceDay({ entry }: { entry: HistoryEntry }) {
  const date = new Date(`${entry.date}T12:00:00`)
  const month = date.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '')
  return (
    <div
      title={`${formatDate(entry.date)} · ${entry.groupName}: ${attendanceStatusLabel(entry.status)}`}
      className={`flex size-11 flex-col items-center justify-center rounded-xl leading-none ${attendanceDayClass(entry.status)}`}
    >
      <span className="text-sm font-bold">{date.getDate()}</span>
      <span className="mt-0.5 text-[9px] font-semibold opacity-75">{month}</span>
    </div>
  )
}

export function AttendanceLegend() {
  return (
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-secondary">
      {[
        ['bg-[#20a464]', 'посещение'],
        ['bg-[#d94b55]', 'пропуск'],
        ['bg-[#3b5bdb]', 'отработка'],
        ['bg-[#d7a62a]', 'гость'],
      ].map(([dot, label]) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <span className={`size-2 rounded-full ${dot}`} />
          {label}
        </span>
      ))}
    </div>
  )
}
