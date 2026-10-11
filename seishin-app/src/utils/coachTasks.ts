export type TaskAction =
  | 'competition'
  | 'attestation'
  | 'award'
  | 'attendance'
  | 'reminder'
  | 'notice'
  | 'invite'
  | 'custom'

export type CoachTask = {
  id: string
  action: TaskAction
  title: string
  due: string
  time?: string
  note?: string
  done: boolean
  createdAt: number
}

export type TaskStatus = 'overdue' | 'today' | 'upcoming' | 'done'

export const TASKS_KEY = 'coach-tasks'

export const taskActions: Record<TaskAction, { label: string; short: string; hint: string; to?: string; tone: string }> = {
  competition: {
    short: 'Турнир',
    label: 'Создать заявку на соревнования',
    hint: 'Турнир и список участников',
    to: '/coach/competitions?add=competition',
    tone: 'bg-brand-blue-light text-brand-blue',
  },
  attestation: {
    short: 'Аттестация',
    label: 'Провести аттестацию',
    hint: 'Создать событие аттестации',
    to: '/coach/competitions?add=competition&kind=attestation',
    tone: 'bg-[#f3e8ff] text-[#7c3aed]',
  },
  award: {
    short: 'Награда',
    label: 'Выдать достижение',
    hint: 'Пояс — в карточке ученика, значки — после тренировки',
    to: '/coach/students',
    tone: 'bg-[#fff4e5] text-[#d97706]',
  },
  attendance: {
    short: 'Посещаемость',
    label: 'Отметить посещаемость',
    hint: 'Журнал занятия',
    to: '/coach/attendance',
    tone: 'bg-brand-green-light text-brand-green',
  },
  reminder: {
    short: 'Тренировка',
    label: 'Напомнить о тренировке',
    hint: 'Родителям группы',
    to: '/coach/schedule',
    tone: 'bg-brand-blue-light text-brand-blue',
  },
  notice: {
    short: 'Уведомление',
    label: 'Отправить уведомление',
    hint: 'Сообщение родителям',
    to: '/coach?create=notice',
    tone: 'bg-[#fff4e5] text-[#d97706]',
  },
  invite: {
    short: 'Ученик',
    label: 'Пригласить ученика',
    hint: 'Код клуба и QR-код',
    to: '/coach/students',
    tone: 'bg-brand-green-light text-brand-green',
  },
  custom: {
    short: 'Задача',
    label: 'Своя задача',
    hint: 'Любое напоминание',
    tone: 'bg-surface-muted text-text-secondary',
  },
}

export function todayIso() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function taskStatus(task: CoachTask, today = todayIso()): TaskStatus {
  if (task.done) return 'done'
  if (task.due < today) return 'overdue'
  if (task.due === today) return 'today'
  return 'upcoming'
}

export function pendingTaskCount(tasks: CoachTask[]) {
  const today = todayIso()
  return tasks.filter((task) => {
    const status = taskStatus(task, today)
    return status === 'overdue' || status === 'today'
  }).length
}
