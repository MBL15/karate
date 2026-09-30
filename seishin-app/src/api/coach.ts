import type {
  AttendanceStatus,
  BadgeDefinition,
  BeltLevel,
  ChatMessage,
  ChatThread,
  ClassEvent,
  CoachDashboard,
  Competition,
  GroupSummary,
  Payment,
  ScheduleSlot,
  SessionAttendance,
  StudentSummary,
  TrainingReminder,
} from './types'
import { apiFetch, getApiBase, getStoredToken } from './client'

export const coachApi = {
  dashboard: () => apiFetch<CoachDashboard>('/api/coach/dashboard'),
  students: () => apiFetch<StudentSummary[]>('/api/coach/students'),
  groups: () => apiFetch<GroupSummary[]>('/api/coach/groups'),
  groupStudents: (groupId: number) =>
    apiFetch<StudentSummary[]>(`/api/coach/groups/${groupId}/students`),
  createGroup: (name: string) =>
    apiFetch<GroupSummary>('/api/coach/groups', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  createStudent: (payload: {
    firstName: string
    lastName: string
    birthDate: string
    groupId?: number
    beltLevelId?: number
    guest?: boolean
  }) =>
    apiFetch<StudentSummary>('/api/coach/students', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  badges: () => apiFetch<BadgeDefinition[]>('/api/coach/badges'),
  belts: () => apiFetch<BeltLevel[]>('/api/coach/belts'),
  assignBelt: (studentId: number, beltLevelId: number) =>
    apiFetch<StudentSummary>(`/api/coach/students/${studentId}/belt`, {
      method: 'POST',
      body: JSON.stringify({ beltLevelId }),
    }),
  payments: () => apiFetch<Payment[]>('/api/payments'),
  getAttendance: (groupId: number, sessionDate: string, startTime: string) =>
    apiFetch<SessionAttendance>(
      `/api/coach/sessions/attendance?groupId=${groupId}&sessionDate=${sessionDate}&startTime=${encodeURIComponent(startTime)}`,
    ),
  markAttendance: (payload: {
    groupId: number
    sessionDate: string
    startTime: string
    entries: { studentId: number; status: AttendanceStatus }[]
  }) =>
    apiFetch<void>('/api/coach/sessions/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  issueBadge: (studentId: number, badgeId: number, note?: string) =>
    apiFetch<void>('/api/coach/badges/issue', {
      method: 'POST',
      body: JSON.stringify({ studentId, badgeId, note }),
    }),
  createInviteCode: (studentId?: number) =>
    apiFetch<{
      code: string
      clubName: string
      studentId?: number | null
      studentName?: string | null
      expiresAt: string
      kind: 'CLUB' | 'STUDENT'
    }>('/api/coach/invite-codes', {
      method: 'POST',
      body: JSON.stringify(studentId != null ? { studentId } : {}),
    }),
  sendPaymentReminders: () =>
    apiFetch<{ paymentId: number; studentName: string; message: string }[]>('/api/payments/reminders', {
      method: 'POST',
    }),
  competitions: () => apiFetch<Competition[]>('/api/coach/competitions'),
  createCompetition: (payload: {
    name: string
    eventDate: string
    location?: string
    description?: string
  }) =>
    apiFetch<Competition>('/api/coach/competitions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  exportCompetition: async (competitionId: number) => {
    const token = getStoredToken()
    const res = await fetch(`${getApiBase()}/api/coach/competitions/${competitionId}/export.xlsx`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) throw new Error('Не удалось скачать файл')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `karate-hub-competition-${competitionId}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  },

  schedule: () => apiFetch<ScheduleSlot[]>('/api/coach/schedule'),
  createSchedule: (payload: {
    groupId: number
    weekday: number
    startTime: string
    endTime?: string
    location?: string
  }) =>
    apiFetch<ScheduleSlot>('/api/coach/schedule', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteSchedule: (id: number) =>
    apiFetch<void>(`/api/coach/schedule/${id}`, { method: 'DELETE' }),
  classes: (from: string, to: string) =>
    apiFetch<ClassEvent[]>(`/api/coach/classes?from=${from}&to=${to}`),
  sendTrainingReminders: (payload: { date: string; scheduleId?: number }) =>
    apiFetch<TrainingReminder[]>('/api/coach/classes/reminders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  chatThreads: (q?: string) => {
    const params = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''
    return apiFetch<ChatThread[]>(`/api/coach/chat/threads${params}`)
  },
  createChatGroup: (payload: { name: string; trainingGroupId?: number; parentIds?: number[] }) =>
    apiFetch<ChatThread>('/api/coach/chat/groups', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  messages: (studentId: number) => apiFetch<ChatMessage[]>(`/api/coach/students/${studentId}/messages`),
  sendMessage: (studentId: number, body: string) =>
    apiFetch<ChatMessage>(`/api/coach/students/${studentId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
  groupMessages: (groupId: number) => apiFetch<ChatMessage[]>(`/api/coach/chat/groups/${groupId}/messages`),
  sendGroupMessage: (groupId: number, body: string) =>
    apiFetch<ChatMessage>(`/api/coach/chat/groups/${groupId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
}
