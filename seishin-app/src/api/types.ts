export type UserRole = 'COACH' | 'PARENT'

export type AuthResponse = {
  token: string
  userId: number
  name: string
  login: string
  phone: string | null
  role: UserRole
  clubId: number | null
}

export type BeltAssignmentMode = 'MANUAL' | 'ATTENDANCE' | 'READINESS'

export type BeltProgressMeta = {
  beltAssignmentMode: BeltAssignmentMode
  progressLabel: string
  nextBeltName: string | null
  nextBeltColor: string | null
  sessionsCompleted: number | null
  sessionsRequired: number | null
  maxRank: boolean
}

export type StudentSummary = {
  id: number
  firstName: string
  lastName: string
  birthDate: string
  age: number
  beltName: string
  beltColor: string
  progressPercent: number | null
  guest: boolean
  nextTrainingDate: string | null
  nextTrainingStartTime: string | null
  nextTrainingGroupName: string | null
  nextTrainingIntent: 'PENDING' | 'CONFIRMED' | 'DECLINED' | null
} & BeltProgressMeta

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
  entries: {
    studentId: number
    studentName: string
    status: AttendanceStatus
    parentIntent?: 'PENDING' | 'CONFIRMED' | 'DECLINED' | null
  }[]
}

export type CoachNotificationKind = 'STUDENT_JOINED_GROUP'

export type CoachNotification = {
  id: number
  kind: CoachNotificationKind
  title: string
  body: string
  studentId: number | null
  groupId: number | null
  readAt: string | null
  createdAt: string
}

export type CoachDashboard = {
  clubName?: string
  joinCode?: string | null
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

export type NextTraining = {
  groupId: number
  scheduleId: number
  date: string
  startTime: string
  endTime: string | null
  groupName: string
  location: string | null
  intentStatus: 'PENDING' | 'CONFIRMED' | 'DECLINED'
  topicTitle?: string | null
  topicText?: string | null
}

export type ParentChildHome = {
  studentId: number
  fullName: string
  age: number
  beltName: string
  beltColor: string
  progressPercent: number | null
  upcomingCompetitions: UpcomingCompetition[]
  recentPayments: PaymentSummary[]
  nextTraining: NextTraining | null
} & BeltProgressMeta

export type ParentChildProfile = {
  studentId: number
  firstName: string
  lastName: string
  birthDate: string
  age: number
  beltName: string
  beltColor: string
  progressPercent: number | null
  coachRecommendation: string | null
  clubName: string
  clubDescription?: string | null
  clubAddress?: string | null
  clubLogo?: string | null
} & BeltProgressMeta

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

export type CompetitionResult = {
  competitionId: number
  competitionName: string
  eventDate: string
  place: number
  category: string | null
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
  resultPlace?: number | null
  resultCategory?: string | null
}

export type BeltLevel = {
  id: number
  name: string
  color: string
  sortOrder: number
  sessionsRequired: number | null
}

export type BeltSettings = {
  assignmentMode: BeltAssignmentMode
  sessionsRequired: number
  autoPromote: boolean
}

export type GroupSummary = {
  id: number
  name: string
  studentCount: number
  assistantAccess: boolean
  hidden?: boolean
}

export type CoachClubProfile = {
  name: string
  description?: string | null
  address?: string | null
  logo?: string | null
  beltStateJson?: string | null
}

export type SessionPlan = {
  groupId: number
  sessionDate: string
  startTime: string
  topicTitle?: string | null
  topicText?: string | null
}

export type CoachIssuedBadge = {
  id: number
  studentId: number
  badgeId: number
  badgeName: string
  issuedAt: string
  note?: string | null
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
