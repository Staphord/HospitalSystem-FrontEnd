import { Navigate, Outlet } from 'react-router-dom'
import { usePermissions } from '@/hooks/usePermissions'
import type { Role } from '@/lib/roles'

interface RoleRouteProps {
  allowed: (Role | string)[]
}

export function RoleRoute({ allowed }: RoleRouteProps) {
  const { hasAnyRole } = usePermissions()

  if (!hasAnyRole(allowed)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
