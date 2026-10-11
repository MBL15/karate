import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { coachApi } from '../../../api/coach'
import { ApiError } from '../../../api/client'
import type { GroupSummary, StudentSummary } from '../../../api/types'
import { useStoredState } from '../../../hooks/useStoredState'
import { useStudentBelts } from '../../../hooks/useStudentBelts'
import { applyGroupEdits, EMPTY_GROUP_EDITS, GROUP_EDITS_KEY, type GroupEdits } from '../../../utils/groupEdits'
import { IconChevronDown, IconPlus, IconSearch, IconX } from '../../ui/Icons'
import { SectionTitle } from './ToolShell'

function Initials({ student, size = 28 }: { student: StudentSummary; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full border-2 border-white bg-brand-blue-light text-[10px] font-bold text-brand-blue"
      style={{ width: size, height: size }}
    >
      {student.firstName[0]}
      {student.lastName[0]}
    </span>
  )
}

export function GroupsManager() {
  const [rawGroups, setRawGroups] = useState<GroupSummary[]>([])
  const [rawMembers, setRawMembers] = useState<Record<number, StudentSummary[]>>({})
  const [allStudents, setAllStudents] = useState<StudentSummary[]>([])
  const [edits, setEdits] = useStoredState<GroupEdits>(GROUP_EDITS_KEY, EMPTY_GROUP_EDITS)
  const [openGroup, setOpenGroup] = useState<number | null>(null)
  const { info: beltInfo } = useStudentBelts()
  const [editing, setEditing] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let alive = true
    coachApi
      .groups()
      .then(async (list) => {
        const entries = await Promise.all(list.map(async (g) => [g.id, await coachApi.groupStudents(g.id)] as const))
        if (!alive) return
        setRawGroups(list)
        setRawMembers(Object.fromEntries(entries))
      })
      .catch(() => undefined)
    coachApi
      .students()
      .then((list) => alive && setAllStudents(list))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])

  const { groups, members, pool } = useMemo(
    () => applyGroupEdits(rawGroups, rawMembers, edits, allStudents),
    [rawGroups, rawMembers, edits, allStudents],
  )

  const groupOf = useMemo(() => {
    const map = new Map<number, GroupSummary>()
    for (const g of groups) for (const s of members[g.id]) map.set(s.id, g)
    return map
  }, [groups, members])

  const setMembers = (next: Record<number, number[]>) =>
    setEdits((e) => ({ ...e, members: { ...e.members, ...next } }))

  const removeFrom = (groupId: number, studentId: number) =>
    setMembers({ [groupId]: members[groupId].filter((s) => s.id !== studentId).map((s) => s.id) })

  const addTo = (groupId: number, studentId: number) => {
    const next: Record<number, number[]> = {}
    for (const g of groups) {
      if (g.id !== groupId && members[g.id].some((s) => s.id === studentId)) {
        next[g.id] = members[g.id].filter((s) => s.id !== studentId).map((s) => s.id)
      }
    }
    next[groupId] = [...members[groupId].map((s) => s.id), studentId]
    setMembers(next)
  }

  const deleteGroup = (groupId: number) => {
    setEdits((e) => {
      const rest = { ...e.members }
      delete rest[groupId]
      return { hidden: [...e.hidden, groupId], members: rest }
    })
    setConfirmDelete(null)
    setEditing(null)
    setOpenGroup(null)
  }

  const createGroup = async (e: FormEvent) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setSaving(true)
    setError(null)
    try {
      const group = await coachApi.createGroup(name)
      setRawGroups((list) => [...list, group])
      setRawMembers((m) => ({ ...m, [group.id]: [] }))
      setNewName('')
      setCreating(false)
      setOpenGroup(group.id)
      setEditing(group.id)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось создать группу')
    } finally {
      setSaving(false)
    }
  }

  const candidates = (groupId: number) => {
    const q = query.trim().toLowerCase()
    return [...pool.values()]
      .filter((s) => !members[groupId].some((m) => m.id === s.id))
      .filter((s) => !q || `${s.firstName} ${s.lastName}`.toLowerCase().includes(q))
      .sort((a, b) => Number(groupOf.has(a.id)) - Number(groupOf.has(b.id)) || a.lastName.localeCompare(b.lastName, 'ru'))
  }

  return (
    <>
      <SectionTitle
        action={
          !creating && (
            <button type="button" onClick={() => setCreating(true)} className="text-sm font-semibold text-brand-blue">
              + Группа
            </button>
          )
        }
      >
        Группы и ученики
      </SectionTitle>

      {creating && (
        <form onSubmit={(e) => void createGroup(e)} className="pop-in mb-3 rounded-2xl bg-brand-blue-light/60 p-3">
          <label className="block text-sm font-medium text-text">
            Название новой группы
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Например, Младшая 6–8 лет"
              className="input-coach mt-1.5 bg-white"
            />
          </label>
          {error && <p className="mt-2 text-sm text-error">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setCreating(false)
                setNewName('')
                setError(null)
              }}
              className="btn-secondary min-h-11 flex-1 rounded-2xl"
            >
              Отмена
            </button>
            <button type="submit" disabled={!newName.trim() || saving} className="btn-coach min-h-11 flex-1 rounded-2xl">
              {saving ? 'Создаём…' : 'Создать'}
            </button>
          </div>
        </form>
      )}

      {groups.length === 0 ? (
        <p className="text-sm text-text-secondary">Групп пока нет. Создайте первую — и добавьте в неё учеников.</p>
      ) : (
        <ul className="space-y-2">
          {groups.map((group) => {
            const open = openGroup === group.id
            const isEditing = editing === group.id
            const list = members[group.id]
            return (
              <li key={group.id} className={`overflow-hidden rounded-2xl border transition ${isEditing ? 'border-brand-blue' : 'border-border-light'}`}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenGroup(open ? null : group.id)
                    setEditing(null)
                    setConfirmDelete(null)
                    setQuery('')
                  }}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-muted"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-text">{group.name}</span>
                    <span className="text-xs text-text-secondary">
                      {group.studentCount} уч.{group.assistantAccess ? ' · вы ассистент' : ''}
                    </span>
                  </span>
                  <span className="flex -space-x-2">
                    {list.slice(0, 3).map((s) => (
                      <Initials key={s.id} student={s} />
                    ))}
                  </span>
                  <IconChevronDown size={18} className={`shrink-0 text-text-muted transition ${open ? 'rotate-180' : ''}`} />
                </button>

                {open && (
                  <div className="pop-in border-t border-border-light px-4 py-3">
                    {list.length === 0 ? (
                      <p className="text-sm text-text-secondary">В группе пока нет учеников.</p>
                    ) : (
                      <ul className="space-y-1">
                        {list.map((s) => (
                          <li key={s.id} className="flex min-h-9 items-center gap-2.5 text-sm">
                            <span
                              className="size-2.5 shrink-0 rounded-full border border-black/10"
                              style={{ backgroundColor: beltInfo(s, group.id).hex ?? 'transparent' }}
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1 truncate text-text">
                              {s.firstName} {s.lastName}
                            </span>
                            <span className="text-xs text-text-secondary">{s.age} л.</span>
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => removeFrom(group.id, s.id)}
                                aria-label={`Убрать ${s.firstName} ${s.lastName} из группы`}
                                className="pop-in flex size-8 items-center justify-center rounded-full bg-error-bg text-error transition active:scale-90"
                              >
                                <IconX size={14} />
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    {isEditing && (
                      <div className="pop-in mt-3 rounded-2xl bg-surface-muted p-3">
                        <p className="text-sm font-semibold text-text">Добавить в группу</p>
                        <span className="relative mt-2 block">
                          <IconSearch size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-text-muted" />
                          <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Поиск по имени"
                            className="input-coach bg-white pl-10"
                          />
                        </span>
                        <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto">
                          {candidates(group.id).map((s) => {
                            const from = groupOf.get(s.id)
                            return (
                              <li key={s.id}>
                                <button
                                  type="button"
                                  onClick={() => addTo(group.id, s.id)}
                                  className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-sm transition hover:bg-white active:scale-[0.99]"
                                >
                                  <Initials student={s} />
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-text">
                                      {s.firstName} {s.lastName}
                                    </span>
                                    <span className="block text-xs text-text-secondary">{from ? `Сейчас в «${from.name}»` : 'Без группы'}</span>
                                  </span>
                                  <span className="flex size-8 items-center justify-center rounded-full bg-brand-blue text-white">
                                    <IconPlus size={14} />
                                  </span>
                                </button>
                              </li>
                            )
                          })}
                          {candidates(group.id).length === 0 && (
                            <li className="px-2 py-2 text-sm text-text-secondary">{query ? 'Никого не нашли' : 'Все ученики уже в этой группе'}</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {confirmDelete === group.id ? (
                      <div className="pop-in mt-3 rounded-2xl bg-error-bg p-3">
                        <p className="text-sm font-semibold text-error">Удалить группу «{group.name}»?</p>
                        <p className="mt-0.5 text-xs text-text-secondary">Группа скроется только у вас: ученики останутся в клубе, а родители пока продолжат видеть её тренировки. Чтобы родители не ждали занятий, сначала уберите группу из расписания.</p>
                        <div className="mt-3 flex gap-2">
                          <button type="button" onClick={() => setConfirmDelete(null)} className="btn-secondary min-h-10 flex-1 rounded-xl bg-white">
                            Отмена
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteGroup(group.id)}
                            className="min-h-10 flex-1 rounded-xl bg-error font-semibold text-white transition active:scale-[0.98]"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(isEditing ? null : group.id)
                            setQuery('')
                          }}
                          className={`min-h-10 rounded-full px-4 text-sm font-semibold transition active:scale-95 ${
                            isEditing ? 'bg-brand-blue text-white' : 'bg-brand-blue-light text-brand-blue'
                          }`}
                        >
                          {isEditing ? 'Готово' : 'Изменить состав'}
                        </button>
                        {!group.assistantAccess && (
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(group.id)}
                            className="min-h-10 rounded-full px-3 text-sm font-semibold text-error transition hover:bg-error-bg"
                          >
                            Удалить группу
                          </button>
                        )}
                        {!isEditing && (
                          <Link to={`/coach/students?group=${group.id}`} className="ml-auto text-sm font-semibold text-brand-blue">
                            В базе →
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
