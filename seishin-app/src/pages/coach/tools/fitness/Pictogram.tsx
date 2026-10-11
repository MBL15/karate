import type { ReactNode } from 'react'
import type { Category, Pose } from './exercises'

function Figure({ pose }: { pose: Pose }): ReactNode {
  switch (pose) {
    case 'plank':
      return (
        <>
          <circle cx="11" cy="23" r="3.2" />
          <path d="M14 25 36 29M16 26v10M36 29l6 7" />
        </>
      )
    case 'sideplank':
      return (
        <>
          <circle cx="12" cy="18" r="3.2" />
          <path d="M14 21 40 35M16 22l-2 14M16 23l6-10" />
        </>
      )
    case 'crunch':
      return (
        <>
          <circle cx="13" cy="24" r="3.2" />
          <path d="M15 27 26 34l6-10 6 12M15 22l6 2" />
        </>
      )
    case 'bicycle':
      return (
        <>
          <circle cx="12" cy="25" r="3.2" />
          <path d="M15 28 26 34l5-9 5 6M26 34l16-4M16 23l8 3" />
        </>
      )
    case 'twist':
      return (
        <>
          <circle cx="18" cy="13" r="3.2" />
          <path d="M19 17 22 30l10-6 6 4M20 21l11-1" />
        </>
      )
    case 'legraise':
      return (
        <>
          <circle cx="10" cy="32" r="3.2" />
          <path d="M13 33h15l6-20M14 34l4 3" />
        </>
      )
    case 'climber':
      return (
        <>
          <circle cx="11" cy="20" r="3.2" />
          <path d="M14 22 34 27M16 23v13M34 27l7 8M28 26l-4 7" />
        </>
      )
    case 'squat':
      return (
        <>
          <circle cx="21" cy="9" r="3.2" />
          <path d="M21 13 23 24l9 2-2 12M22 16l12 1" />
        </>
      )
    case 'wallsit':
      return (
        <>
          <path d="M12 4v36" strokeWidth="2" opacity="0.4" />
          <circle cx="17" cy="11" r="3.2" />
          <path d="M16 15v13h12v10M17 19l9 2" />
        </>
      )
    case 'lunge':
      return (
        <>
          <circle cx="24" cy="8" r="3.2" />
          <path d="M24 12v12l8 4v10M24 24l-8 8-4 6M24 15l-5 6M24 15l5 6" />
        </>
      )
    case 'jump':
      return (
        <>
          <circle cx="24" cy="7" r="3.2" />
          <path d="M24 11v12l-5 9M24 23l5 9M24 14l-8-7M24 14l8-7M16 41h16" />
        </>
      )
    case 'bridge':
      return (
        <>
          <circle cx="9" cy="32" r="3.2" />
          <path d="M12 33l12-9 8 2 2 10M12 34h-1" />
        </>
      )
    case 'kick':
      return (
        <>
          <circle cx="16" cy="8" r="3.2" />
          <path d="M16 12l1 12-3 14M17 24l18-6M16 15l-5 6M16 15l6 3" />
        </>
      )
    case 'pushup':
      return (
        <>
          <circle cx="11" cy="25" r="3.2" />
          <path d="M14 27 38 31M16 28l-3 4 3 4M38 31l4 5" />
        </>
      )
    case 'dip':
      return (
        <>
          <path d="M6 24h12M8 24v14" strokeWidth="2" opacity="0.4" />
          <circle cx="22" cy="12" r="3.2" />
          <path d="M22 16v12h10l2 10M22 18l-6 6" />
        </>
      )
    case 'punch':
      return (
        <>
          <circle cx="18" cy="8" r="3.2" />
          <path d="M18 12v12l-5 14M18 24l6 14M18 15l16 0M18 16l-4 6 5 1" />
          <circle cx="36" cy="15" r="2" fill="currentColor" />
        </>
      )
  }
}

export function Pictogram({ pose, category, size = 48 }: { pose: Pose; category: Category; size?: number }) {
  const colors: Record<Category, string> = { core: '#2563eb', legs: '#16a34a', arms: '#f59e0b' }
  const softs: Record<Category, string> = { core: '#eaf1fe', legs: '#e8f7ee', arms: '#fff4e0' }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-2xl"
      style={{ width: size, height: size, backgroundColor: softs[category], color: colors[category] }}
      aria-hidden
    >
      <svg viewBox="0 0 48 48" width={size * 0.82} height={size * 0.82} fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
        <Figure pose={pose} />
      </svg>
    </span>
  )
}

export function CategoryArt({ category, size = 56 }: { category: Category; size?: number }) {
  const pose: Record<Category, Pose> = { core: 'crunch', legs: 'squat', arms: 'pushup' }
  return <Pictogram pose={pose[category]} category={category} size={size} />
}
