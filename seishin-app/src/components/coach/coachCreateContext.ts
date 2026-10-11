import { useOutletContext } from 'react-router-dom'
import type { CreateView } from './CoachCreateSheet'

export type CoachOutletContext = { openCreate: (view?: CreateView) => void }

export function useCoachCreate() {
  return useOutletContext<CoachOutletContext>().openCreate
}
