import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { coachApi } from '../../api/coach'
import type { GroupSummary, StudentSummary } from '../../api/types'
import { ApiError } from '../../api/client'
import { CoachError, CoachLoading } from '../../components/coach/CoachScreenState'
import { IconPlus, IconSearch } from '../../components/ui/Icons'

type StudentRow = StudentSummary & { groupId: number; groupName: string }

const avatarTones = [
  'bg-[#f8e7b0] text-[#a16207]',
  'bg-[#dbe7fb] text-[#1d4e89]',
  'bg-[#eadcfd] text-[#6d28d9]',
  'bg-[#d9f3e4] text-[#1f7a4d]',
]

function yearsLabel(age: number) {
  const n10 = age % 10
  const n100 = age % 100
  if (n10 === 1 && n100 !== 11) return `${age} год`
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return `${age} года`
  return `${age} лет`
}

function chipLabel(name: string) {
  return name.replace(/\s+группа$/i, '')
}

export function CoachStudentsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [rows, setRows] = useState<StudentRow[]>([])
  const [filterGroupId, setFilterGroupId] = useState<number | 'all'>('all')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [showStudentForm, setShowStudentForm] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [studentGroupId, setStudentGroupId] = useState<number | null>(null)
  const [studentForm, setStudentForm] = useState({
    firstName: '',
    lastName: '',
    birthDate: '2015-01-01',
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await coachApi.groups()
      setGroups(list)
      const nested = await Promise.all(
        list.map(async (group) => {
          const students = await coachApi.groupStudents(group.id)
          return students.map((student) => ({
            ...student,
            groupId: group.id,
            groupName: group.name,
          }))
        }),
      )
      setRows(nested.flat())
      setStudentGroupId((current) => current ?? list[0]?.id ?? null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (loading) return
    const add = searchParams.get('add')
    const group = searchParams.get('group')
    if (!add && !group) return

    if (group) {
      const id = Number(group)
      if (groups.some((item) => item.id === id)) {
        setFilterGroupId(id)
        setStudentGroupId(id)
      }
    }
    if (add === 'group' || (add === 'student' && groups.length === 0)) {
      setShowGroupForm(true)
    } else if (add === 'student') {
      setShowStudentForm(true)
    }
    setSearchParams({}, { replace: true })
  }, [loading, searchParams, groups, setSearchParams])

  const totalStudents = useMemo(() => new Set(rows.map((row) => row.id)).size, [rows])

  const visible = rows.filter((row) => {
    if (filterGroupId !== 'all' && row.groupId !== filterGroupId) return false
    const q = query.trim().toLowerCase()
    if (!q) return true
    return `${row.lastName} ${row.firstName}`.toLowerCase().includes(q)
  })

  const createGroup = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const g = await coachApi.createGroup(groupName.trim())
      setMessage(`Группа «${g.name}» создана`)
      setGroupName('')
      setShowGroupForm(false)
      setFilterGroupId(g.id)
      setStudentGroupId(g.id)
      await load()
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Ошибка')
    }
  }

  const createStudent = async (e: FormEvent) => {
    e.preventDefault()
    if (studentGroupId == null) return
    try {
      await coachApi.createStudent({ ...studentForm, groupId: studentGroupId, guest: false })
      setMessage('Ученик добавлен')
      setStudentForm({ firstName: '', lastName: '', birthDate: '2015-01-01' })
      setShowStudentForm(false)
      await load()
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Ошибка')
    }
  }

  const openAdd = () => {
    if (groups.length === 0) {
      setShowGroupForm(true)
      return
    }
    if (filterGroupId !== 'all') setStudentGroupId(filterGroupId)
    setShowStudentForm(true)
  }

  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-8 pt-[max(1.5rem,var(--safe-top-effective))] lg:max-w-3xl lg:px-8 lg:pt-8">
      <h1 className="font-display text-[1.65rem] font-semibold leading-tight tracking-tight text-text">
        База учеников ({totalStudents})
      </h1>

      <label className="mt-4 flex items-center gap-2 rounded-2xl border border-white/80 bg-white px-3 shadow-[var(--shadow-card)]">
        <IconSearch size={18} className="shrink-0 text-text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск ученика..."
          aria-label="Поиск ученика"
          className="min-h-11 w-full bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
        />
      </label>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="tablist" aria-label="Группы">
        <button
          type="button"
          role="tab"
          aria-selected={filterGroupId === 'all'}
          onClick={() => setFilterGroupId('all')}
          className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold ${
            filterGroupId === 'all' ? 'bg-[#f5c518] text-navy-950' : 'bg-white text-text-secondary shadow-[var(--shadow-card)]'
          }`}
        >
          Все
        </button>
        {groups.map((group) => {
          const active = filterGroupId === group.id
          return (
            <button
              key={group.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilterGroupId(group.id)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold ${
                active ? 'bg-[#f5c518] text-navy-950' : 'bg-white text-text-secondary shadow-[var(--shadow-card)]'
              }`}
            >
              {chipLabel(group.name)}
            </button>
          )
        })}
      </div>

      {message && <p className="alert-success mt-4">{message}</p>}

      {showGroupForm && (
        <form onSubmit={createGroup} className="mt-4 rounded-[1.25rem] bg-white p-4 shadow-[var(--shadow-card)]">
          <p className="font-semibold text-text">Новая группа</p>
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Название группы"
            className="input-coach mt-3"
            required
          />
          <div className="mt-3 flex gap-2">
            <button type="submit" className="btn-coach">Создать</button>
            <button type="button" onClick={() => setShowGroupForm(false)} className="btn-secondary">Отмена</button>
          </div>
        </form>
      )}

      {showStudentForm && studentGroupId != null && (
        <form onSubmit={createStudent} className="mt-4 space-y-3 rounded-[1.25rem] bg-white p-4 shadow-[var(--shadow-card)]">
          <p className="font-semibold text-text">Новый ученик</p>
          {groups.length > 1 && (
            <select
              value={studentGroupId}
              onChange={(e) => setStudentGroupId(Number(e.target.value))}
              className="input-coach"
              aria-label="Группа"
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          )}
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
            <button type="button" onClick={() => setShowStudentForm(false)} className="btn-secondary">Отмена</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="mt-6">
          <CoachLoading />
        </div>
      ) : error ? (
        <div className="mt-6">
          <CoachError message={error} onRetry={() => void load()} />
        </div>
      ) : visible.length === 0 ? (
        <p className="mt-6 rounded-[1.25rem] bg-white px-4 py-8 text-center text-sm text-text-secondary shadow-[var(--shadow-card)]">
          {rows.length === 0 ? 'Учеников пока нет' : 'Никого не нашли'}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {visible.map((student, index) => {
            const percent = student.progressPercent
            return (
              <li
                key={`${student.groupId}-${student.id}`}
                className="flex items-center gap-3 rounded-[1.25rem] border border-white/80 bg-white px-3 py-3 shadow-[var(--shadow-card)]"
              >
                <span
                  className={`flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${avatarTones[index % avatarTones.length]}`}
                  aria-hidden
                >
                  {student.lastName.slice(0, 1)}
                  {student.firstName.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-text">
                    {student.lastName} {student.firstName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-text-secondary">
                    {yearsLabel(student.age)} · {student.groupName}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {percent != null && (
                    <span className={`text-sm font-bold ${percent >= 80 ? 'text-[#2f9e62]' : 'text-[#c4a035]'}`}>
                      {Math.round(percent)}%
                    </span>
                  )}
                  {student.sessionsCompleted != null && (
                    <span className="flex size-6 items-center justify-center rounded-full border border-[#e4e0d8] text-[11px] font-semibold text-text-secondary">
                      {student.sessionsCompleted}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {!showGroupForm && !showStudentForm &&
        createPortal(
          <button
            type="button"
            onClick={openAdd}
            aria-label={groups.length === 0 ? 'Создать группу' : 'Добавить ученика'}
            className="fixed right-5 bottom-[calc(7.75rem+env(safe-area-inset-bottom,0px))] z-40 flex size-12 items-center justify-center rounded-full bg-[#2f6fed] text-white shadow-[0_8px_20px_rgb(47_111_237_/_0.35)] lg:right-8 lg:bottom-8"
          >
            <IconPlus size={22} />
          </button>,
          document.body,
        )}
    </div>
  )
}
