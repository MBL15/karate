import { useState } from 'react'
import { useParentChild } from '../../context/ParentChildContext'
import { beltTitle } from '../../utils/parentReadiness'
import { IconBell, IconChevronDown } from '../ui/Icons'
import { BackButton } from './BackButton'
import { ChildAvatar } from './ChildAvatar'
import { ChildSwitchSheet } from './ChildSwitch'

export function BeltMark({ color, className = '' }: { color: string | null | undefined; className?: string }) {
  const light = !color || /^#f{3,6}$/i.test(color) || color.toLowerCase() === '#f8fafc'
  return (
    <span
      aria-hidden
      className={`relative inline-flex h-3.5 w-9 shrink-0 overflow-hidden rounded ${light ? 'ring-1 ring-border ring-inset' : ''} ${className}`}
      style={{ backgroundColor: color || '#f8fafc' }}
    >
      <span className="absolute inset-y-0 left-3 w-1 bg-black/10" />
    </span>
  )
}

function ChildPicker({ name, large }: { name: string; large: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`${name}. Сменить ребёнка`}
        className="flex max-w-full items-center gap-1 rounded-lg text-left transition active:opacity-70"
      >
        <span className={`truncate font-display font-bold tracking-tight text-text ${large ? 'text-xl' : 'text-lg'}`}>
          {name}
        </span>
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
          <IconChevronDown size={15} />
        </span>
      </button>
      <ChildSwitchSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export function ParentTopBar({
  variant,
  alerts,
  onBell,
  beltName,
  beltColor,
}: {
  variant: 'home' | 'back'
  alerts: number
  onBell: () => void
  beltName?: string | null
  beltColor?: string | null
}) {
  const { selectedChild, clubs, multiClub } = useParentChild()
  const fullName = selectedChild ? `${selectedChild.firstName} ${selectedChild.lastName}` : 'Ребёнок'
  const givenName = selectedChild?.firstName || 'Ребёнок'
  const club = multiClub && selectedChild ? clubs[selectedChild.id] : undefined

  const bell = (
    <button
      type="button"
      onClick={onBell}
      aria-label={alerts ? `Уведомления: ${alerts} требуют внимания` : 'Уведомления'}
      className="relative flex size-11 shrink-0 items-center justify-center rounded-full text-text transition hover:bg-surface-muted"
    >
      <IconBell size={22} />
      {alerts > 0 && (
        <span className="absolute top-1 right-1 flex min-w-[18px] items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold leading-[18px] text-white ring-2 ring-white">
          {alerts > 9 ? '9+' : alerts}
        </span>
      )}
    </button>
  )

  if (variant === 'back') {
    return (
      <div className="flex items-center gap-2">
        <BackButton />
        <div className="min-w-0 flex-1">
          <ChildPicker name={fullName} large={false} />
          {club && <p className="truncate text-xs font-semibold text-brand-green">{club}</p>}
        </div>
        {bell}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3.5">
      <ChildAvatar childId={selectedChild?.id} name={fullName} size={60} editable />
      <div className="min-w-0 flex-1">
        <ChildPicker name={givenName} large />
        <p className="mt-1 flex items-center gap-2 text-sm text-text-secondary">
          <span className="font-semibold text-text">{beltTitle(beltName ?? selectedChild?.beltName)}</span>
          <BeltMark color={beltColor ?? selectedChild?.beltColor} />
        </p>
        {club && <p className="mt-0.5 truncate text-xs font-semibold text-brand-green">{club}</p>}
      </div>
      {bell}
    </div>
  )
}
