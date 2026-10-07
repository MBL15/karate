import { Link } from 'react-router-dom'
import { Dialog } from '../a11y/Dialog'
import { IconArrowRight, IconAward, IconX } from '../ui/Icons'
import { CoachBeltSettingsPanel } from './CoachBeltSettingsPanel'

export function CoachBeltSettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} titleId="coach-belt-settings-title" onClose={onClose}>
      <div className="max-h-[min(85vh,720px)] overflow-y-auto rounded-[1.75rem] bg-white p-5 shadow-[var(--shadow-elevated)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#f8e7b0] text-[#a16207]">
              <IconAward size={22} />
            </span>
            <div>
              <h2 id="coach-belt-settings-title" className="text-xl font-bold tracking-tight text-text">
                Правила поясов
              </h2>
              <p className="mt-0.5 text-sm text-text-secondary">Как считается прогресс и выдаётся уровень</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-secondary transition hover:bg-surface-subtle"
          >
            <IconX size={18} />
          </button>
        </div>

        <div className="mt-5">
          <CoachBeltSettingsPanel compact />
        </div>

        <Link
          to="/coach/awards"
          onClick={onClose}
          className="mt-6 flex items-center justify-between gap-2 rounded-2xl bg-surface-muted px-4 py-3 text-sm font-semibold text-text transition hover:bg-surface-subtle"
        >
          Значки и ручное назначение пояса
          <IconArrowRight size={16} className="text-text-muted" />
        </Link>
      </div>
    </Dialog>
  )
}
