import { useAuth } from '@/hooks/useAuth'
import { ROLES, type Role } from '@/lib/roles'

export function usePermissions() {
  const { roles } = useAuth()

  const hasRole = (role: Role | string) => roles.includes(role)

  const hasAnyRole = (required: (Role | string)[]) =>
    required.some((role) => roles.includes(role))

  const isSuperAdmin = () => hasRole(ROLES.superAdmin)
  const isHospitalAdmin = () => hasRole(ROLES.hospitalAdmin)

  return { hasRole, hasAnyRole, isSuperAdmin, isHospitalAdmin, roles }
}
