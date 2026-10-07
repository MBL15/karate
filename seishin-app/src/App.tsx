import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { SiteLayout } from './components/layout/SiteLayout'
import { CoachLayout } from './layouts/CoachLayout'
import { ParentAppLayout } from './layouts/ParentAppLayout'
import { Achievements } from './pages/Achievements'
import { ChildProfile } from './pages/ChildProfile'
import { CoachAttendancePage } from './pages/coach/CoachAttendancePage'
import { CoachAwardsPage } from './pages/coach/CoachAwardsPage'
import { CoachChatPage } from './pages/coach/CoachChatPage'
import { CoachCompetitionsPage } from './pages/coach/CoachCompetitionsPage'
import { CoachSchedulePage } from './pages/coach/CoachSchedulePage'
import { CoachSecretPage } from './pages/coach/CoachSecretPage'
import { CoachStudentsPage } from './pages/coach/CoachStudentsPage'
import { CoachToolsPage } from './pages/coach/CoachToolsPage'
import { CoachDashboard } from './pages/CoachDashboard'
import { CompetitionInvite } from './pages/CompetitionInvite'
import { ForCoachesPage } from './pages/ForCoachesPage'
import { ForParentsPage } from './pages/ForParentsPage'
import { HistoryDocuments } from './pages/HistoryDocuments'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { ParentChatPage } from './pages/ParentChatPage'
import { ParentHome } from './pages/ParentHome'
import { ParentSecretPage } from './pages/ParentSecretPage'

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="for-parents" element={<ForParentsPage />} />
        <Route path="for-coaches" element={<ForCoachesPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<LoginPage />} />
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
        <Route path="schedule" element={<CoachSchedulePage />} />
        <Route path="awards" element={<CoachAwardsPage />} />
        <Route path="competitions" element={<CoachCompetitionsPage />} />
        <Route path="chat" element={<CoachChatPage />} />
        <Route path="secret" element={<CoachSecretPage />} />
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
        <Route path="achievements" element={<Achievements />} />
        <Route path="competition" element={<CompetitionInvite />} />
        <Route path="history" element={<HistoryDocuments />} />
        <Route path="chat" element={<ParentChatPage />} />
        <Route path="secret" element={<ParentSecretPage />} />
      </Route>

      <Route path="/parent" element={<Navigate to="/app" replace />} />
      <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
      <Route path="/achievements" element={<Navigate to="/app/achievements" replace />} />
      <Route path="/competition" element={<Navigate to="/app/competition" replace />} />
      <Route path="/history" element={<Navigate to="/app/history" replace />} />
    </Routes>
  )
}
