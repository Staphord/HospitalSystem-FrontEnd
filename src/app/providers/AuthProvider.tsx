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

    if (isTokenExpired(accessToken)) {
      clearAuth()
      return
    }

    usersService
      .getMe()
      .then(setUser)
      .catch(() => clearAuth())
  }, [accessToken, setUser, clearAuth])

  return <>{children}</>
}
