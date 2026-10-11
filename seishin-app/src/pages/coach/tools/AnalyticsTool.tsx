import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { coachApi } from '../../../api/coach'
import { ApiError } from '../../../api/client'
import type { CoachDashboard, Competition, GroupSummary, StudentSummary } from '../../../api/types'
import { CoachError, CoachLoading } from '../../../components/coach/CoachScreenState'
import { BADGES_KEY, badgesOf, PAID_KEY, paidKey, type IssuedBadge, type PaidMonths } from '../../../components/coach/home/helpers'
import { useStoredState } from '../../../hooks/useStoredState'
import { todayIsoDate, useStudentBelts } from '../../../hooks/useStudentBelts'
import { rankLabel, stepName } from '../../../utils/beltSystem'
import { applyGroupEdits, EMPTY_GROUP_EDITS, GROUP_EDITS_KEY, type GroupEdits } from '../../../utils/groupEdits'
import { studentProgress } from '../../../utils/nextBeltProgress'
import { SectionTitle, ToolCard, ToolShell } from '../../../components/coach/tools/ToolShell'

type Row = StudentSummary & { groupId: number }

function Kpi({ value, label, tone }: { value: string; label: string; tone: string }) {
  return (
    <div className="rounded-3xl border border-border-light bg-white p-4 shadow-[var(--shadow-card)]">
      <p className={`pop-in text-[1.75rem] font-bold leading-none tracking-tight ${tone}`}>{value}</p>
      <p className="mt-2 text-xs font-medium text-text-secondary">{label}</p>
    </div>
  )
}

function Bar({ label, value, max, color, suffix }: { label: string; value: number; max: number; color: string; suffix?: string }) {
  return (
    <li>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-text">{label}</span>
        <span className="font-semibold tabular-nums text-text-secondary">
          {value}
          {suffix}
        </span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-muted">
        <span
          className="bar-grow block h-full rounded-full"
          style={{
            width: `${max && value ? Math.max(4, (value / max) * 100) : 0}%`,
            backgroundColor: color,
            boxShadow: 'inset 0 0 0 1px rgb(15 23 42 / 0.12)',
          }}
        />
      </div>
    </li>
  )
}

