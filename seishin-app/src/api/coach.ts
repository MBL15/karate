import type {
  AttendanceStatus,
  BadgeDefinition,
  BeltLevel,
  BeltSettings,
  ChatMessage,
  ChatThread,
  ClassEvent,
  CoachClubProfile,
  CoachDashboard,
  CoachIssuedBadge,
  CoachNotification,
  SessionPlan,
  Competition,
  GroupSummary,
  Registration,
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
  addStudentToGroup: (groupId: number, studentId: number) =>
    apiFetch<void>(`/api/coach/groups/${groupId}/students/${studentId}`, { method: 'POST' }),
  removeStudentFromGroup: (groupId: number, studentId: number) =>
    apiFetch<void>(`/api/coach/groups/${groupId}/students/${studentId}`, { method: 'DELETE' }),
  notifications: () => apiFetch<CoachNotification[]>('/api/coach/notifications'),
  notificationUnreadCount: () => apiFetch<{ count: number }>('/api/coach/notifications/unread-count'),
  markNotificationRead: (id: number) =>
    apiFetch<void>(`/api/coach/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => apiFetch<void>('/api/coach/notifications/read-all', { method: 'POST' }),
  removeStudent: (studentId: number) =>
    apiFetch<void>(`/api/coach/students/${studentId}`, { method: 'DELETE' }),
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
  beltSettings: () => apiFetch<BeltSettings>('/api/coach/belts/settings'),
  updateBeltSettings: (payload: BeltSettings) =>
    apiFetch<BeltSettings>('/api/coach/belts/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  updateBeltLevel: (beltLevelId: number, sessionsRequired: number | null) =>
    apiFetch<BeltLevel>(`/api/coach/belts/${beltLevelId}`, {
      method: 'PATCH',
      body: JSON.stringify({ sessionsRequired }),
    }),
  assignBelt: (
    studentId: number,
    belt: number | { beltLevelId?: number; name?: string; color?: string; sortOrder?: number },
  ) => {
    const body = typeof belt === 'number' ? { beltLevelId: belt } : belt.beltLevelId != null ? { beltLevelId: belt.beltLevelId } : belt
    return apiFetch<StudentSummary>(`/api/coach/students/${studentId}/belt`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  issuedBadges: () => apiFetch<CoachIssuedBadge[]>('/api/coach/badges/issued'),
  payments: () => apiFetch<Payment[]>('/api/payments'),
  updatePayment: (id: number, status: Payment['status'], paidDate?: string) =>
    apiFetch<Payment>(`/api/payments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, paidDate }),
    }),
  getAttendance: (groupId: number, sessionDate: string, startTime: string) =>
    apiFetch<SessionAttendance>(
      `/api/coach/sessions/attendance?groupId=${groupId}&sessionDate=${sessionDate}&startTime=${encodeURIComponent(startTime)}`,
    ),
  clubProfile: () => apiFetch<CoachClubProfile>('/api/coach/club/profile'),
  clubProfileUpdate: (payload: Partial<CoachClubProfile>) =>
    apiFetch<CoachClubProfile>('/api/coach/club/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  sessionPlan: (groupId: number, sessionDate: string, startTime: string) =>
    apiFetch<SessionPlan>(
      `/api/coach/sessions/plan?groupId=${groupId}&sessionDate=${sessionDate}&startTime=${encodeURIComponent(startTime)}`,
    ),
  saveSessionPlan: (payload: SessionPlan) =>
    apiFetch<SessionPlan>('/api/coach/sessions/plan', { method: 'PUT', body: JSON.stringify(payload) }),
  updateGroup: (groupId: number, hidden: boolean) =>
    apiFetch<GroupSummary>(`/api/coach/groups/${groupId}`, {
      method: 'PATCH',
      body: JSON.stringify({ hidden }),
    }),
  updateStudent: (studentId: number, payload: { coachRecommendation?: string | null }) =>
    apiFetch<StudentSummary>(`/api/coach/students/${studentId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  ensureMonthlyPayment: (studentId: number, month: string) =>
    apiFetch<Payment>('/api/payments/monthly', {
      method: 'POST',
      body: JSON.stringify({ studentId, month: `${month}-01` }),
    }),
  updateRegistrationResult: (registrationId: number, place: number, category?: string) =>
    apiFetch<Registration>(`/api/coach/competitions/registrations/${registrationId}/result`, {
      method: 'PATCH',
      body: JSON.stringify({ place, category }),
    }),
  clearRegistrationResult: (registrationId: number) =>
    apiFetch<Registration>(`/api/coach/competitions/registrations/${registrationId}/result`, {
      method: 'DELETE',
    }),
  markAttendance: (payload: {
    groupId: number
    sessionDate: string
    startTime: string
    entries: { studentId: number; status: AttendanceStatus; absenceReason?: string | null }[]
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
      expiresAt?: string | null
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
  deleteCompetition: (competitionId: number) =>
    apiFetch<void>(`/api/coach/competitions/${competitionId}`, { method: 'DELETE' }),

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
