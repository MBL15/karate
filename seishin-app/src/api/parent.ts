import type {
  Achievement,
  ChatMessage,
  ChatThread,
  Document,
  HistoryEntry,
  NextTraining,
  ParentChildHome,
  ParentChildProfile,
  Payment,
  Registration,
  StudentSummary,
  UpcomingCompetition,
} from './types'
import { apiFetch } from './client'

export const parentApi = {
  children: () => apiFetch<StudentSummary[]>('/api/parent/children'),
  createChild: (payload: {
    firstName: string
    lastName: string
    birthDate: string
    inviteCode?: string
  }) =>
    apiFetch<StudentSummary>('/api/parent/children', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  home: (childId: number) => apiFetch<ParentChildHome>(`/api/parent/children/${childId}/home`),
  setTrainingIntent: (
    childId: number,
    payload: {
      groupId: number
      sessionDate: string
      startTime: string
      rsvpStatus: 'CONFIRMED' | 'DECLINED'
    },
  ) =>
    apiFetch<NextTraining>(`/api/parent/children/${childId}/training-intent`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  profile: (childId: number) => apiFetch<ParentChildProfile>(`/api/parent/children/${childId}/profile`),
  achievements: (childId: number) => apiFetch<Achievement[]>(`/api/parent/children/${childId}/achievements`),
  history: (childId: number) => apiFetch<HistoryEntry[]>(`/api/parent/children/${childId}/history`),
  payments: (childId: number) => apiFetch<Payment[]>(`/api/parent/children/${childId}/payments`),
  competitions: () => apiFetch<UpcomingCompetition[]>('/api/parent/competitions'),
  respondCompetition: (
    competitionId: number,
    payload: {
      studentId: number
      rsvpStatus: 'CONFIRMED' | 'DECLINED'
      weightKg?: number
      discipline?: 'KATA' | 'KUMITE'
    },
  ) =>
    apiFetch<Registration>(`/api/parent/competitions/${competitionId}/respond`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  documents: () => apiFetch<Document[]>('/api/parent/documents'),
  document: (id: number) => apiFetch<Document>(`/api/parent/documents/${id}`),
  chatThreads: (q?: string) => {
    const params = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''
    return apiFetch<ChatThread[]>(`/api/parent/chat/threads${params}`)
  },
  messages: (childId: number) => apiFetch<ChatMessage[]>(`/api/parent/children/${childId}/messages`),
  sendMessage: (childId: number, body: string) =>
    apiFetch<ChatMessage>(`/api/parent/children/${childId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
  groupMessages: (groupId: number) => apiFetch<ChatMessage[]>(`/api/parent/chat/groups/${groupId}/messages`),
  sendGroupMessage: (groupId: number, body: string) =>
    apiFetch<ChatMessage>(`/api/parent/chat/groups/${groupId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
}