export function AnalyticsTool() {
  const [dashboard, setDashboard] = useState<CoachDashboard | null>(null)
  const [rawGroups, setRawGroups] = useState<GroupSummary[]>([])
  const [rawMembers, setRawMembers] = useState<Record<number, StudentSummary[]>>({})
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [filter, setFilter] = useState<number | 'all'>('all')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [edits] = useStoredState<GroupEdits>(GROUP_EDITS_KEY, EMPTY_GROUP_EDITS)
  const [issuedLog] = useStoredState<IssuedBadge[]>(BADGES_KEY, [])
  const [paid] = useStoredState<PaidMonths>(PAID_KEY, {})
  const { info: beltInfo } = useStudentBelts()

  const { groups, rows } = useMemo(() => {
    const applied = applyGroupEdits(rawGroups, rawMembers, edits)
    const today = todayIsoDate()
    const list: Row[] = applied.groups.flatMap((g) =>
      applied.members[g.id].map((s) => {
        const belt = beltInfo(s, g.id)
        const progress = belt.system
          ? studentProgress(belt.system, belt.record, s, badgesOf(issuedLog, s), competitions, today)
          : null
        return {
          ...s,
          groupId: g.id,
          beltName: belt.level ? `${rankLabel(belt.level)} · ${stepName(belt.level)}` : 'Без пояса',
          beltColor: belt.hex ?? '#e2e8f0',
          progressPercent: progress?.next ? progress.percent : null,
          maxRank: Boolean(progress && !progress.next),
        }
      }),
    )
    return { groups: applied.groups, rows: list }
  }, [rawGroups, rawMembers, edits, beltInfo, issuedLog, competitions])

  useEffect(() => {
    let alive = true
    Promise.all([coachApi.dashboard(), coachApi.groups(), coachApi.competitions().catch(() => [] as Competition[])])
      .then(async ([dash, list, comps]) => {
        const entries = await Promise.all(
          list.map(async (group) => [group.id, await coachApi.groupStudents(group.id).catch(() => [] as StudentSummary[])] as const),
        )
        if (!alive) return
        setDashboard(dash)
        setRawGroups(list)
        setRawMembers(Object.fromEntries(entries))
        setCompetitions(comps)
      })
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : 'Не удалось загрузить данные'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const students = useMemo(() => {
    const scoped = filter === 'all' ? rows : rows.filter((r) => r.groupId === filter)
    const seen = new Set<number>()
    return scoped.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)))
  }, [rows, filter])

  const stats = useMemo(() => {
    const withProgress = students.filter((s) => s.progressPercent != null)
    const avgProgress = withProgress.length
      ? Math.round(withProgress.reduce((sum, s) => sum + (s.progressPercent ?? 0), 0) / withProgress.length)
      : null
    const sessions = students.reduce((sum, s) => sum + (s.sessionsCompleted ?? 0), 0)
    const ready = students.filter((s) => (s.progressPercent ?? 0) >= 100 && !s.maxRank)
    const month = todayIsoDate().slice(0, 7)
    const unpaid = students.filter((s) => !paid[paidKey(s.id, month)]).length
    const avgAge = students.length ? Math.round((students.reduce((sum, s) => sum + s.age, 0) / students.length) * 10) / 10 : 0

    const belts = new Map<string, { name: string; color: string; count: number }>()
    for (const s of students) {
      const current = belts.get(s.beltName) ?? { name: s.beltName, color: s.beltColor, count: 0 }
      current.count += 1
      belts.set(s.beltName, current)
    }

    const buckets = [
      { label: '0–25%', color: '#ef4444', count: 0 },
      { label: '25–50%', color: '#f59e0b', count: 0 },
      { label: '50–75%', color: '#2563eb', count: 0 },
      { label: '75–100%', color: '#16a34a', count: 0 },
    ]
    for (const s of withProgress) {
      const p = s.progressPercent ?? 0
      buckets[p >= 75 ? 3 : p >= 50 ? 2 : p >= 25 ? 1 : 0].count += 1
    }

    const sorted = [...withProgress].sort((a, b) => (b.progressPercent ?? 0) - (a.progressPercent ?? 0))
    return {
      avgProgress,
      sessions,
      ready,
      unpaid,
      avgAge,
      belts: [...belts.values()].sort((a, b) => b.count - a.count),
      buckets,
      top: sorted.slice(0, 5),
      attention: sorted.filter((s) => (s.progressPercent ?? 0) < 25).slice(-5).reverse(),
    }
  }, [students, paid])

  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
      active ? 'bg-brand-blue text-white shadow-[var(--shadow-blue)]' : 'border border-border-light bg-white text-text-secondary'
    }`

  return (
    <ToolShell kind="analytics" title="Аналитика группы" subtitle="Прогресс, пояса и состав учеников">
      {loading ? (
        <CoachLoading />
      ) : error ? (
        <CoachError message={error} onRetry={() => window.location.reload()} />
      ) : (
        <>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] lg:mx-0 lg:px-0">
            <button type="button" onClick={() => setFilter('all')} className={chip(filter === 'all')}>
              Все группы
            </button>
            {groups.map((g) => (
              <button key={g.id} type="button" onClick={() => setFilter(g.id)} className={chip(filter === g.id)}>
                {g.name.replace(/\s+группа$/i, '')}
              </button>
            ))}
          </div>

          <div key={String(filter)} className="tool-stagger space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Kpi value={String(students.length)} label="учеников" tone="text-text" />
              <Kpi value={stats.avgProgress == null ? '—' : `${stats.avgProgress}%`} label="средний прогресс к поясу" tone="text-brand-blue" />
              <Kpi value={String(stats.sessions)} label="посещённых тренировок" tone="text-brand-green" />
              <Kpi value={String(stats.ready.length)} label="готовы к аттестации" tone="text-[#7c3aed]" />
            </div>

            <ToolCard>
              <SectionTitle>Прогресс к следующему поясу</SectionTitle>
              <ul className="space-y-3">
                {stats.buckets.map((b) => (
                  <Bar key={b.label} label={b.label} value={b.count} max={students.length} color={b.color} suffix=" уч." />
                ))}
              </ul>
            </ToolCard>

            <ToolCard>
              <SectionTitle>Состав по поясам</SectionTitle>
              {stats.belts.length === 0 ? (
                <p className="text-sm text-text-secondary">Нет учеников</p>
              ) : (
                <ul className="space-y-3">
                  {stats.belts.map((b) => (
                    <Bar key={b.name} label={b.name} value={b.count} max={students.length} color={b.color} suffix=" уч." />
                  ))}
                </ul>
              )}
            </ToolCard>

            {stats.top.length > 0 && (
              <ToolCard>
                <SectionTitle>Лидеры прогресса</SectionTitle>
                <ol className="space-y-2.5">
                  {stats.top.map((s, i) => (
                    <li key={s.id} className="flex items-center gap-3">
                      <span className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-[#fff4e0] text-[#d97706]' : 'bg-surface-muted text-text-secondary'}`}>
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-text">
                        {s.firstName} {s.lastName}
                      </span>
                      <span className="text-sm font-semibold text-brand-green">{Math.round(s.progressPercent ?? 0)}%</span>
                    </li>
                  ))}
                </ol>
              </ToolCard>
            )}

            {stats.attention.length > 0 && (
              <ToolCard>
                <SectionTitle>Требуют внимания</SectionTitle>
                <p className="-mt-1 mb-3 text-xs text-text-secondary">Прогресс к поясу ниже 25%</p>
                <ul className="space-y-2">
                  {stats.attention.map((s) => (
                    <li key={s.id} className="flex items-center justify-between rounded-2xl bg-error-bg/60 px-3.5 py-2.5 text-sm">
                      <span className="font-medium text-text">
                        {s.firstName} {s.lastName}
                      </span>
                      <span className="font-semibold text-error">{Math.round(s.progressPercent ?? 0)}%</span>
                    </li>
                  ))}
                </ul>
              </ToolCard>
            )}

            {filter === 'all' && dashboard && (
              <ToolCard>
                <SectionTitle>Клуб сейчас</SectionTitle>
                <ul className="grid grid-cols-2 gap-3 text-sm">
                  <li className="rounded-2xl bg-surface-muted p-3">
                    <p className="text-lg font-bold text-text">{stats.avgAge || '—'}</p>
                    <p className="text-xs text-text-secondary">средний возраст</p>
                  </li>
                  <li className="rounded-2xl bg-surface-muted p-3">
                    <p className="text-lg font-bold text-text">{dashboard.upcomingBirthdays}</p>
                    <p className="text-xs text-text-secondary">дней рождения скоро</p>
                  </li>
                  <li className="rounded-2xl bg-surface-muted p-3">
                    <p className="text-lg font-bold text-text">{stats.unpaid}</p>
                    <p className="text-xs text-text-secondary">без оплаты в этом месяце</p>
                  </li>
                  <li className="rounded-2xl bg-surface-muted p-3">
                    <p className="text-lg font-bold text-text">{dashboard.pendingCompetitionRsvps}</p>
                    <p className="text-xs text-text-secondary">ответов на турниры</p>
                  </li>
                </ul>
              </ToolCard>
            )}

            <p className="px-1 text-xs leading-relaxed text-text-muted">
              Считается по данным клуба: прогресс к поясу и число посещённых тренировок каждого ученика.{' '}
              <Link to="/coach/attendance" className="font-semibold text-brand-blue">
                Журнал посещаемости
              </Link>
            </p>
          </div>
        </>
      )}
    </ToolShell>
  )
}
