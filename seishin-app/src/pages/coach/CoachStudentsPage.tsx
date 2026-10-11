import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { coachApi } from '../../api/coach'
import type { Competition, GroupSummary, StudentSummary } from '../../api/types'
import { BADGES_KEY, badgesOf, plural, type IssuedBadge } from '../../components/coach/home/helpers'
import { studentProgress, type NextBeltProgress } from '../../utils/nextBeltProgress'
import { ApiError } from '../../api/client'
import { useCoachCreate } from '../../components/coach/coachCreateContext'
import { CoachError, CoachLoading } from '../../components/coach/CoachScreenState'
import { BeltStrip } from '../../components/coach/BeltStrip'
import { StudentSheet } from '../../components/coach/StudentSheet'
import { IconChevronRight, IconPlus, IconSearch, IconX } from '../../components/ui/Icons'
import { useStoredState } from '../../hooks/useStoredState'
import { todayIsoDate, useStudentBelts, type BeltInfo } from '../../hooks/useStudentBelts'
import { rankLabel, stepName, styleLabel, type BeltSystem } from '../../utils/beltSystem'
import { applyGroupEdits, EMPTY_GROUP_EDITS, GROUP_EDITS_KEY, type GroupEdits } from '../../utils/groupEdits'

type StudentRow = StudentSummary & { groupId: number; groupName: string }

const avatarTones = [
  'bg-brand-blue-light text-brand-blue',
  'bg-brand-green-light text-brand-green',
  'bg-[#f3e8ff] text-[#7c3aed]',
  'bg-[#fff4e5] text-[#d97706]',
]

function chipLabel(name: string) {
  return name.replace(/\s+группа$/i, '')
}

function StudentCard({
  student,
  tone,
  belt,
  progress,
  onOpen,
}: {
  student: StudentRow
  tone: string
  belt: BeltInfo
  progress: NextBeltProgress | null
  onOpen: () => void
}) {
  const percent = progress?.next ? progress.percent : null
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="block w-full rounded-2xl border border-border-light bg-white p-3.5 text-left shadow-[var(--shadow-card)] transition hover:border-brand-blue/30 active:scale-[0.99]"
      >
      <div className="flex items-center gap-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${tone}`}
          aria-hidden
        >
          {student.firstName.slice(0, 1)}
          {student.lastName.slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-text">
            {student.firstName} {student.lastName}
          </p>
          <p className="mt-1 flex min-w-0 items-center gap-2 text-xs text-text-secondary">
            {belt.level ? (
              <>
                <BeltStrip color={belt.level.color} stripe={belt.level.stripe} size="sm" />
                <span className="truncate">
                  <span className="font-semibold text-text">{rankLabel(belt.level)}</span> · {chipLabel(student.groupName)}
                </span>
              </>
            ) : (
              <>
                <span className="h-3.5 w-9 shrink-0 rounded border border-dashed border-border" aria-hidden />
                <span className="truncate">
                  <span className="font-medium text-[#d97706]">Пояс не присвоен</span> · {chipLabel(student.groupName)}
                </span>
              </>
            )}
          </p>
        </div>
        <IconChevronRight size={16} className="shrink-0 text-text-muted" />
      </div>
      <div className="mt-3 flex items-center gap-3 border-t border-border-light pt-3 text-xs text-text-secondary">
        <span className="shrink-0">
          {progress && !progress.next ? (
            <span className="font-semibold text-text">Высший пояс</span>
          ) : (
            <>
              До пояса: <span className="font-semibold text-text">{percent != null ? `${percent}%` : '—'}</span>
            </>
          )}
        </span>
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted" aria-hidden>
          <span
            className={`block h-full rounded-full transition-[width] duration-700 ${percent != null && percent >= 100 ? 'bg-brand-green' : 'bg-brand-blue'}`}
            style={{ width: `${percent ?? 0}%` }}
          />
        </span>
        <span className="shrink-0">
          Тренировок: <span className="font-semibold text-text">{student.sessionsCompleted ?? 0}</span>
        </span>
      </div>
      </button>
    </li>
  )
}

