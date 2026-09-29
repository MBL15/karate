import type { ReactNode } from 'react'
import { useParentChild } from '../../context/ParentChildContext'
import { ChildSwitcher } from './ChildSwitcher'

type ParentChildHeroBarProps = {
  right?: ReactNode
}

function ChildSelectHint({ className }: { className: string }) {
  const { children } = useParentChild()

  if (children.length < 2) {
    return (
      <p className={`mt-2 text-xs leading-snug ${className}`}>
        Нажмите «+», чтобы добавить ещё одного ребёнка
      </p>
    )
  }

  return (
    <p className={`mt-2 text-xs leading-relaxed ${className}`}>
      Нажмите на имя ребёнка — переключится профиль, награды и архив
    </p>
  )
}

/** Переключатель детей для hero-блоков на мобильных страницах родителя */
export function ParentChildHeroBar({ right }: ParentChildHeroBarProps) {
  return (
    <div className="mb-6">
      <div className="flex min-w-0 items-center gap-2">
        <ChildSwitcher variant="hero" />
        {right}
      </div>
      <ChildSelectHint className="text-white/60" />
    </div>
  )
}
