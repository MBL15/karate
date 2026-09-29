# Route Map — seishin-app/src/App.tsx

Framework: React 19 + Vite + React Router v7 + Tailwind CSS v4

## Public routes (SiteLayout)
| Path | Component | Description |
|------|-----------|-------------|
| / | LandingPage | Marketing hero, feature cards |
| /for-parents | ForParentsPage | Parent product page |
| /for-coaches | ForCoachesPage | Coach product page |
| /login | LoginPage | Auth form |

## Parent routes (ParentAppLayout, role=PARENT)
| Path | Component | Description |
|------|-----------|-------------|
| /app | ParentHome | Parent diary home — child profile, progress, payments, competitions |
| /app/profile | ChildProfile | Child profile details |
| /app/achievements | Achievements | Awards list |
| /app/competition | CompetitionInvite | Competition RSVP |
| /app/history | HistoryDocuments | Document archive |

## Coach routes (CoachLayout, role=COACH)
| Path | Component | Description |
|------|-----------|-------------|
| /coach | CoachDashboard | Coach home dashboard |
| /coach/students | CoachStudentsPage | Student management |
| /coach/awards | CoachAwardsPage | Award management |
| /coach/competitions | CoachCompetitionsPage | Competition management |

## Redirects
/parent → /app, /profile → /app/profile, etc.
