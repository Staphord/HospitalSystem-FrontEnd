import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const {
    accessToken,
    refreshToken,
    user,
    roles,
    tenantId,
    isImpersonating,
    isReadOnly,
    setTokens,
    setUser,
    clearAuth,
  } = useAuthStore()

  return {
    isAuthenticated: Boolean(accessToken),
    accessToken,
    refreshToken,
    user,
    roles,
    tenantId,
    isImpersonating,
    isReadOnly,
    setTokens,
    setUser,
    clearAuth,
  }
}
