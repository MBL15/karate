import { useEffect, useState } from 'react'
import { coachApi } from '../../../api/coach'
import type { GroupSummary } from '../../../api/types'
import { useStoredState } from '../../../hooks/useStoredState'
import { useStudentBelts } from '../../../hooks/useStudentBelts'
import { COLORS, styleLabel, type BeltSystem } from '../../../utils/beltSystem'
import { EMPTY_GROUP_EDITS, GROUP_EDITS_KEY, type GroupEdits } from '../../../utils/groupEdits'
import { IconCheck, IconChevronDown, IconPlus } from '../../ui/Icons'
import { BeltSystemEditor } from './BeltSystemEditor'

function BeltPreview({ system }: { system: BeltSystem }) {
  const kyu = system.levels.filter((l) => l.rank === 'kyu')
  const picks = kyu.length <= 5 ? kyu : [0, 0.25, 0.5, 0.75, 1].map((p) => kyu[Math.round(p * (kyu.length - 1))])
  return (
    <span className="flex shrink-0 flex-col gap-0.5" aria-hidden>
      {[...picks, ...(system.dan ? [{ color: 'black' as const, id: 'dan' }] : [])].map((l, i) => (
        <span
          key={`${l.id}-${i}`}
          className={`block h-1.5 w-8 rounded-full ${l.color === 'white' ? 'ring-1 ring-border' : ''}`}
          style={{ backgroundColor: COLORS[l.color].hex }}
        />
      ))}
    </span>
  )
}

export function BeltSystemsManager() {
  const { systems, setSystems, systemFor, setGroupSystem, setGroupSystems, dropSystemBelts } = useStudentBelts()
  const [edits] = useStoredState<GroupEdits>(GROUP_EDITS_KEY, EMPTY_GROUP_EDITS)
  const [rawGroups, setRawGroups] = useState<GroupSummary[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    let alive = true
    coachApi
      .groups()
      .then((list) => alive && setRawGroups(list))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])

  const groups = rawGroups.filter((g) => !edits.hidden.includes(g.id))
  const multi = systems.length > 1
  const expanded = systems.length === 1 && !adding ? systems[0].id : openId
  const usedStyles = (except?: string) => systems.filter((s) => s.id !== except && s.style !== 'custom').map((s) => s.style)

  const save = (next: BeltSystem) => setSystems((list) => (list.some((s) => s.id === next.id) ? list.map((s) => (s.id === next.id ? next : s)) : [...list, next]))

  const remove = (id: string) => {
    setSystems((list) => list.filter((s) => s.id !== id))
    setGroupSystems((map) => Object.fromEntries(Object.entries(map).filter(([, sid]) => sid !== id)))
    dropSystemBelts(id)
    setOpenId(null)
  }

  if (systems.length === 0) {
    return <BeltSystemEditor system={null} onChange={(s) => save(s)} />
  }

  return (
    <div className="space-y-2.5">
      {multi && (
        <p className="rounded-2xl bg-surface-muted px-3.5 py-2.5 text-xs leading-relaxed text-text-secondary">
          У каждой группы своя система поясов. Откройте систему и отметьте, какие группы занимаются по ней. Группы без выбора используют основную.
        </p>
      )}

      {systems.map((system, index) => {
        const open = expanded === system.id
        const own = groups.filter((g) => systemFor(g.id)?.id === system.id)
        const subtitle = !multi
          ? 'Для всех групп клуба'
          : own.length
            ? own.map((g) => g.name).join(', ')
            : 'Пока ни одной группы'
        return (
          <section key={system.id} className={`overflow-hidden rounded-3xl border transition ${open ? 'border-brand-blue/30 shadow-[var(--shadow-card)]' : 'border-border-light'}`}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : system.id)}
              disabled={!multi && !adding}
              aria-expanded={open}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition enabled:hover:bg-surface-muted"
            >
              <BeltPreview system={system} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate font-semibold text-text">{styleLabel(system)}</span>
                  {multi && index === 0 && <span className="shrink-0 rounded-full bg-brand-blue-light px-2 py-0.5 text-[10px] font-bold text-brand-blue">основная</span>}
                </span>
                <span className="block text-xs text-text-secondary">
                  {system.kyu} кю{system.dan ? ` · ${system.dan} дан` : ''} · <span className={own.length || !multi ? '' : 'text-[#d97706]'}>{subtitle}</span>
                </span>
              </span>
              {(multi || adding) && <IconChevronDown size={18} className={`shrink-0 text-text-muted transition ${open ? 'rotate-180' : ''}`} />}
            </button>

            {open && (
              <div className="pop-in border-t border-border-light px-4 pt-4 pb-3">
                {multi && groups.length > 0 && (
                  <div className="mb-5">
                    <p className="mb-2 text-sm font-semibold text-text">Группы с этим стилем</p>
                    <div className="flex flex-wrap gap-1.5">
                      {groups.map((g) => {
                        const on = systemFor(g.id)?.id === system.id
                        const other = !on ? systemFor(g.id) : null
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => !on && setGroupSystem(g.id, system.id)}
                            aria-pressed={on}
                            title={other ? `Сейчас: ${styleLabel(other)}` : undefined}
                            className={`flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition active:scale-95 ${
                              on ? 'bg-brand-blue text-white' : 'border border-border-light bg-white text-text-secondary hover:border-brand-blue/40'
                            }`}
                          >
                            {on && <IconCheck size={13} />}
                            {g.name}
                            {other && <span className="font-normal text-text-muted">· {styleLabel(other)}</span>}
                          </button>
                        )
                      })}
                    </div>
                    <p className="mt-1.5 text-[11px] text-text-muted">Нажмите на группу, чтобы перевести её на этот стиль.</p>
                  </div>
                )}
                <BeltSystemEditor system={system} onChange={save} onRemove={() => remove(system.id)} usedStyles={usedStyles(system.id)} />
              </div>
            )}
          </section>
        )
      })}

      {adding ? (
        <section className="pop-in rounded-3xl border border-dashed border-brand-blue/40 px-4 pt-4 pb-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold text-text">Новая система поясов</p>
            <button type="button" onClick={() => setAdding(false)} className="text-sm font-semibold text-text-secondary">
              Отмена
            </button>
          </div>
          <BeltSystemEditor
            system={null}
            emptyTitle="Выберите стиль для новой системы"
            usedStyles={usedStyles()}
            onChange={(s) => {
              save(s)
              setAdding(false)
              setOpenId(s.id)
            }}
          />
        </section>
      ) : (
        <button
          type="button"
          onClick={() => {
            setAdding(true)
            setOpenId(null)
          }}
          className="flex min-h-12 w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-brand-blue/40 text-sm font-semibold text-brand-blue transition hover:bg-brand-blue-light/50"
        >
          <IconPlus size={16} />
          Добавить ещё одну систему поясов
        </button>
      )}
      {!multi && !adding && <p className="px-1 text-[11px] text-text-muted">Если в клубе группы занимаются разными стилями — добавьте для них отдельные системы.</p>}
    </div>
  )
}