export function CoachStudentsPage() {
  const openCreate = useCoachCreate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [rawGroups, setRawGroups] = useState<GroupSummary[]>([])
  const [rawMembers, setRawMembers] = useState<Record<number, StudentSummary[]>>({})
  const [allStudents, setAllStudents] = useState<StudentSummary[]>([])
  const [edits, setEdits] = useStoredState<GroupEdits>(GROUP_EDITS_KEY, EMPTY_GROUP_EDITS)
  const [issuedLog] = useStoredState<IssuedBadge[]>(BADGES_KEY, [])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const { groups, rows, ungrouped, members } = useMemo(() => {
    const applied = applyGroupEdits(rawGroups, rawMembers, edits, allStudents)
    const ordered = [...applied.groups].sort((a, b) => a.id - b.id)
    const list: StudentRow[] = ordered.flatMap((group) =>
      [...applied.members[group.id]]
        .sort((a, b) => a.lastName.localeCompare(b.lastName, 'ru') || a.firstName.localeCompare(b.firstName, 'ru'))
        .map((student) => ({ ...student, groupId: group.id, groupName: group.name })),
    )
    const inGroups = new Set(list.map((row) => row.id))
    const own = new Map(Object.values(rawMembers).flat().map((s) => [s.id, s]))
    const rest: StudentRow[] = [...own.values()]
      .filter((s) => !inGroups.has(s.id))
      .sort((a, b) => a.lastName.localeCompare(b.lastName, 'ru'))
      .map((s) => ({ ...s, groupId: 0, groupName: 'Без группы' }))
    return { groups: ordered, rows: list, ungrouped: rest, members: applied.members }
  }, [rawGroups, rawMembers, edits, allStudents])
  const { systems: beltSystems, info: beltInfo, assign: assignBelt } = useStudentBelts()
  const [openStudent, setOpenStudent] = useState<{ row: StudentRow; key: number; open: boolean } | null>(null)
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
    birthDate: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [list, students, comps] = await Promise.all([
        coachApi.groups(),
        coachApi.students().catch(() => [] as StudentSummary[]),
        coachApi.competitions().catch(() => [] as Competition[]),
      ])
      setCompetitions(comps)
      const entries = await Promise.all(list.map(async (group) => [group.id, await coachApi.groupStudents(group.id)] as const))
      setRawGroups(list)
      setRawMembers(Object.fromEntries(entries))
      setAllStudents(students)
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

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const seen = new Set<number>()
    return [...rows, ...(filterGroupId === 'all' ? ungrouped : [])].filter((row) => {
      if (filterGroupId !== 'all' && row.groupId !== filterGroupId) return false
      if (filterGroupId === 'all') {
        if (seen.has(row.id)) return false
        seen.add(row.id)
      }
      if (!q) return true
      return `${row.firstName} ${row.lastName}`.toLowerCase().includes(q) ||
        `${row.lastName} ${row.firstName}`.toLowerCase().includes(q)
    })
  }, [rows, ungrouped, filterGroupId, query])

  const sections = useMemo(() => {
    const map = new Map<number, { id: number; name: string; students: StudentRow[] }>()
    for (const row of visible) {
      const section = map.get(row.groupId) ?? { id: row.groupId, name: row.groupName, students: [] }
      section.students.push(row)
      map.set(row.groupId, section)
    }
    return [...map.values()]
  }, [visible])

  const withoutBelt = useMemo(() => {
    const scope = filterGroupId === 'all' ? [...rows, ...ungrouped] : visible
    const bySystem = new Map<string, { system: BeltSystem; students: Map<number, StudentRow> }>()
    for (const row of scope) {
      const belt = beltInfo(row, row.groupId || null)
      if (belt.level || !belt.system?.levels.length) continue
      const entry = bySystem.get(belt.system.id) ?? { system: belt.system, students: new Map<number, StudentRow>() }
      entry.students.set(row.id, row)
      bySystem.set(belt.system.id, entry)
    }
    return [...bySystem.values()]
  }, [filterGroupId, rows, ungrouped, visible, beltInfo])
  const withoutBeltCount = new Set(withoutBelt.flatMap((e) => [...e.students.keys()])).size

  const studentGroups = (id: number) => rows.filter((row) => row.id === id).map((row) => ({ id: row.groupId, name: row.groupName }))

  const moveStudent = (studentId: number, toId: number, fromId: number | null) => {
    const next: Record<number, number[]> = {}
    if (fromId != null) next[fromId] = members[fromId].filter((s) => s.id !== studentId).map((s) => s.id)
    next[toId] = [...members[toId].map((s) => s.id).filter((id) => id !== studentId), studentId]
    setEdits((e) => ({ ...e, members: { ...e.members, ...next } }))
    const target = groups.find((g) => g.id === toId)
    setOpenStudent((s) => (s ? { ...s, row: { ...s.row, groupId: toId, groupName: target?.name ?? s.row.groupName } } : s))
  }

  const cardProps = (student: StudentRow) => {
    const belt = beltInfo(student, student.groupId || null)
    return {
      belt,
      progress: belt.system ? studentProgress(belt.system, belt.record, student, badgesOf(issuedLog, student), competitions, todayIsoDate()) : null,
      onOpen: () => setOpenStudent({ row: student, key: Date.now(), open: true }),
    }
  }

  const groupCount = useMemo(() => {
    if (filterGroupId === 'all') return new Set(rows.map((row) => row.id)).size + ungrouped.length
    return rows.filter((row) => row.groupId === filterGroupId).length
  }, [rows, ungrouped, filterGroupId])

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
      setStudentForm({ firstName: '', lastName: '', birthDate: '' })
      setShowStudentForm(false)
      await load()
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Ошибка')
    }
  }

  const chipClass = (active: boolean) =>
    `shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
      active
        ? 'bg-brand-blue text-white shadow-[var(--shadow-blue)]'
        : 'border border-border-light bg-white text-text-secondary hover:border-brand-blue/30 hover:text-text'
    }`

  return (
    <div className="mx-auto w-full max-w-lg px-5 pb-8 pt-[max(1.5rem,var(--safe-top-effective))] lg:max-w-3xl lg:px-8 lg:pt-8">
      <h1 className="font-display text-[1.75rem] font-bold leading-tight tracking-tight text-text">База</h1>

      <label className="mt-4 flex items-center gap-2.5 rounded-2xl border border-border-light bg-white px-4 transition focus-within:border-brand-blue/50 focus-within:ring-4 focus-within:ring-brand-blue/10">
        <IconSearch size={18} className="shrink-0 text-text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск ученика"
          aria-label="Поиск ученика"
          className="min-h-12 w-full bg-transparent text-sm text-text outline-none placeholder:text-text-muted [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Очистить поиск"
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-secondary"
          >
            <IconX size={14} />
          </button>
        )}
      </label>

      <div
        className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] lg:mx-0 lg:px-0"
        role="tablist"
        aria-label="Группы"
      >
        <button
          type="button"
          role="tab"
          aria-selected={filterGroupId === 'all'}
          onClick={() => setFilterGroupId('all')}
          className={chipClass(filterGroupId === 'all')}
        >
          Все группы
        </button>
        {groups.map((group) => (
          <button
            key={group.id}
            type="button"
            role="tab"
            aria-selected={filterGroupId === group.id}
            onClick={() => setFilterGroupId(group.id)}
            className={chipClass(filterGroupId === group.id)}
          >
            {chipLabel(group.name)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setShowStudentForm(false)
            setShowGroupForm(true)
          }}
          aria-label="Создать группу"
          className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-brand-blue/40 px-3.5 py-2 text-sm font-semibold text-brand-blue transition hover:bg-brand-blue-light/60"
        >
          <IconPlus size={14} />
          Группа
        </button>
      </div>

      {message && <p className="alert-success mt-4">{message}</p>}

      {showGroupForm && (
        <form onSubmit={createGroup} className="mt-4 rounded-2xl border border-border-light bg-white p-4 shadow-[var(--shadow-card)]">
          <p className="font-semibold text-text">Новая группа</p>
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Например, Младшая"
            className="input-coach mt-3"
            required
            autoFocus
          />
          <div className="mt-3 flex gap-2">
            <button type="submit" className="btn-coach">Создать</button>
            <button type="button" onClick={() => setShowGroupForm(false)} className="btn-secondary">Отмена</button>
          </div>
        </form>
      )}

      {showStudentForm && studentGroupId != null && (
        <form onSubmit={createStudent} className="mt-4 space-y-3 rounded-2xl border border-border-light bg-white p-4 shadow-[var(--shadow-card)]">
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
            autoFocus
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
            aria-label="Дата рождения"
            max={todayIsoDate()}
            required
          />
          <div className="flex gap-2">
            <button type="submit" className="btn-coach">Добавить</button>
            <button type="button" onClick={() => setShowStudentForm(false)} className="btn-secondary">Отмена</button>
          </div>
        </form>
      )}

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-text">
          Ученики <span className="text-text-muted">({groupCount})</span>
        </h2>
        <button
          type="button"
          onClick={() => openCreate('invite')}
          className="flex min-h-9 items-center gap-1 rounded-full bg-brand-blue-light px-3.5 text-sm font-semibold text-brand-blue transition hover:bg-brand-blue hover:text-white"
        >
          <IconPlus size={15} />
          Добавить
        </button>
      </div>

      {!loading && !query && beltSystems.length === 0 && visible.length > 0 && (
        <div className="pop-in mt-3 flex items-center gap-3 rounded-2xl bg-brand-blue-light/60 p-3.5">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text">Система поясов не создана</p>
            <p className="mt-0.5 text-xs text-text-secondary">Выберите стиль клуба и настройте пояса, чтобы присваивать их ученикам.</p>
          </div>
          <Link to="/coach/tools/club" className="btn-coach min-h-10 shrink-0 rounded-xl px-3.5 text-sm">
            Создать
          </Link>
        </div>
      )}

      {!loading && !query && withoutBeltCount > 0 && (
        <div className="pop-in mt-3 rounded-2xl bg-[#fff8ec] p-3.5">
          <p className="text-sm font-semibold text-text">
            {withoutBeltCount} {plural(withoutBeltCount, 'ученику', 'ученикам', 'ученикам')} не присвоен пояс
          </p>
          <p className="mt-0.5 text-xs text-text-secondary">Новичкам обычно ставят начальный пояс. Остальным — откройте карточку и выберите вручную.</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {withoutBelt.map(({ system, students }) => {
              const first = system.levels[0]
              return (
                <button
                  key={system.id}
                  type="button"
                  onClick={() => assignBelt([...students.values()], system.id, first.id)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-3.5 text-sm font-semibold text-text shadow-[var(--shadow-card)] transition active:scale-95"
                >
                  <BeltStrip color={first.color} stripe={first.stripe} size="sm" />
                  {withoutBelt.length > 1 ? `${styleLabel(system)} (${students.size})` : 'Всем'}: {rankLabel(first)} · {stepName(first)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="mt-4">
          <CoachLoading />
        </div>
      ) : error ? (
        <div className="mt-4">
          <CoachError message={error} onRetry={() => void load()} />
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-white px-4 py-10 text-center">
          <p className="text-sm font-medium text-text">
            {query ? 'Никого не нашли' : groups.length === 0 ? 'Создайте первую группу' : 'В группе пока нет учеников'}
          </p>
          {!query && (
            <button
              type="button"
              onClick={() => (groups.length === 0 ? setShowGroupForm(true) : openCreate('invite'))}
              className="btn-coach mt-4"
            >
              {groups.length === 0 ? 'Создать группу' : 'Пригласить ученика'}
            </button>
          )}
        </div>
      ) : filterGroupId === 'all' ? (
        <div className="mt-3 space-y-6">
          {sections.map((section, sectionIndex) => (
            <section key={section.id} aria-label={section.name}>
              <div className="mb-2.5 flex items-center gap-2.5">
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    section.id === 0 ? 'bg-surface-muted text-text-muted' : 'bg-brand-blue-light text-brand-blue'
                  }`}
                  aria-hidden
                >
                  {section.id === 0 ? '—' : sectionIndex + 1}
                </span>
                <h3 className="min-w-0 flex-1 truncate font-semibold text-text">
                  {chipLabel(section.name)} <span className="font-normal text-text-muted">· {section.students.length}</span>
                </h3>
                {section.id !== 0 && (
                  <button type="button" onClick={() => setFilterGroupId(section.id)} className="shrink-0 text-xs font-semibold text-brand-blue">
                    Только эта →
                  </button>
                )}
              </div>
              <ul className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
                {section.students.map((student, index) => (
                  <StudentCard
                    key={`${student.groupId}-${student.id}`}
                    student={student}
                    tone={avatarTones[index % avatarTones.length]}
                    {...cardProps(student)}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <ul className="mt-3 space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
          {visible.map((student, index) => (
            <StudentCard
              key={`${student.groupId}-${student.id}`}
              student={student}
              tone={avatarTones[index % avatarTones.length]}
              {...cardProps(student)}
            />
          ))}
        </ul>
      )}

      {openStudent && (
        <StudentSheet
          key={openStudent.key}
          open={openStudent.open}
          student={openStudent.row}
          groupName={openStudent.row.groupId ? openStudent.row.groupName : undefined}
          groups={studentGroups(openStudent.row.id)}
          initialGroupId={openStudent.row.groupId || null}
          allGroups={groups.map((g) => ({ id: g.id, name: g.name }))}
          onMove={(toId, fromId) => moveStudent(openStudent.row.id, toId, fromId)}
          onClose={() => setOpenStudent((s) => (s ? { ...s, open: false } : s))}
        />
      )}
    </div>
  )
}
