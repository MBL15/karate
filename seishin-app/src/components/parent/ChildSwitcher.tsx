import { useParentChild } from '../../context/ParentChildContext'
import { initialLetter } from '../../utils/format'
import { IconPlus } from '../ui/Icons'

type ChildSwitcherProps = {
  variant?: 'light' | 'hero'
}

export function ChildSwitcher({ variant = 'light' }: ChildSwitcherProps) {
  const { children, selectedChildId, setSelectedChildId, setAddChildOpen } = useParentChild()
  const hero = variant === 'hero'

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <div
        className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label="Выбор ребёнка"
      >
        {children.map((child) => {
          const active = child.id === selectedChildId
          return (
            <button
              key={child.id}
              type="button"
              onClick={() => setSelectedChildId(child.id)}
              aria-pressed={active}
              title={`Показать данные: ${child.firstName}`}
              className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full py-1.5 text-sm font-semibold transition ${
                hero
                  ? active
                    ? 'bg-white/10 pl-2 pr-4 text-white ring-1 ring-white/20'
                    : 'bg-white/5 px-3 text-white/70 hover:bg-white/10'
                  : active
                    ? 'bg-brand-green px-4 py-2 text-white shadow-sm'
                    : 'border border-border bg-surface px-4 py-2 text-text-secondary hover:border-brand-green/30'
              }`}
            >
              {hero && (
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    active ? 'bg-brand-green text-white' : 'bg-white/15 text-white'
                  }`}
                >
                  {initialLetter(child.firstName)}
                </span>
              )}
              <span className="max-w-[4.5rem] truncate sm:max-w-[5.5rem]">{child.firstName}</span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={() => setAddChildOpen(true)}
        aria-label="Добавить ребёнка"
        className={`flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1 rounded-full px-2.5 py-1.5 text-sm font-semibold sm:px-3 ${
          hero
            ? 'bg-white/10 text-white hover:bg-white/15'
            : 'border border-dashed border-border bg-surface text-text-secondary hover:border-brand-green hover:text-brand-green'
        }`}
      >
        <IconPlus size={16} />
        <span className="hidden sm:inline">Добавить</span>
      </button>
    </div>
  )
}
