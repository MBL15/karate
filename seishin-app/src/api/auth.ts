import type { AuthResponse, UserRole } from './types'
import { apiFetch } from './client'

export type LinkedChild = {
  message: string
  studentId: number
  studentName: string
  age?: number
  clubName?: string
  groupName?: string
}

export type InviteLookup = {
  kind: 'CLUB' | 'STUDENT'
  clubName: string
  studentName?: string
}

export const authApi = {
  register: (payload: {
    firstName: string
    lastName?: string
    login: string
    password: string
    role: UserRole
    clubName?: string
  }) =>
    apiFetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (login: string, password: string, role: UserRole) =>
    apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password, role }),
    }),

  completeProfile: (payload: {
    email?: string
    birthDate?: string
    experienceYears?: number
    karateStyle?: string
  }) =>
    apiFetch<void>('/api/auth/profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  lookupInvite: (code: string) =>
    apiFetch<InviteLookup>('/api/auth/invite/lookup', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  linkChild: (code: string) =>
    apiFetch<LinkedChild>('/api/auth/invite/link', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
}
