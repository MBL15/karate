import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { SiteLayout } from './components/layout/SiteLayout'
import { CoachLayout } from './layouts/CoachLayout'
import { ParentAppLayout } from './layouts/ParentAppLayout'
import { ChildProfile } from './pages/ChildProfile'
import { CoachAttendancePage } from './pages/coach/CoachAttendancePage'
import { CoachAwardsPage } from './pages/coach/CoachAwardsPage'
import { CoachCompetitionsPage } from './pages/coach/CoachCompetitionsPage'
import { CoachSchedulePage } from './pages/coach/CoachSchedulePage'
import { CoachSecretPage } from './pages/coach/CoachSecretPage'
import { CoachStudentsPage } from './pages/coach/CoachStudentsPage'
import { CoachToolsPage } from './pages/coach/CoachToolsPage'
import { AnalyticsTool } from './pages/coach/tools/AnalyticsTool'
import { ChecklistsTool } from './pages/coach/tools/ChecklistsTool'
import { ClubTool } from './pages/coach/tools/ClubTool'
import { DocumentsTool } from './pages/coach/tools/DocumentsTool'
import { FitnessTool } from './pages/coach/tools/FitnessTool'
import { PlansTool } from './pages/coach/tools/PlansTool'
import { TimerTool } from './pages/coach/tools/TimerTool'
import { CoachDashboard } from './pages/CoachDashboard'
import { CompetitionInvite } from './pages/CompetitionInvite'
import { DocumentPage } from './pages/DocumentPage'
import { ForCoachesPage } from './pages/ForCoachesPage'
import { ForParentsPage } from './pages/ForParentsPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ParentAthlete } from './pages/ParentAthlete'
import { ParentPayments } from './pages/ParentPayments'
import { ParentHome } from './pages/ParentHome'
import { ParentSecretPage } from './pages/ParentSecretPage'
import { RegisterWizard } from './pages/RegisterWizard'

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="for-parents" element={<ForParentsPage />} />
        <Route path="for-coaches" element={<ForCoachesPage />} />
        <Route path="docs/:id" element={<DocumentPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterWizard />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route
        path="/coach"
        element={
          <ProtectedRoute role="COACH">
            <CoachLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CoachDashboard />} />
        <Route path="attendance" element={<CoachAttendancePage />} />
        <Route path="students" element={<CoachStudentsPage />} />
        <Route path="tools" element={<CoachToolsPage />} />
        <Route path="tools/timer" element={<TimerTool />} />
        <Route path="tools/plans" element={<PlansTool />} />
        <Route path="tools/analytics" element={<AnalyticsTool />} />
        <Route path="tools/checklists" element={<ChecklistsTool />} />
        <Route path="tools/club" element={<ClubTool />} />
        <Route path="tools/documents" element={<DocumentsTool />} />
        <Route path="tools/fitness" element={<FitnessTool />} />
        <Route path="schedule" element={<CoachSchedulePage />} />
        <Route path="awards" element={<CoachAwardsPage />} />
        <Route path="competitions" element={<CoachCompetitionsPage />} />
        <Route path="chat" element={<Navigate to="/coach" replace />} />
        <Route path="secret" element={<CoachSecretPage />} />
        <Route path="*" element={<Navigate to="/coach" replace />} />
      </Route>

      <Route
        path="/app"
        element={
          <ProtectedRoute role="PARENT">
            <ParentAppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ParentHome />} />
        <Route path="profile" element={<ChildProfile />} />
        <Route path="athlete" element={<ParentAthlete />} />
        <Route path="achievements" element={<Navigate to="/app/athlete?tab=achievements" replace />} />
        <Route path="competition" element={<CompetitionInvite />} />
        <Route path="payments" element={<ParentPayments />} />
        <Route path="history" element={<Navigate to="/app/payments" replace />} />
        <Route path="chat" element={<Navigate to="/app" replace />} />
        <Route path="secret" element={<ParentSecretPage />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Route>

      <Route path="/parent" element={<Navigate to="/app" replace />} />
      <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
      <Route path="/achievements" element={<Navigate to="/app/athlete?tab=achievements" replace />} />
      <Route path="/competition" element={<Navigate to="/app/competition" replace />} />
      <Route path="/history" element={<Navigate to="/app/payments" replace />} />
    </Routes>
  )
}
