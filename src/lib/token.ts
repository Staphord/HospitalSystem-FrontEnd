import { jwtDecode } from 'jwt-decode'

interface JwtPayload {
  exp?: number
  tenant_id?: string
  role?: string
  scope?: string
  impersonator?: boolean
  realm_access?: { roles?: string[] }
}

export function decodeToken(token: string): JwtPayload {
  return jwtDecode<JwtPayload>(token)
}

/**
 * Supports both JWT formats:
 * - Microservices: single `role` claim
 * - Monolith/Keycloak: `realm_access.roles` array
 */
export function getRolesFromToken(token: string): string[] {
  const payload = decodeToken(token)

  if (payload.realm_access?.roles?.length) {
    return payload.realm_access.roles
  }

  if (payload.role) {
    return [payload.role]
  }

  return []
}

export function getTenantIdFromToken(token: string): string | null {
  const payload = decodeToken(token)
  return payload.tenant_id ?? null
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token)
  if (!payload.exp) return true
  return Date.now() >= payload.exp * 1000
}

export function isReadOnlyToken(token: string): boolean {
  const payload = decodeToken(token)
  return payload.scope === 'readonly'
}

export function isImpersonationToken(token: string): boolean {
  const payload = decodeToken(token)
  return payload.impersonator === true
}
