import type { ChatSelection, ChatThread } from '../../api/types'

export function formatThreadTime(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function threadKey(thread: ChatThread) {
  return thread.kind === 'GROUP' ? `group-${thread.groupId}` : `student-${thread.studentId}`
}

export function selectionFromThread(thread: ChatThread): ChatSelection {
  if (thread.kind === 'GROUP' && thread.groupId) {
    return { kind: 'GROUP', groupId: thread.groupId }
  }
  return { kind: 'STUDENT', studentId: thread.studentId! }
}

export function selectionKey(selection: ChatSelection | null) {
  if (!selection) return null
  return selection.kind === 'GROUP' ? `group-${selection.groupId}` : `student-${selection.studentId}`
}

export function isSameSelection(a: ChatSelection | null, b: ChatSelection | null) {
  return selectionKey(a) === selectionKey(b)
}
