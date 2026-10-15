import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { coachApi } from '../../api/coach'
import type { Competition, StudentSummary } from '../../api/types'
import { studentProgress } from '../../utils/nextBeltProgress'
import { useCoachIssuedBadges } from '../../hooks/useCoachIssuedBadges'
import { todayIsoDate, useStudentBelts } from '../../hooks/useStudentBelts'
import { syncAssignBelt } from '../../utils/coachSync'
import { badgesOf, type IssuedBadge } from './home/helpers'
import { rankLabel, stepName, styleLabel, type BeltStep } from '../../utils/beltSystem'
import { BadgeToken } from '../ui/BadgeToken'
import { BottomSheet } from '../ui/BottomSheet'
import { DateField } from '../ui/DateField'
import { IconAward, IconCheck, IconUsers, IconX } from '../ui/Icons'
import { BeltStrip } from './BeltStrip'
import { ParentAccessCode } from './ParentAccessCode'

type Mode = 'view' | 'pick'

function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function plural(n: number, one: string, few: string, many: string) {
  const n10 = n % 10
  const n100 = n % 100
  if (n10 === 1 && n100 !== 11) return one
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few
  return many
}

function groupAwards(list: IssuedBadge[]) {
  const byBadge = new Map<number, { badgeId: number; name: string; count: number; last: string }>()
  for (const b of list) {
    const item = byBadge.get(b.badgeId)
    if (item) {
      item.count++
      if (b.date > item.last) item.last = b.date
    } else {
      byBadge.set(b.badgeId, { badgeId: b.badgeId, name: b.name, count: 1, last: b.date })
    }
  }
  return [...byBadge.values()].sort((a, b) => b.last.localeCompare(a.last))
}

