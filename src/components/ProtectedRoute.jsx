import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingPage } from '../components/Loading'

export default function ProtectedRoute({ children, roles }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingPage message="Loading your dashboard..." />

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />

  if (roles && !roles.includes(profile?.role)) {
    return <Navigate to={`/${profile?.role}`} replace />
  }

  return children
}
