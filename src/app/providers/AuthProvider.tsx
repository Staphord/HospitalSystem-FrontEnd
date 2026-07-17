import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '@/store/authStore'
import { usersService } from '@/api/services/users'
import { isTokenExpired } from '@/lib/token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const setUser = useAuthStore((s) => s.setUser)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  useEffect(() => {
    if (!accessToken) return

    const rToken = useAuthStore.getState().refreshToken
    if (rToken && isTokenExpired(rToken)) {
      clearAuth()
      return
    }

    usersService
      .getMe()
      .then(setUser)
      .catch((err) => {
        // Clear auth only when the server explicitly rejects the token
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 401) {
          clearAuth()
        }
      })
  }, [accessToken, setUser, clearAuth])

  return <>{children}</>
}
