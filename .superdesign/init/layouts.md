# Layout Components

## SiteLayout.tsx — Public marketing pages shell
Path: seishin-app/src/components/layout/SiteLayout.tsx

```tsx
import { Outlet } from 'react-router-dom'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

export function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f4f7fa]">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
```

## SiteHeader.tsx — Marketing nav
Path: seishin-app/src/components/layout/SiteHeader.tsx

Sticky header with BrandMark, nav links (Главная, Родителям, Тренерам), Войти button. Mobile: horizontal scroll nav below header.

## SiteFooter.tsx — Marketing footer
Path: seishin-app/src/components/layout/SiteFooter.tsx

Dark gradient footer with BrandMark, section links, contact info.

## ParentAppLayout.tsx — Parent authenticated shell
Path: seishin-app/src/layouts/ParentAppLayout.tsx

Desktop: sidebar with child list + mobile phone frame (max 430px) for content. Header with BrandMark parent variant, logout. Wraps Outlet in elevated card on desktop.

## ParentPageShell.tsx — Mobile page wrapper inside parent app
Path: seishin-app/src/components/parent/ParentPageShell.tsx

```tsx
import type { ReactNode } from 'react'
import { ParentBottomNav } from './ParentBottomNav'

type ParentPageShellProps = {
  title: string
  children: ReactNode
  headerRight?: ReactNode
}

export function ParentPageShell({ title, children, headerRight }: ParentPageShellProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface-muted">
      <header className="shrink-0 border-b border-border-light bg-surface px-5 pb-4 pt-5">
        <div className="flex items-center gap-3">
          <h1 className="flex-1 text-xl font-bold tracking-tight text-text">{title}</h1>
          {headerRight}
        </div>
      </header>

      <div className="parent-scroll">{children}</div>

      <ParentBottomNav />
    </div>
  )
}
```

## ParentBottomNav.tsx — Parent mobile bottom navigation
Path: seishin-app/src/components/parent/ParentBottomNav.tsx

4 tabs: Главная (/app), Профиль, Награды, Архив. SVG icons from /assets/parent/. Active state: green text + green-light icon background.

## CoachLayout.tsx — Coach dashboard shell
Path: seishin-app/src/layouts/CoachLayout.tsx

Dark sidebar (CoachSidebar) + main content area. Mobile: CoachMobileNav bottom bar.
