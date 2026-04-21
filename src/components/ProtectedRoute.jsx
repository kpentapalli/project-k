import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute({ children, requireAdmin = false }) {
  const { session, profile, isAdmin, intakeCompleted, loading } = useAuth()

  if (loading) return <div className="loading-screen">Loading...</div>
  if (!session) return <Navigate to="/login" replace />
  if (requireAdmin && !isAdmin) return <Navigate to="/dashboard" replace />

  // Redirect new users to intake before anything else
  if (!isAdmin && !intakeCompleted && window.location.pathname !== '/intake') {
    return <Navigate to="/intake" replace />
  }

  return children
}
