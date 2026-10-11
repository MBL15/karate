import type { UpcomingCompetition } from '../../api/types'

export const PARENT_CARD = 'rounded-2xl border border-border-light bg-white p-4 shadow-[var(--shadow-card)]'

export const PARENT_PAGE =
  'mx-auto w-full max-w-lg px-5 pb-8 pt-[max(1.25rem,var(--safe-top-effective))] lg:max-w-3xl lg:px-8 lg:pt-8'

export const RSVP_CHIP: Record<UpcomingCompetition['rsvpStatus'], { label: string; className: string }> = {
  PENDING: { label: 'Нужен ответ', className: 'bg-warning-bg text-warning' },
  CONFIRMED: { label: 'Участвуем', className: 'bg-brand-green-light text-brand-green' },
  DECLINED: { label: 'Не участвуем', className: 'bg-surface-muted text-text-secondary' },
}
