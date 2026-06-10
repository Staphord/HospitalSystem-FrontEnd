import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  getRolesFromToken,
  getTenantIdFromToken,
  isImpersonationToken,
  isReadOnlyToken,
} from '@/lib/token'

export interface AuthUser {
  keycloak_sub: string
  username: string
  email: string
  full_name?: string | null
  role?: string
  hospital_id?: string | null
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  roles: string[]
  tenantId: string | null
  isImpersonating: boolean
  isReadOnly: boolean
  setTokens: (accessToken: string, refreshToken: string) => void
  setUser: (user: AuthUser) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      roles: [],
      tenantId: null,
      isImpersonating: false,
      isReadOnly: false,

      setTokens: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
          roles: getRolesFromToken(accessToken),
          tenantId: getTenantIdFromToken(accessToken),
          isImpersonating: isImpersonationToken(accessToken),
          isReadOnly: isReadOnlyToken(accessToken),
        }),

      setUser: (user) => set({ user }),

      clearAuth: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          roles: [],
          tenantId: null,
          isImpersonating: false,
          isReadOnly: false,
        }),
    }),
    {
      name: 'hospital-flow-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
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
