import { useId, useState } from 'react'
import { useParentChild } from '../../context/ParentChildContext'
import { ageText } from '../../utils/format'
import { beltTitle } from '../../utils/parentReadiness'
import { BottomSheet } from '../ui/BottomSheet'
import { IconCheck, IconChevronDown, IconPlus } from '../ui/Icons'
import { ChildAvatar } from './ChildAvatar'

function BeltDot({ color }: { color: string | null | undefined }) {
  return (
    <span
      aria-hidden
      className="inline-block h-2.5 w-6 shrink-0 rounded-sm ring-1 ring-border ring-inset"
      style={{ backgroundColor: color || '#f8fafc' }}
    />
  )
}

export function ChildSwitchSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleId = useId()
  const { children, selectedChildId, setSelectedChildId, setAddChildOpen, clubs, multiClub } = useParentChild()

  return (
    <BottomSheet open={open} titleId={titleId} onClose={onClose}>
      <h2 id={titleId} className="font-display text-xl font-bold text-text">
        {children.length > 1 ? 'Чей дневник открыть?' : 'Мои дети'}
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        {children.length > 1
          ? multiClub
            ? 'Дети в разных клубах — экраны покажут данные тренера выбранного ребёнка'
            : 'Все экраны покажут данные выбранного ребёнка'
          : 'Добавьте ещё ребёнка по коду от тренера — переключаться можно здесь'}
      </p>
      <ul className="mt-4 space-y-2">
        {children.map((child) => {
          const active = child.id === selectedChildId
          return (
            <li key={child.id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedChildId(child.id)
                  onClose()
                }}
                aria-pressed={active}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99] ${
                  active ? 'border-brand-green bg-brand-green-light/60' : 'border-border-light bg-white hover:bg-surface-muted'
                }`}
              >
                <ChildAvatar childId={child.id} name={`${child.firstName} ${child.lastName}`} size={48} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-text">
                    {child.firstName} {child.lastName}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2 text-xs text-text-secondary">
                    <BeltDot color={child.beltColor} />
                    <span className="truncate">
                      {beltTitle(child.beltName)} · {ageText(child.age)}
                    </span>
                  </span>
                  {clubs[child.id] && (
                    <span className="mt-0.5 block truncate text-xs font-semibold text-brand-green">{clubs[child.id]}</span>
                  )}
                </span>
                {active ? (
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-green text-white">
                    <IconCheck size={15} />
                  </span>
                ) : (
                  <span className="size-7 shrink-0 rounded-full border-2 border-border" aria-hidden />
                )}
              </button>
            </li>
          )
        })}
      </ul>
      <button
        type="button"
        onClick={() => {
          onClose()
          setAddChildOpen(true)
        }}
        className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-sm font-semibold text-brand-green transition hover:bg-surface-muted"
      >
        <IconPlus size={16} />
        Добавить ребёнка по коду
      </button>
    </BottomSheet>
  )
}

/** Компактная кнопка «фото + имя ˅» для шапки любого экрана родителя. */
export function ChildSwitchPill() {
  const { selectedChild } = useParentChild()
  const [open, setOpen] = useState(false)
  if (!selectedChild) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Ребёнок: ${selectedChild.firstName}. Сменить`}
        className="flex min-h-11 max-w-[9.5rem] shrink-0 items-center gap-1.5 rounded-full border border-border-light bg-white py-1 pr-2.5 pl-1 shadow-[var(--shadow-card)] transition active:scale-95"
      >
        <ChildAvatar
          childId={selectedChild.id}
          name={`${selectedChild.firstName} ${selectedChild.lastName}`}
          size={32}
        />
        <span className="truncate text-sm font-semibold text-text">{selectedChild.firstName}</span>
        <IconChevronDown size={16} className="shrink-0 text-text-secondary" />
      </button>
      <ChildSwitchSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}
