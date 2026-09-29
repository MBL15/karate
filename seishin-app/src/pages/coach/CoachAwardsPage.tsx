import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { coachApi } from '../../api/coach'
import type { BadgeDefinition, BeltLevel, StudentSummary } from '../../api/types'
import { ApiError } from '../../api/client'
import { CoachHero } from '../../components/coach/CoachHero'
import { CoachPageShell } from '../../components/coach/CoachPageShell'
import { CoachLoading } from '../../components/coach/CoachScreenState'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { StatCard } from '../../components/ui/StatCard'

export function CoachAwardsPage() {
  const [students, setStudents] = useState<StudentSummary[]>([])
  const [badges, setBadges] = useState<BadgeDefinition[]>([])
  const [belts, setBelts] = useState<BeltLevel[]>([])
  const [studentId, setStudentId] = useState<number | ''>('')
  const [beltId, setBeltId] = useState<number | ''>('')
  const [note, setNote] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([coachApi.students(), coachApi.badges(), coachApi.belts()])
      .then(([s, b, bl]) => {
        setStudents(s)
        setBadges(b)
        setBelts(bl)
        if (s[0]) setStudentId(s[0].id)
        if (bl[0]) setBeltId(bl[0].id)
      })
      .finally(() => setLoading(false))
  }, [])

  const issueBadge = async (badgeId: number) => {
    if (!studentId) return
    try {
      await coachApi.issueBadge(Number(studentId), badgeId, note || undefined)
      setMessage('Значок выдан — родитель увидит в дневнике')
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : 'Ошибка')
    }
  }

  const assignBelt = async (e: FormEvent) => {
    e.preventDefault()
    if (!studentId || !beltId) return
    try {
      const updated = await coachApi.assignBelt(Number(studentId), Number(beltId))
      setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
      setMessage(`Пояс «${updated.beltName}» назначен`)
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Ошибка')
    }
  }

  const selected = students.find((s) => s.id === studentId)
  const earnedBadges = badges.length

  return (
    <CoachPageShell
      title="Награды"
      subtitle="Выдача значков и назначение пояса ученику"
      hero={
        <CoachHero eyebrow="Кабинет" title="Награды" subtitle="Значки и пояса">
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { value: students.length, label: 'учеников' },
              { value: earnedBadges, label: 'значков' },
              { value: belts.length, label: 'поясов' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/10 px-2 py-3 text-center">
                <p className="text-xl font-extrabold text-white">{loading ? '—' : stat.value}</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </CoachHero>
      }
    >
      {loading ? (
        <CoachLoading />
      ) : (
        <>
          {message && <p className="alert-success">{message}</p>}

          <div className="hidden gap-4 sm:grid sm:grid-cols-3 lg:grid">
            <StatCard label="Учеников" value={students.length} accent="blue" />
            <StatCard label="Значков" value={badges.length} accent="green" />
            <StatCard label="Поясов" value={belts.length} accent="amber" />
          </div>

          <div className="card max-w-lg p-6">
            <label className="label">Ученик</label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(Number(e.target.value))}
              className="input-coach"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} — {s.beltName}
                </option>
              ))}
            </select>
            {selected && (
              <div className="mt-4">
                <ProgressBar value={selected.progressPercent} label="Прогресс к аттестации" />
              </div>
            )}
          </div>

          <section className="card p-6">
            <h2 className="section-title">Значки</h2>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Комментарий (необязательно)"
              className="input-coach mt-4 max-w-lg"
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {badges.map((badge) => (
                <div key={badge.id} className="rounded-xl border border-border-light bg-surface-muted p-5 transition hover:border-brand-blue/30">
                  <p className="font-semibold text-text">{badge.name}</p>
                  <p className="mt-1.5 text-sm text-text-secondary">{badge.description}</p>
                  <button
                    type="button"
                    onClick={() => issueBadge(badge.id)}
                    className="mt-4 rounded-lg bg-warning-bg px-4 py-2 text-xs font-semibold text-warning transition hover:bg-warning/10"
                  >
                    Выдать значок
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="section-title">Назначить пояс</h2>
            <form onSubmit={assignBelt} className="mt-4 flex flex-wrap items-end gap-4">
              <div className="min-w-[200px] flex-1">
                <label className="label">Новый пояс</label>
                <select
                  value={beltId}
                  onChange={(e) => setBeltId(Number(e.target.value))}
                  className="input-coach"
                >
                  {belts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-coach">Назначить пояс</button>
            </form>
            <div className="mt-6 flex flex-wrap gap-2">
              {belts.map((b) => (
                <span
                  key={b.id}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium"
                  style={{ borderLeftColor: b.color, borderLeftWidth: 4 }}
                >
                  {b.sortOrder}. {b.name}
                </span>
              ))}
            </div>
          </section>
        </>
      )}
    </CoachPageShell>
  )
}
