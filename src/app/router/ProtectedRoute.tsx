import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { SessionTimeoutHandler } from '@/app/providers/SessionTimeoutHandler'
import { SimultaneousSessionWarningModal } from '@/app/providers/SimultaneousSessionWarningModal'

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    const isMasterPath = location.pathname.startsWith('/master')
    return <Navigate to={isMasterPath ? "/master/login" : "/login"} replace />
  }

  return (
    <SessionTimeoutHandler>
      <SimultaneousSessionWarningModal>
        <Outlet />
      </SimultaneousSessionWarningModal>
    </SessionTimeoutHandler>
  )
}
