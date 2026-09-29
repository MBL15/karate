# Page Dependency Trees

## /app — ParentHome (Parent Diary)
Entry: seishin-app/src/pages/ParentHome.tsx
Dependencies:
- seishin-app/src/components/parent/ChildSwitcher.tsx
- seishin-app/src/components/parent/ParentPageShell.tsx
  - seishin-app/src/components/parent/ParentBottomNav.tsx
- seishin-app/src/components/parent/ParentScreenState.tsx
- seishin-app/src/components/ui/ProgressBar.tsx

## / — LandingPage
Entry: seishin-app/src/pages/LandingPage.tsx
Dependencies: (self-contained, uses react-router Link only)

## /login — LoginPage
Entry: seishin-app/src/pages/LoginPage.tsx
Dependencies:
- seishin-app/src/components/ui/BrandMark.tsx

## /coach — CoachDashboard
Entry: seishin-app/src/pages/CoachDashboard.tsx
Dependencies:
- seishin-app/src/components/ui/StatCard.tsx
- seishin-app/src/components/ui/PageHeader.tsx
- seishin-app/src/layouts/CoachLayout.tsx
  - seishin-app/src/components/coach/CoachSidebar.tsx
  - seishin-app/src/components/coach/CoachMobileNav.tsx

## /app/profile — ChildProfile
Entry: seishin-app/src/pages/ChildProfile.tsx
Dependencies:
- seishin-app/src/components/parent/ParentPageShell.tsx
- seishin-app/src/components/parent/ChildSwitcher.tsx
- seishin-app/src/components/ui/ProgressBar.tsx

## /app/achievements — Achievements
Entry: seishin-app/src/pages/Achievements.tsx
Dependencies:
- seishin-app/src/components/parent/ParentPageShell.tsx
- seishin-app/src/components/ui/EmptyState.tsx

## /for-parents — ForParentsPage
Entry: seishin-app/src/pages/ForParentsPage.tsx
Dependencies: SiteLayout (via route), marketing components

## /for-coaches — ForCoachesPage
Entry: seishin-app/src/pages/ForCoachesPage.tsx
Dependencies: SiteLayout (via route), marketing components
