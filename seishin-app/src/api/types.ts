export type UserRole = 'COACH' | 'PARENT'

export type AuthResponse = {
  token: string
  userId: number
  name: string
  phone: string
  role: UserRole
  clubId: number
}

export type StudentSummary = {
  id: number
  firstName: string
  lastName: string
  birthDate: string
  age: number
  beltName: string
  beltColor: string
  progressPercent: number
  guest: boolean
}

export type ClassEvent = {
  scheduleId: number
  groupId: number
  groupName: string
  date: string
  weekday: number
  startTime: string
  endTime?: string | null
  location?: string | null
  studentCount: number
  today: boolean
  upcoming: boolean
}

export type ScheduleSlot = {
  id: number
  groupId: number
  groupName: string
  weekday: number
  weekdayLabel: string
  startTime: string
  endTime?: string | null
  location?: string | null
  studentCount: number
}

export type TrainingReminder = {
  studentId: number
  studentName: string
  parentName?: string | null
  parentPhone?: string | null
  groupName: string
  date: string
  time: string
  message: string
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'MAKEUP' | 'GUEST'

export type SessionAttendance = {
  sessionId?: number | null
  groupId: number
  sessionDate: string
  startTime: string
  entries: { studentId: number; studentName: string; status: AttendanceStatus }[]
}

export type CoachDashboard = {
  totalStudents: number
  totalGroups: number
  upcomingBirthdays: number
  pendingPayments: number
  pendingCompetitionRsvps: number
  birthdayStudents: StudentSummary[]
  groups: { id: number; name: string; studentCount: number; assistantAccess: boolean }[]
  nextClass?: ClassEvent | null
}

export type Payment = {
  id: number
  studentId: number
  studentName: string
  periodLabel: string
  description: string
  amount: number
  status: 'PAID' | 'OVERDUE' | 'PENDING'
  dueDate: string
  paidDate?: string | null
}

export type ParentChildHome = {
  studentId: number
  fullName: string
  age: number
  beltName: string
  progressPercent: number
  upcomingCompetitions: UpcomingCompetition[]
  recentPayments: PaymentSummary[]
}

export type ParentChildProfile = {
  studentId: number
  firstName: string
  lastName: string
  birthDate: string
  age: number
  beltName: string
  beltColor: string
  progressPercent: number
  coachRecommendation: string | null
  clubName: string
}

export type Achievement = {
  badgeId: number
  name: string
  description: string
  earnedCount: number
  requiredCount: number
  completed: boolean
  lastIssuedAt: string | null
}

export type HistoryEntry = {
  date: string
  groupName: string
  status: 'PRESENT' | 'ABSENT' | 'MAKEUP' | 'GUEST'
}

export type PaymentSummary = {
  id: number
  periodLabel: string
  description: string
  amount: number
  status: 'PAID' | 'OVERDUE' | 'PENDING'
  dueDate: string
}

export type UpcomingCompetition = {
  competitionId: number
  name: string
  eventDate: string
  rsvpStatus: 'PENDING' | 'CONFIRMED' | 'DECLINED'
}

export type Document = {
  id: number
  title: string
  type: 'TEXT' | 'PDF'
  content: string
}

export type Registration = {
  id: number
  studentId: number
  studentName: string
  age: number
  weightKg: number | null
  discipline: 'KATA' | 'KUMITE' | 'TEAM' | null
  rsvpStatus: 'PENDING' | 'CONFIRMED' | 'DECLINED'
  autoCategory: string | null
  effectiveCategory: string | null
}

export type BeltLevel = {
  id: number
  name: string
  color: string
  sortOrder: number
}

export type GroupSummary = {
  id: number
  name: string
  studentCount: number
  assistantAccess: boolean
}

export type BadgeDefinition = {
  id: number
  name: string
  description: string
  cumulative: boolean
  requiredCount: number
}

export type Competition = {
  id: number
  name: string
  eventDate: string
  location: string
  description: string
  registrations: Registration[]
}

export type ChatThreadKind = 'STUDENT' | 'GROUP'

export type ChatMessage = {
  id: number
  studentId?: number | null
  groupId?: number | null
  senderId: number
  senderName: string
  senderRole: UserRole
  body: string
  sentAt: string
  mine: boolean
}

export type ChatThread = {
  kind: ChatThreadKind
  studentId?: number | null
  groupId?: number | null
  title: string
  subtitle: string
  memberCount?: number | null
  lastMessage: string | null
  lastMessageAt: string | null
  lastSenderRole: UserRole | null
}

export type ChatSelection =
  | { kind: 'STUDENT'; studentId: number }
  | { kind: 'GROUP'; groupId: number }
