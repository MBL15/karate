import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { coachApi } from '../../api/coach'
import type { GroupSummary, StudentSummary } from '../../api/types'
import { ApiError } from '../../api/client'
import { CoachPageShell } from '../../components/coach/CoachPageShell'
import { CoachError, CoachLoading } from '../../components/coach/CoachScreenState'
import { EmptyState } from '../../components/ui/EmptyState'
import { parentTrainingIntentLabel } from '../../utils/format'

const imgStudent = '/assets/coach/avatar-student.svg'

export function CoachStudentsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [studentsByGroup, setStudentsByGroup] = useState<Record<number, StudentSummary[]>>({})
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [showStudentForm, setShowStudentForm] = useState<number | null>(null)
  const [groupName, setGroupName] = useState('')
  const [studentForm, setStudentForm] = useState({
    firstName: '',
    lastName: '',
    birthDate: '2015-01-01',
  })

  const loadGroups = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await coachApi.groups()
      setGroups(list)
      if (list.length > 0 && expandedGroupId === null) {
        setExpandedGroupId(list[0].id)
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [expandedGroupId])

  const loadGroupStudents = useCallback(async (groupId: number) => {
    const students = await coachApi.groupStudents(groupId)
    setStudentsByGroup((prev) => ({ ...prev, [groupId]: students }))
  }, [])

  useEffect(() => {
    void loadGroups()
  }, [loadGroups])

  useEffect(() => {
    if (expandedGroupId != null) {
      void loadGroupStudents(expandedGroupId)
    }
  }, [expandedGroupId, loadGroupStudents])

  useEffect(() => {
    if (loading) return
    const add = searchParams.get('add')
    if (!add) return

    if (add === 'group') {
      setShowGroupForm(true)
    } else if (add === 'student') {
      if (groups.length > 0) {
        const groupId = expandedGroupId ?? groups[0].id
        setExpandedGroupId(groupId)
        setShowStudentForm(groupId)
      } else {
        setShowGroupForm(true)
      }
    }

    setSearchParams({}, { replace: true })
  }, [loading, searchParams, groups, expandedGroupId, setSearchParams])

  const createGroup = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const g = await coachApi.createGroup(groupName.trim())
      setMessage(`Группа «${g.name}» создана`)
      setGroupName('')
      setShowGroupForm(false)
      await loadGroups()
      setExpandedGroupId(g.id)
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Ошибка')
    }
  }

  const createStudent = async (e: FormEvent, groupId: number) => {
    e.preventDefault()
    try {
      await coachApi.createStudent({ ...studentForm, groupId, guest: false })
      setMessage('Ученик добавлен')
      setStudentForm({ firstName: '', lastName: '', birthDate: '2015-01-01' })
      setShowStudentForm(null)
      await loadGroupStudents(groupId)
      await loadGroups()
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Ошибка')
    }
  }

  const totalStudents = groups.reduce((sum, g) => sum + g.studentCount, 0)

  return (
    <CoachPageShell
      title="Ученики"
      subtitle={`${groups.length} групп · ${totalStudents} учеников · отметка на тренировку от родителей`}
      headerActions={
        <button type="button" onClick={() => setShowGroupForm(true)} className="btn-coach">
          + Новая группа
        </button>
      }
    >
      {loading ? (
        <CoachLoading />
      ) : error ? (
        <CoachError message={error} />
      ) : (
        <>
          {message && <p className="alert-success">{message}</p>}

          {showGroupForm && (
            <form onSubmit={createGroup} className="card max-w-md p-6">
              <p className="font-semibold text-text">Новая группа</p>
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Название группы"
                className="input-coach mt-4"
                required
              />
              <div className="mt-4 flex gap-2">
                <button type="submit" className="btn-coach">Создать</button>
                <button type="button" onClick={() => setShowGroupForm(false)} className="btn-secondary">Отмена</button>
              </div>
            </form>
          )}

          {groups.length === 0 ? (
            <EmptyState
              icon="👥"
              title="Групп пока нет"
              description="Создайте первую группу, чтобы добавлять учеников"
              action={
                <button type="button" onClick={() => setShowGroupForm(true)} className="btn-coach">
                  Создать группу
                </button>
              }
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {groups.map((group) => {
                const open = expandedGroupId === group.id
                const students = studentsByGroup[group.id] ?? []
                return (
                  <section key={group.id} className="card overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedGroupId(open ? null : group.id)}
                      className="flex w-full items-center justify-between px-6 py-5 text-left transition hover:bg-surface-muted"
                    >
                      <div>
                        <p className="text-lg font-bold text-text">{group.name}</p>
                        <p className="mt-0.5 text-sm text-text-secondary">{group.studentCount} учеников</p>
                      </div>
                      <span className={`flex size-8 items-center justify-center rounded-full bg-brand-blue-light text-brand-blue transition ${open ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>

                    {open && (
                      <div className="border-t border-border-light px-6 pb-6">
                        <div className="mt-4 space-y-2">
                          {students.length === 0 ? (
                            <p className="py-4 text-center text-sm text-text-secondary">В группе пока никого нет</p>
                          ) : (
                            students.map((s) => {
                              const intentUi = parentTrainingIntentLabel(s.nextTrainingIntent)
                              return (
                              <div key={s.id} className="flex items-center gap-3 rounded-xl bg-surface-muted p-3">
                                <img src={imgStudent} alt="" className="size-10 rounded-full bg-surface p-1" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-text">
                                    {s.firstName} {s.lastName}
                                  </p>
                                  <p className="text-xs text-text-secondary">
                                    {s.age} лет · {s.beltName}
                                    {s.progressPercent != null ? ` · ${Math.round(s.progressPercent)}%` : ''}
                                  </p>
                                </div>
                                {s.nextTrainingIntent ? (
                                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${intentUi.className}`}>
                                    {intentUi.label}
                                  </span>
                                ) : null}
                              </div>
                            )})
                          )}
                        </div>

                        {showStudentForm === group.id ? (
                          <form onSubmit={(e) => createStudent(e, group.id)} className="mt-4 space-y-3 rounded-xl border border-border p-4">
                            <input
                              value={studentForm.firstName}
                              onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                              placeholder="Имя"
                              className="input-coach"
                              required
                            />
                            <input
                              value={studentForm.lastName}
                              onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                              placeholder="Фамилия"
                              className="input-coach"
                              required
                            />
                            <input
                              type="date"
                              value={studentForm.birthDate}
                              onChange={(e) => setStudentForm({ ...studentForm, birthDate: e.target.value })}
                              className="input-coach"
                              required
                            />
                            <div className="flex gap-2">
                              <button type="submit" className="btn-coach">Добавить</button>
                              <button type="button" onClick={() => setShowStudentForm(null)} className="btn-secondary">Отмена</button>
                            </div>
                          </form>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowStudentForm(group.id)}
                            className="mt-4 text-sm font-semibold text-brand-blue hover:underline"
                          >
                            + Добавить ученика
                          </button>
                        )}
                      </div>
                    )}
                  </section>
                )
              })}
            </div>
          )}
        </>
      )}
    </CoachPageShell>
  )
}
