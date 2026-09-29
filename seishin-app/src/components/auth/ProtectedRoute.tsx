import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { UserRole } from '../../api/types'

type ProtectedRouteProps = {
  role: UserRole
  children: ReactNode
}

export function ProtectedRoute({ role, children }: ProtectedRouteProps) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user.role !== role) {
    return <Navigate to={user.role === 'COACH' ? '/coach' : '/app'} replace />
  }

  return children
}