export function StudentSheet({
  open,
  student,
  groupName,
  groups = [],
  initialGroupId = null,
  allGroups = [],
  onMove,
  onRemoveFromClub,
  onClose,
}: {
  open: boolean
  student: StudentSummary
  groupName?: string
  groups?: { id: number; name: string }[]
  initialGroupId?: number | null
  allGroups?: { id: number; name: string }[]
  onMove?: (toGroupId: number, fromGroupId: number | null) => void
  onRemoveFromClub?: () => void | Promise<void>
  onClose: () => void
}) {
  const { systems, systemsFor, systemsForStudent, info, pinStudentSystem, infoIn, assign, undoLast } = useStudentBelts()
  const groupIds = groups.map((g) => g.id)
  const studentSystems = systemsForStudent(student, groupIds)
  const [systemId, setSystemId] = useState<string | null>(() => info(student, initialGroupId).system?.id ?? null)
  const system = studentSystems.find((s) => s.id === systemId) ?? studentSystems[0] ?? null
  const belt = infoIn(student, system)
  const [mode, setMode] = useState<Mode>('view')
  const [date, setDate] = useState(todayIsoDate())
  const [picked, setPicked] = useState<string | null>(belt.level?.id ?? null)
  const [pickSystemId, setPickSystemId] = useState<string | null>(null)
  const pickSystem = systems.find((s) => s.id === pickSystemId) ?? system
  const pickCurrent = pickSystem ? infoIn(student, pickSystem).level : null
  const [done, setDone] = useState<string | null>(null)
  const titleId = `student-sheet-${student.id}`
  const fullName = `${student.firstName} ${student.lastName}`
  const groupLine = groups.length > 1 ? groups.map((g) => g.name).join(', ') : groupName
  const styleChanged = Boolean(pickSystem && system && pickSystem.id !== system.id)
  const { issued: issuedLog, refresh: refreshBadges } = useCoachIssuedBadges()
  const myAwards = badgesOf(issuedLog, student)
  const awards = groupAwards(myAwards)
  const awardsTotal = awards.reduce((sum, a) => sum + a.count, 0)
  const [openAward, setOpenAward] = useState<number | null>(null)
  const [competitions, setCompetitions] = useState<Competition[]>([])
  useEffect(() => {
    let alive = true
    coachApi
      .competitions()
      .then((list) => alive && setCompetitions(list))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])
  const progress = system ? studentProgress(system, belt.record, student, myAwards, competitions, todayIsoDate()) : null
  const [moving, setMoving] = useState(false)
  const [moveTo, setMoveTo] = useState<number | null>(null)
  const [removing, setRemoving] = useState(false)
  const fromGroup = groups.find((g) => g.id === initialGroupId) ?? groups[0] ?? null
  const moveTargets = allGroups.filter((g) => !groups.some((m) => m.id === g.id))
  const moveTarget = moveTargets.find((g) => g.id === moveTo) ?? null
  const openEntries = myAwards.filter((b) => b.badgeId === openAward).sort((a, b) => b.date.localeCompare(a.date))

  const removeAward = async (entry: IssuedBadge) => {
    if (entry.id == null) {
      setDone('Не удалось отозвать — обновите страницу')
      return
    }
    try {
      await coachApi.revokeBadge(entry.id)
      await refreshBadges()
      setDone('Значок отозван — у родителя он исчезнет из дневника')
    } catch {
      setDone('Не удалось отозвать значок')
    }
  }

  const confirm = async (level: BeltStep) => {
    if (!pickSystem) return
    const needBelt = pickCurrent?.id !== level.id
    if (needBelt) assign([student], pickSystem.id, level.id, date)
    if (needBelt) {
      try {
        await syncAssignBelt(student.id, level)
      } catch {
        setDone('Пояс сохранён на этом устройстве, но не синхронизирован — родитель может не увидеть изменение')
        setMode('view')
        return
      }
    }
    if (styleChanged) {
      pinStudentSystem(student, systemsFor(groupIds).some((s) => s.id === pickSystem.id) ? null : pickSystem.id)
      setSystemId(pickSystem.id)
      setDone(`Стиль изменён на «${styleLabel(pickSystem)}» · ${rankLabel(level)} · ${stepName(level)}`)
    } else {
      setDone(belt.level ? `${student.firstName} теперь ${rankLabel(level)} · ${stepName(level)}` : `Пояс присвоен: ${rankLabel(level)}`)
    }
    setMode('view')
  }

  const choosePickSystem = (id: string) => {
    setPickSystemId(id)
    const target = systems.find((s) => s.id === id) ?? null
    setPicked(target ? (infoIn(student, target).level?.id ?? null) : null)
  }

  const history = [...(belt.record?.history ?? [])].reverse()
  const levelById = (id: string) => system?.levels.find((l) => l.id === id) ?? null

  return (
    <BottomSheet open={open} titleId={titleId} onClose={onClose}>
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-blue-light text-base font-bold text-brand-blue">
          {student.firstName[0]}
          {student.lastName[0]}
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="truncate font-display text-xl font-bold text-text">
            {fullName}
          </h2>
          <p className="text-xs text-text-secondary">
            {student.age} {plural(student.age, 'год', 'года', 'лет')}
            {groupLine && !onMove ? ` · ${groupLine}` : ''}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Закрыть" className="flex size-9 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
          <IconX size={16} />
        </button>
      </div>

      {done && (
        <p className="alert-success pop-in mt-4" role="status">
          {done}
        </p>
      )}

      {onMove && allGroups.length > 0 && mode === 'view' && (
        <section className="mt-4 rounded-3xl border border-border-light p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
              <IconUsers size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-text-muted">Группа</p>
              <p className="truncate text-[15px] font-semibold text-text">{groupLine || 'Без группы'}</p>
            </div>
            {moveTargets.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMoving((v) => !v)
                  setMoveTo(null)
                }}
                aria-expanded={moving}
                className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold transition active:scale-95 ${
                  moving ? 'bg-surface-muted text-text' : 'bg-brand-blue-light text-brand-blue'
                }`}
              >
                {moving ? 'Отмена' : fromGroup ? 'Перевести' : 'В группу'}
              </button>
            )}
          </div>

          {moving && (
            <div className="pop-in mt-3 border-t border-border-light pt-3">
              <p className="mb-2 text-[11px] font-medium text-text-muted">{fromGroup ? 'В какую группу перевести' : 'В какую группу добавить'}</p>
              <div className="flex flex-wrap gap-1.5">
                {moveTargets.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setMoveTo(g.id)}
                    aria-pressed={moveTo === g.id}
                    className={`min-h-9 rounded-full px-3.5 text-[13px] font-semibold transition active:scale-95 ${
                      moveTo === g.id ? 'bg-brand-blue text-white shadow-sm' : 'bg-surface-muted text-text'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
              {moveTarget && (
                <div className="pop-in mt-3 rounded-2xl bg-brand-blue-light/50 p-3">
                  <p className="text-[13px] leading-snug text-text">
                    {fromGroup ? (
                      <>
                        Перевести из «{fromGroup.name}» в «<b>{moveTarget.name}</b>»?
                      </>
                    ) : (
                      <>
                        Добавить в группу «<b>{moveTarget.name}</b>»?
                      </>
                    )}
                  </p>
                  <p className="mt-0.5 text-[11px] text-text-secondary">
                    Пояс, значки и посещения сохранятся. Перевод пока виден только вам — у родителя и в расписании останется прежняя группа.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onMove(moveTarget.id, fromGroup?.id ?? null)
                      setMoving(false)
                      setMoveTo(null)
                      setDone(fromGroup ? `${student.firstName} переведён(а) в «${moveTarget.name}»` : `${student.firstName} теперь в «${moveTarget.name}»`)
                    }}
                    className="mt-2.5 min-h-10 w-full rounded-full bg-brand-blue text-sm font-semibold text-white transition active:scale-[0.98]"
                  >
                    {fromGroup ? 'Перевести' : 'Добавить'}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {studentSystems.length > 1 && (
        <div className="mt-4 flex gap-1 rounded-full bg-surface-subtle p-1" role="tablist" aria-label="Стиль">
          {studentSystems.map((s) => {
            const on = s.id === system?.id
            const lvl = infoIn(student, s).level
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setSystemId(s.id)
                  setMode('view')
                  setDone(null)
                }}
                className={`flex min-h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2 text-[13px] font-semibold transition ${
                  on ? 'bg-white text-brand-blue shadow-sm' : 'text-text-secondary'
                }`}
              >
                {lvl && <BeltStrip color={lvl.color} stripe={lvl.stripe} size="sm" />}
                <span className="truncate">{styleLabel(s)}</span>
              </button>
            )
          })}
        </div>
      )}

      <section className="mt-3 rounded-3xl border border-border-light p-4">
        <div className="flex min-h-9 items-center justify-between gap-3">
          <p className="min-w-0 truncate text-xs font-medium text-text-muted">
            {system && systems.length > 1 ? `Текущий пояс · ${styleLabel(system)}` : 'Текущий пояс'}
          </p>
          {system && mode === 'view' && (
            <button
              type="button"
              onClick={() => {
                setPicked(belt.level?.id ?? null)
                setPickSystemId(system.id)
                setDate(todayIsoDate())
                setDone(null)
                setMoving(false)
                setMode('pick')
              }}
              className="shrink-0 rounded-full bg-brand-blue-light px-3.5 py-2 text-[13px] font-semibold text-brand-blue transition active:scale-95"
            >
              {belt.level ? 'Изменить пояс' : 'Присвоить пояс'}
            </button>
          )}
        </div>
        {belt.level ? (
          <div className="mt-2 flex items-center gap-4">
            <BeltStrip color={belt.level.color} stripe={belt.level.stripe} size="lg" />
            <div className="min-w-0">
              <p className="text-lg leading-tight font-bold text-text">{rankLabel(belt.level)}</p>
              <p className="truncate text-sm text-text-secondary">{stepName(belt.level)}</p>
              {belt.record && <p className="mt-0.5 text-[11px] text-text-muted">с {formatDate(belt.record.since)}</p>}
            </div>
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-4">
            <span className="h-9 w-24 shrink-0 rounded-lg border-2 border-dashed border-border" aria-hidden />
            <div>
              <p className="font-semibold text-text">{system && belt.record ? 'Пояса больше нет в системе' : 'Пояс не присвоен'}</p>
              <p className="text-xs text-text-secondary">{system ? 'Выберите пояс из системы клуба' : 'В клубе ещё нет системы поясов'}</p>
            </div>
          </div>
        )}

        {progress && (
          <div className="mt-4 border-t border-border-light pt-3">
            {progress.next ? (
              <>
                <div className="flex items-center gap-2">
                  <BeltStrip color={progress.next.color} stripe={progress.next.stripe} size="sm" />
                  <p className="min-w-0 flex-1 truncate text-[13px] text-text-secondary">
                    До <span className="font-semibold text-text">{rankLabel(progress.next)}</span> · {stepName(progress.next)}
                  </p>
                  <span className="shrink-0 text-lg leading-none font-bold text-text tabular-nums">{progress.percent}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted" aria-hidden>
                  <div className="h-full rounded-full bg-brand-blue transition-[width] duration-700" style={{ width: `${progress.percent}%` }} />
                </div>
                <ul className="mt-3 grid grid-cols-3 gap-2">
                  {progress.parts.map((p) => {
                    const ratio = p.need > 0 ? Math.min(1, p.done / p.need) : 0
                    return (
                      <li key={p.key} className="min-w-0 rounded-2xl bg-surface-muted px-2.5 py-2">
                        <p className="truncate text-[11px] text-text-secondary">{p.label}</p>
                        <p className="mt-0.5 text-sm font-bold text-text tabular-nums">
                          {p.need > 0 ? (
                            <>
                              {Math.min(p.done, p.need)}
                              <span className="font-medium text-text-muted"> / {p.need}</span>
                            </>
                          ) : (
                            <span className="text-xs font-medium text-text-muted">не нужно</span>
                          )}
                        </p>
                        {p.need > 0 && (
                          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white" aria-hidden>
                            <div
                              className={`h-full rounded-full ${ratio >= 1 ? 'bg-brand-green' : 'bg-brand-blue/70'}`}
                              style={{ width: `${ratio * 100}%` }}
                            />
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
                {progress.percent >= 100 && (
                  <p className="mt-2.5 rounded-xl bg-brand-green-light/60 px-3 py-2 text-xs font-medium text-brand-green">
                    Норма выполнена — ученик готов к аттестации
                  </p>
                )}
              </>
            ) : (
              <p className="text-[13px] text-text-secondary">Это высший пояс в системе — дальше расти некуда.</p>
            )}
          </div>
        )}
        {!progress && (
          <p className="mt-4 border-t border-border-light pt-3 text-xs text-text-secondary">
            Тренировок посещено: <span className="font-semibold text-text tabular-nums">{student.sessionsCompleted ?? 0}</span>
          </p>
        )}
      </section>

      {!system && (
        <section className="pop-in mt-4 rounded-3xl bg-brand-blue-light/60 p-4">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-blue shadow-sm">
              <IconAward size={20} />
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-text">Сначала создайте систему поясов</p>
              <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                Выберите стиль клуба и настройте ступени кю и дан — после этого здесь можно будет присваивать пояса и отмечать аттестации.
              </p>
            </div>
          </div>
          <Link to="/coach/tools/club" onClick={onClose} className="btn-coach mt-3 flex min-h-12 w-full items-center justify-center rounded-2xl">
            Создать систему поясов
          </Link>
        </section>
      )}

      {system && pickSystem && mode === 'pick' && (
        <section className="pop-in mt-4">
          {systems.length > 1 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-text">Стиль ученика</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {systems.map((s) => {
                  const on = s.id === pickSystem.id
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => choosePickSystem(s.id)}
                      aria-pressed={on}
                      className={`min-h-9 rounded-full px-3.5 text-[13px] font-semibold transition active:scale-95 ${
                        on ? 'bg-brand-blue text-white shadow-[var(--shadow-blue)]' : 'border border-border-light bg-white text-text-secondary hover:border-brand-blue/40'
                      }`}
                    >
                      {styleLabel(s)}
                    </button>
                  )
                })}
              </div>
              {styleChanged && (
                <p className="pop-in mt-2 rounded-xl bg-[#fff8ec] px-3 py-2 text-xs leading-snug text-[#b45309]">
                  Ученик перейдёт на «{styleLabel(pickSystem)}». Пояс по «{styleLabel(system)}» сохранится в истории — к нему можно вернуться.
                </p>
              )}
            </div>
          )}
          <p className="text-sm font-semibold text-text">Пояс · {styleLabel(pickSystem)}</p>
          <ul className="mt-2 max-h-72 overflow-y-auto rounded-2xl border border-border-light">
            {pickSystem.levels.map((level) => {
              const active = picked === level.id
              return (
                <li key={level.id} className="border-b border-border-light last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setPicked(level.id)}
                    aria-pressed={active}
                    className={`flex min-h-12 w-full items-center gap-3 px-3 text-left transition ${active ? 'bg-brand-blue-light/60' : 'hover:bg-surface-muted'}`}
                  >
                    <span className="w-11 shrink-0 text-xs font-bold text-text-secondary">{rankLabel(level)}</span>
                    <BeltStrip color={level.color} stripe={level.stripe} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm text-text">{stepName(level)}</span>
                    {active && <IconCheck size={16} className="shrink-0 text-brand-blue" />}
                  </button>
                </li>
              )
            })}
          </ul>
          <label className="mt-3 block text-xs font-medium text-text-secondary">
            С какой даты
            <span className="mt-1 block">
              <DateField value={date} max={todayIsoDate()} onChange={setDate} required />
            </span>
          </label>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setMode('view')} className="btn-secondary min-h-11 flex-1 rounded-2xl">
              Отмена
            </button>
            <button
              type="button"
              disabled={!picked || (!styleChanged && picked === belt.level?.id)}
              onClick={() => {
                const level = pickSystem.levels.find((l) => l.id === picked)
                if (level) confirm(level)
              }}
              className="btn-coach min-h-11 flex-1 rounded-2xl"
            >
              Сохранить
            </button>
          </div>
          <Link to="/coach/tools/club" className="mt-2 block text-center text-xs font-semibold text-brand-blue">
            Изменить систему поясов в настройках клуба →
          </Link>
        </section>
      )}

      {system && history.length > 0 && (
        <section className="mt-5">
          <p className="text-sm font-semibold text-text">История поясов</p>
          <ol className="mt-2 space-y-1">
            {history.map((record, i) => {
              const level = levelById(record.levelId)
              return (
                <li key={`${record.levelId}-${record.date}-${i}`} className="flex items-center gap-3 rounded-xl px-1 py-1.5">
                  {level ? <BeltStrip color={level.color} stripe={level.stripe} size="sm" /> : <span className="h-3.5 w-9 rounded border border-dashed border-border" />}
                  <span className="min-w-0 flex-1 truncate text-sm text-text">
                    {level ? `${rankLabel(level)} · ${stepName(level)}` : 'Удалённая ступень'}
                  </span>
                  <span className="shrink-0 text-xs text-text-muted">{formatDate(record.date)}</span>
                </li>
              )
            })}
          </ol>
          <button
            type="button"
            onClick={() => {
              undoLast(student, system.id)
              setDone(null)
            }}
            className="mt-1 text-xs font-semibold text-text-secondary hover:text-error"
          >
            Отменить последнюю запись
          </button>
        </section>
      )}

      {mode === 'view' && (
        <section className="mt-5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-text">Значки</p>
            {awards.length > 0 && <span className="text-xs text-text-muted tabular-nums">всего {awardsTotal}</span>}
          </div>
          {awards.length === 0 ? (
            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-dashed border-border p-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-text-muted">
                <IconAward size={18} />
              </span>
              <p className="text-xs leading-snug text-text-secondary">
                Значков пока нет. Выдавайте их после тренировки — во вкладке «Отметки» у учеников, которые пришли.
              </p>
            </div>
          ) : (
            <>
              <ul className="mt-2 grid grid-cols-3 gap-2">
                {awards.map((a) => {
                  const active = openAward === a.badgeId
                  return (
                    <li key={a.badgeId}>
                      <button
                        type="button"
                        onClick={() => setOpenAward(active ? null : a.badgeId)}
                        aria-expanded={active}
                        className={`relative flex w-full flex-col items-center rounded-2xl px-2 pt-3 pb-2.5 text-center transition active:scale-[0.97] ${
                          active ? 'bg-surface-muted ring-2 ring-brand-blue/30' : 'bg-gradient-to-b from-white to-surface-muted'
                        }`}
                      >
                        {a.count > 1 && (
                          <span className="absolute top-1.5 right-1.5 rounded-full bg-text px-1.5 text-[10px] font-bold text-white tabular-nums">
                            ×{a.count}
                          </span>
                        )}
                        <BadgeToken name={a.name} size="lg" />
                        <span className="mt-1.5 line-clamp-2 text-[12px] leading-tight font-semibold text-text">{a.name}</span>
                        <span className="mt-0.5 text-[10px] text-text-muted">{formatDate(a.last)}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              {openEntries.length > 0 && (
                <div className="pop-in mt-2 rounded-2xl border border-border-light p-3">
                  <p className="text-xs font-semibold text-text">
                    {openEntries[0].name} · выдан {openEntries.length} {plural(openEntries.length, 'раз', 'раза', 'раз')}
                  </p>
                  <ul className="mt-1.5 divide-y divide-border-light">
                    {openEntries.map((entry, i) => (
                      <li key={`${entry.date}-${entry.eventKey ?? i}`} className="flex items-center justify-between gap-3 py-1.5">
                        <span className="text-[13px] text-text-secondary">{formatDate(entry.date)}</span>
                        <button
                          type="button"
                          onClick={() => void removeAward(entry)}
                          className="rounded-full px-2.5 py-1 text-xs font-semibold text-error transition hover:bg-error-bg active:scale-95"
                        >
                          Убрать
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1.5 text-[11px] leading-snug text-text-muted">
                    «Убрать» отзывает значок у родителя в дневнике и пересчитывает прогресс.
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {mode === 'view' && <ParentAccessCode key={student.id} studentId={student.id} studentName={fullName} />}

      {mode === 'view' && onRemoveFromClub && (
        <div className="mt-6 border-t border-border-light pt-4">
          <button
            type="button"
            disabled={removing}
            onClick={() => {
              const ok = window.confirm(
                `Удалить ${fullName} из клуба? Ученик пропадёт из базы и статистики. Родители больше не увидят его в дневнике.`,
              )
              if (!ok) return
              void (async () => {
                setRemoving(true)
                try {
                  await Promise.resolve(onRemoveFromClub())
                  onClose()
                } catch (err) {
                  const text = err instanceof Error ? err.message : 'Не удалось удалить ученика'
                  window.alert(text)
                } finally {
                  setRemoving(false)
                }
              })()
            }}
            className="min-h-11 w-full rounded-2xl border border-error/30 bg-error-bg text-sm font-semibold text-error transition active:scale-[0.98] disabled:opacity-50"
          >
            {removing ? 'Удаляем…' : 'Удалить из клуба'}
          </button>
          <p className="mt-2 text-center text-[11px] text-text-muted">
            Чтобы только убрать из группы, переведите в другую или оставьте в «Без группы» через настройки клуба.
          </p>
        </div>
      )}

      <p className="mt-5 text-center text-[11px] leading-snug text-text-muted">Значики из базы клуба родители видят сразу. Пояс, группа и базовые значки («Дисциплина», «Техника» и др.) пока хранятся на этом устройстве — родители увидят их после обновления сервера.</p>
    </BottomSheet>
  )
}
