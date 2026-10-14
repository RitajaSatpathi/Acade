import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingPage } from '../components/Loading'

export default function ProtectedRoute({ children, roles }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading || (user && !profile)) {
    return <LoadingPage message="Loading your dashboard..." />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && !roles.includes(profile.role)) {
    const role = profile.role

    if (['student', 'teacher', 'admin'].includes(role)) {
      return <Navigate to={`/${role}`} replace />
    }

    return <Navigate to="/login" replace />
  }

  return children
}