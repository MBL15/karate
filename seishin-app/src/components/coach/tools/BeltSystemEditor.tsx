import { useState } from 'react'
import { IconCheck } from '../../ui/Icons'
import {
  autoName,
  buildLevels,
  COLOR_KEYS,
  COLORS,
  normsOf,
  presetSystem,
  PICKER_STYLES,
  STYLES,
  styleLabel,
  type BeltNorms,
  type BeltStep as BeltLevel,
  type BeltSystem,
  type ColorKey,
  type StyleId,
} from '../../../utils/beltSystem'
import { PROGRESS_WEIGHTS } from '../../../utils/nextBeltProgress'
import { BeltStrip as Belt } from '../BeltStrip'

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function Swatches({
  value,
  onPick,
  exclude,
  allowNone,
}: {
  value: ColorKey | null
  onPick: (key: ColorKey | null) => void
  exclude?: ColorKey
  allowNone?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {allowNone && (
        <button
          type="button"
          onClick={() => onPick(null)}
          aria-pressed={value === null}
          className={`flex h-9 items-center rounded-full px-3.5 text-xs font-semibold transition active:scale-95 ${
            value === null ? 'bg-text text-white' : 'bg-surface-muted text-text-secondary'
          }`}
        >
          Без полосы
        </button>
      )}
      {COLOR_KEYS.filter((key) => key !== exclude).map((key) => {
        const active = value === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onPick(key)}
            aria-pressed={active}
            aria-label={COLORS[key].name}
            title={COLORS[key].name}
            className={`relative flex size-9 items-center justify-center rounded-full transition duration-200 active:scale-90 ${
              active ? 'scale-110 ring-2 ring-brand-blue ring-offset-2' : 'hover:scale-105'
            } ${key === 'white' ? 'ring-1 ring-border' : ''}`}
            style={{ backgroundColor: COLORS[key].hex }}
          >
            {active && (
              <span className={`pop-in ${key === 'white' || key === 'yellow' ? 'text-text' : 'text-white'}`}>
                <IconCheck size={14} />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="rounded-2xl bg-surface-muted p-3">
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      <div className="mt-1.5 flex items-center justify-between">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`Меньше: ${label}`} className="size-8 rounded-full bg-white text-lg font-bold text-text-secondary shadow-sm active:scale-90 disabled:opacity-40">
          −
        </button>
        <span key={value} className="pop-in text-xl font-bold tabular-nums text-text">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`Больше: ${label}`} className="size-8 rounded-full bg-white text-lg font-bold text-text-secondary shadow-sm active:scale-90 disabled:opacity-40">
          +
        </button>
      </div>
    </div>
  )
}

function NormRow({ label, hint, value, max, onChange }: { label: string; hint: string; value: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="flex min-h-14 items-center gap-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text">{label}</p>
        <p className="truncate text-[11px] text-text-muted">{value === 0 ? 'не требуется' : hint}</p>
      </div>
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} disabled={value <= 0} aria-label={`Меньше: ${label}`} className="size-8 shrink-0 rounded-full bg-white text-lg font-bold text-text-secondary shadow-sm active:scale-90 disabled:opacity-40">
        −
      </button>
      <span key={value} className="pop-in w-8 text-center text-lg font-bold tabular-nums text-text">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`Больше: ${label}`} className="size-8 shrink-0 rounded-full bg-white text-lg font-bold text-text-secondary shadow-sm active:scale-90 disabled:opacity-40">
        +
      </button>
    </div>
  )
}

function StepLabel({ n, children }: { n: number; children: string }) {
  return (
    <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-text">
      <span className="flex size-5 items-center justify-center rounded-full bg-brand-blue text-[11px] font-bold text-white">{n}</span>
      {children}
    </p>
  )
}

