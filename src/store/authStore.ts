import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  getRolesFromToken,
  getTenantIdFromToken,
  getTokenExpiryMs,
  isImpersonationToken,
  isReadOnlyToken,
} from '@/lib/token'

export type LogoutReason =
  | 'idle_timeout'
  | 'refresh_token_invalid'
  | 'refresh_token_expired'
  | 'session_revoked'
  | 'manual_logout'
  | 'authentication_error'
  | 'department_deactivated'
  | null

export interface AuthUser {
  keycloak_sub: string
  username: string
  email: string
  full_name?: string | null
  role?: string
  hospital_id?: string | null
  hospital_name?: string | null
  logo_url?: string | null
  mfa_enabled?: boolean
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  accessTokenExpiresAt: number | null
  refreshTokenExpiresAt: number | null
  user: AuthUser | null
  roles: string[]
  tenantId: string | null
  isImpersonating: boolean
  isReadOnly: boolean
  lastLogoutReason: LogoutReason
  setTokens: (
    accessToken: string,
    refreshToken: string,
    expiresInSec?: number,
    refreshExpiresInSec?: number,
  ) => void
  setUser: (user: AuthUser) => void
  clearAuth: (reason?: LogoutReason) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      user: null,
      roles: [],
      tenantId: null,
      isImpersonating: false,
      isReadOnly: false,
      lastLogoutReason: null,

      setTokens: (accessToken, refreshToken, expiresInSec, refreshExpiresInSec) => {
        const isImpersonating = isImpersonationToken(accessToken)
        const roles = isImpersonating ? ['hospital_admin'] : getRolesFromToken(accessToken)
        const now = Date.now()
        localStorage.setItem('hf_last_activity', now.toString())
        localStorage.setItem('session_warning_acknowledged', 'true')

        // Compute access token expiry: explicit server duration > JWT exp claim > default 300s
        let accessExpiry = expiresInSec ? now + expiresInSec * 1000 : getTokenExpiryMs(accessToken)
        if (!accessExpiry) {
          accessExpiry = now + 300 * 1000
        }

        // Compute refresh token expiry: explicit server duration > default 1800s
        let refreshExpiry = refreshExpiresInSec ? now + refreshExpiresInSec * 1000 : null
        if (!refreshExpiry) {
          refreshExpiry = now + 1800 * 1000
        }

        set({
          accessToken,
          refreshToken,
          accessTokenExpiresAt: accessExpiry,
          refreshTokenExpiresAt: refreshExpiry,
          roles,
          tenantId: getTenantIdFromToken(accessToken),
          isImpersonating,
          isReadOnly: isReadOnlyToken(accessToken),
          lastLogoutReason: null,
        })
      },

      setUser: (user) => set({ user }),

      clearAuth: (reason = 'manual_logout') => {
        localStorage.removeItem('hf_last_activity')
        localStorage.removeItem('session_warning_acknowledged')
        localStorage.removeItem('impersonated_tenant_id')
        localStorage.removeItem('original_access_token')
        localStorage.removeItem('original_refresh_token')
        localStorage.removeItem('hospital_profile')
        localStorage.removeItem('simulate_simultaneous_session')
        set({
          accessToken: null,
          refreshToken: null,
          accessTokenExpiresAt: null,
          refreshTokenExpiresAt: null,
          user: null,
          roles: [],
          tenantId: null,
          isImpersonating: false,
          isReadOnly: false,
          lastLogoutReason: reason,
        })
      },
    }),
    {
      name: 'hospital-flow-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        accessTokenExpiresAt: state.accessTokenExpiresAt,
        refreshTokenExpiresAt: state.refreshTokenExpiresAt,
        roles: state.roles,
        tenantId: state.tenantId,
        isImpersonating: state.isImpersonating,
        isReadOnly: state.isReadOnly,
      }),
    },
  ),
)

export function getStoredRefreshToken(): string | null {
  return useAuthStore.getState().refreshToken
}
