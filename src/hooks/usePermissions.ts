import { useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ROLES, collectUserRoles, normalizeRole, type Role } from '@/lib/roles'

export function usePermissions() {
  const { roles, user } = useAuth()

  const effectiveRoles = useMemo(
    () => collectUserRoles(roles, user?.role),
    [roles, user?.role],
  )

  const hasRole = (role: Role | string) => effectiveRoles.includes(normalizeRole(role))

  const hasAnyRole = (required: (Role | string)[]) =>
    required.some((role) => effectiveRoles.includes(normalizeRole(role)))

  const isSuperAdmin = () => hasRole(ROLES.superAdmin)
  const isHospitalAdmin = () => hasRole(ROLES.hospitalAdmin)

  return { hasRole, hasAnyRole, isSuperAdmin, isHospitalAdmin, roles: effectiveRoles }
}