export function BeltSystemEditor({
  system,
  onChange,
  onRemove,
  usedStyles = [],
  emptyTitle = 'Система поясов ещё не создана',
}: {
  system: BeltSystem | null
  onChange: (system: BeltSystem) => void
  onRemove?: () => void
  usedStyles?: StyleId[]
  emptyTitle?: string
}) {
  const [editing, setEditing] = useState<string | null>(null)

  const modified = system
    ? JSON.stringify({ ...system, norms: undefined }) !== JSON.stringify(presetSystem(system.style, system.styleName, system.id))
    : false
  const norms = normsOf(system ?? {})

  const setSystem = (next: BeltSystem) => onChange(system?.norms ? { ...next, norms: system.norms } : next)
  const edit = (fn: (s: BeltSystem) => BeltSystem) => system && onChange(fn(system))
  const setNorms = (patch: Partial<BeltNorms>) => edit((s) => ({ ...s, norms: { ...normsOf(s), ...patch } }))

  const setCounts = (kyu: number, dan: number) =>
    edit((s) => ({
      ...s,
      kyu,
      dan,
      levels: buildLevels(s.style, kyu, dan, s.levels),
    }))

  const update = (id: string, patch: Partial<BeltLevel>) =>
    edit((s) => ({ ...s, levels: s.levels.map((l) => (l.id === id ? { ...l, ...patch } : l)) }))

  const [naming, setNaming] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

  const confirmReplace = () => !modified || window.confirm('Ваши настройки поясов заменятся типовым набором выбранного стиля. Продолжить?')

  const pickStyle = (style: StyleId) => {
    setNaming(false)
    if (system?.style === style || !confirmReplace()) return
    setSystem(presetSystem(style, undefined, system?.id))
    setEditing(null)
  }

  const openNaming = () => {
    setNameDraft(system?.style === 'custom' ? (system.styleName ?? '') : '')
    setNaming(true)
  }

  const saveCustom = () => {
    const name = nameDraft.trim()
    if (!name) return
    if (system?.style === 'custom') edit((s) => ({ ...s, styleName: name }))
    else {
      if (!confirmReplace()) return
      setSystem(presetSystem('custom', name, system?.id))
      setEditing(null)
    }
    setNaming(false)
  }

  const isCustom = system?.style === 'custom'

  const removeSystem = () => {
    if (!onRemove) return
    if (!window.confirm(`Удалить систему поясов «${system ? styleLabel(system) : ''}»? Присвоенные в ней пояса учеников тоже удалятся.`)) return
    onRemove()
    setEditing(null)
  }

  return (
    <div>
      <StepLabel n={1}>Стиль каратэ</StepLabel>
      <div className="grid grid-cols-[repeat(4,minmax(0,1fr))_auto] items-center gap-1.5">
        {PICKER_STYLES.map((style) => {
          const taken = system?.style !== style && usedStyles.includes(style)
          return (
            <button
              key={style}
              type="button"
              onClick={() => pickStyle(style)}
              disabled={taken}
              aria-pressed={system?.style === style}
              title={taken ? 'Этот стиль уже есть в другой системе' : undefined}
              className={`h-10 min-w-0 truncate rounded-full px-1.5 text-[13px] font-semibold transition active:scale-95 ${
                system?.style === style
                  ? 'bg-brand-blue text-white shadow-[var(--shadow-blue)]'
                  : taken
                    ? 'border border-dashed border-border bg-surface-muted text-text-muted line-through decoration-text-muted/50'
                    : 'border border-border-light bg-white text-text-secondary hover:border-brand-blue/40'
              }`}
            >
              {STYLES[style].label}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => (naming ? setNaming(false) : openNaming())}
          aria-label={isCustom ? 'Переименовать свой стиль' : 'Добавить свой стиль'}
          aria-expanded={naming}
          title={isCustom ? 'Переименовать стиль' : 'Свой стиль'}
          className={`flex size-10 items-center justify-center rounded-full transition active:scale-90 ${
            isCustom
              ? 'bg-brand-blue text-white shadow-[var(--shadow-blue)]'
              : naming
                ? 'bg-brand-blue-light text-brand-blue ring-2 ring-brand-blue/40'
                : 'border border-dashed border-brand-blue/60 bg-white text-brand-blue hover:bg-brand-blue-light'
          }`}
        >
          {isCustom ? (
            <PencilIcon />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden className={`transition-transform duration-200 ${naming ? 'rotate-45' : ''}`}>
              <path d="M12 5v14M5 12h14" />
            </svg>
          )}
        </button>
      </div>

      {isCustom && !naming && (
        <button
          type="button"
          onClick={openNaming}
          className="pop-in mt-2 flex w-full items-center gap-2 rounded-2xl bg-brand-blue-light/60 px-3.5 py-2.5 text-left transition hover:bg-brand-blue-light"
        >
          <span className="text-xs font-medium text-text-secondary">Свой стиль:</span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-brand-blue">{styleLabel(system)}</span>
          <span className="text-xs font-semibold text-brand-blue">Изменить</span>
        </button>
      )}

      {naming && (
        <form
          className="pop-in mt-3 rounded-2xl border border-brand-blue/30 bg-brand-blue-light/40 p-3"
          onSubmit={(e) => {
            e.preventDefault()
            saveCustom()
          }}
        >
          <label htmlFor="belt-style-name" className="text-xs font-semibold text-text-secondary">
            {isCustom ? 'Название вашего стиля' : 'Свой стиль'}
          </label>
          <input
            id="belt-style-name"
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="Например, Кудо или Будокай"
            maxLength={40}
            className="input-coach mt-1.5 bg-white"
          />
          <div className="mt-2.5 flex gap-2">
            <button type="button" onClick={() => setNaming(false)} className="btn-secondary min-h-10 flex-1 rounded-xl bg-white">
              Отмена
            </button>
            <button type="submit" disabled={!nameDraft.trim()} className="btn-coach min-h-10 flex-1 rounded-xl">
              {isCustom ? 'Сохранить' : 'Создать систему'}
            </button>
          </div>
        </form>
      )}

      {!system ? (
        <div className="mt-3 rounded-2xl border border-dashed border-border bg-surface-muted/60 px-4 py-5 text-center">
          <div className="flex justify-center gap-1.5" aria-hidden>
            {(['white', 'yellow', 'green', 'brown', 'black'] as ColorKey[]).map((c) => (
              <span key={c} className="h-2 w-7 rounded-full opacity-40" style={{ backgroundColor: COLORS[c].hex }} />
            ))}
          </div>
          <p className="mt-3 text-sm font-semibold text-text">{emptyTitle}</p>
          <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-text-secondary">
            Выберите стиль вашего клуба — подставим типовые пояса, а вы настроите их под себя. Нет вашего стиля? Нажмите «+» и впишите своё название.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-2 text-xs text-text-secondary">
            {isCustom
              ? 'Подставлен базовый набор поясов — настройте ступени и цвета под ваш стиль.'
              : 'Подставлен типовой набор поясов — его можно изменить ниже.'}
          </p>

          <div className="mt-5">
            <StepLabel n={2}>Количество ступеней</StepLabel>
            <div className="grid grid-cols-2 gap-2.5">
              <Stepper label="Ученические (кю)" value={system.kyu} min={1} max={12} onChange={(n) => setCounts(n, system.dan)} />
              <Stepper label="Мастерские (дан)" value={system.dan} min={0} max={10} onChange={(n) => setCounts(system.kyu, n)} />
            </div>
          </div>

          <div className="mt-5">
            <StepLabel n={3}>Цвета и названия</StepLabel>
            <p className="mb-3 flex items-center gap-2 rounded-2xl bg-brand-blue-light/60 px-3.5 py-2.5 text-xs font-medium text-brand-blue">
              <PencilIcon />
              Нажмите на пояс, чтобы выбрать цвет, полосу и название
            </p>
            <ul className="space-y-1.5">
              {system.levels.map((level) => {
                const open = editing === level.id
                const rankLabel = `${level.number} ${level.rank === 'kyu' ? 'кю' : 'дан'}`
                return (
                  <li key={level.id} className={`overflow-hidden rounded-2xl border transition ${open ? 'border-brand-blue/40 bg-white shadow-[var(--shadow-card)]' : 'border-transparent'}`}>
                    <button
                      type="button"
                      onClick={() => setEditing(open ? null : level.id)}
                      aria-expanded={open}
                      className="flex w-full items-center gap-3 px-2.5 py-2 text-left transition hover:bg-surface-muted"
                    >
                      <span className="w-11 shrink-0 text-xs font-bold text-text-secondary">{rankLabel}</span>
                      <Belt color={level.color} stripe={level.stripe} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-text">{level.name || COLORS[level.color].name}</span>
                        {!level.name && level.stripe && (
                          <span className="block truncate text-xs text-text-secondary">с {COLORS[level.stripe].stripeName} полосой</span>
                        )}
                      </span>
                      <span className={`flex size-8 shrink-0 items-center justify-center rounded-full transition ${open ? 'bg-brand-blue text-white' : 'text-text-muted'}`}>
                        <PencilIcon />
                      </span>
                    </button>
                    {open && (
                      <div className="pop-in space-y-4 border-t border-border-light px-3.5 pt-3 pb-4">
                        <div>
                          <p className="mb-2 text-xs font-semibold text-text-secondary">Цвет пояса</p>
                          <Swatches
                            value={level.color}
                            onPick={(key) => key && update(level.id, { color: key, stripe: level.stripe === key ? null : level.stripe })}
                          />
                        </div>
                        {level.rank === 'kyu' && (
                          <div>
                            <p className="mb-2 text-xs font-semibold text-text-secondary">Полоса</p>
                            <Swatches value={level.stripe} onPick={(key) => update(level.id, { stripe: key })} exclude={level.color} allowNone />
                          </div>
                        )}
                        <div>
                          <p className="mb-2 text-xs font-semibold text-text-secondary">Название</p>
                          <div className="flex gap-2">
                            <input
                              value={level.name ?? ''}
                              onChange={(e) => update(level.id, { name: e.target.value || undefined })}
                              placeholder={autoName(level)}
                              className="input-coach"
                            />
                            {level.name && (
                              <button type="button" onClick={() => update(level.id, { name: undefined })} className="btn-secondary shrink-0">
                                Авто
                              </button>
                            )}
                          </div>
                          <p className="mt-1.5 text-[11px] text-text-muted">Оставьте пустым — название соберётся из цвета.</p>
                        </div>
                        <button type="button" onClick={() => setEditing(null)} className="btn-coach w-full">
                          Готово
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="mt-5">
            <StepLabel n={4}>Что нужно до следующего пояса</StepLabel>
            <p className="mb-3 text-xs leading-relaxed text-text-secondary">
              Из этого считается прогресс ученика: тренировки дают {PROGRESS_WEIGHTS.sessions}%, значки — {PROGRESS_WEIGHTS.badges}%, соревнования — {PROGRESS_WEIGHTS.competitions}%. Поставьте 0, если что-то не требуется.
            </p>
            <div className="divide-y divide-border-light rounded-2xl bg-surface-muted px-3">
              <NormRow label="Тренировки" hint="посещённых занятий" value={norms.sessions} max={200} onChange={(n) => setNorms({ sessions: n })} />
              <NormRow label="Значки" hint="полученных наград" value={norms.badges} max={30} onChange={(n) => setNorms({ badges: n })} />
              <NormRow label="Соревнования" hint="подтверждённых участий" value={norms.competitions} max={10} onChange={(n) => setNorms({ competitions: n })} />
            </div>
            {modified && (
              <button
                type="button"
                onClick={() => {
                  setSystem(presetSystem(system.style, system.styleName, system.id))
                  setEditing(null)
                }}
                className="mt-3 w-full rounded-2xl py-2.5 text-sm font-semibold text-text-secondary transition hover:bg-surface-muted"
              >
                {system.style === 'custom' ? 'Вернуть исходный набор' : `Вернуть пресет «${STYLES[system.style].label}»`}
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={removeSystem}
                className="mt-1 w-full rounded-2xl py-2.5 text-sm font-semibold text-error/80 transition hover:bg-error/5 hover:text-error"
              >
                Удалить эту систему поясов
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
