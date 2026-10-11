import { useAuth } from '../context/AuthContext'
import { useStoredState } from './useStoredState'

export type ParentProfileData = { firstName: string; lastName: string; phone: string; email: string }

/** Сервер пока не умеет менять данные родителя — правки хранятся на устройстве поверх данных из аккаунта. */
export function useParentProfile() {
  const { user } = useAuth()
  const [stored, setStored] = useStoredState<ParentProfileData | null>('parent-profile', null)
  const [first = '', ...rest] = (user?.name ?? '').trim().split(/\s+/)
  const base: ParentProfileData = { firstName: first, lastName: rest.join(' '), phone: user?.phone ?? '', email: '' }
  const profile = stored ?? base
  const fullName = `${profile.firstName} ${profile.lastName}`.trim() || 'Родитель'
  return { profile, fullName, save: (next: ParentProfileData) => setStored(next), edited: stored != null }
}
