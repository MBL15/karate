export const RESULTS_KEY = 'competition-results'

/** 1–3 — призовое место, 0 — участвовал без призового места. */
export type ResultPlace = 0 | 1 | 2 | 3

export type CompetitionResult = { place: ResultPlace; category: string; updatedAt: string }

/** registrationId → результат */
export type CompetitionResults = Record<number, CompetitionResult>

export type ChildCompetitionResult = {
  competitionId: number
  competitionName: string
  eventDate: string
  place: ResultPlace
  category: string
}

export const PLACE_UI: Record<ResultPlace, { label: string; short: string; className: string; medal: string }> = {
  1: { label: '1 место', short: '1', className: 'bg-[#fff4d6] text-[#b7791f]', medal: '#e3b341' },
  2: { label: '2 место', short: '2', className: 'bg-[#eef1f5] text-[#5b6472]', medal: '#b8c0cc' },
  3: { label: '3 место', short: '3', className: 'bg-[#fbeee4] text-[#a0522d]', medal: '#cd7f32' },
  0: { label: 'Участие', short: '—', className: 'bg-surface-muted text-text-secondary', medal: '#d0d5dd' },
}

export const PLACES: ResultPlace[] = [1, 2, 3, 0]
