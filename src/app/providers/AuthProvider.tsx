import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '@/store/authStore'
import { usersService } from '@/api/services/users'
import { adminService } from '@/api/services/admin'
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

    const storedProfile = JSON.parse(localStorage.getItem('hospital_profile') || '{}')
    const roles = useAuthStore.getState().roles || []
    const isSuperAdmin = roles.includes('super_admin')
    const isImpersonating = useAuthStore.getState().isImpersonating

    usersService
      .getMe()
      .then((u) => {
        const isUserSuperAdmin = isSuperAdmin || u.role === 'super_admin'
        const mergedUser = {
          ...u,
          hospital_name: isUserSuperAdmin && !isImpersonating ? null : (u.hospital_name || storedProfile.hospital_name || null),
          logo_url: isUserSuperAdmin && !isImpersonating ? null : ((u as any).logo_url || storedProfile.logo_url || null),
        }
        setUser(mergedUser)

        const isHospitalAdmin = roles.includes('hospital_admin') || u.role === 'hospital_admin'
        if (isUserSuperAdmin && !isImpersonating) {
          return
        }

        if (!isHospitalAdmin) {
          return
        }

        adminService
          .getHospitalProfile()
          .then((hp) => {
            if (hp.hospital_name || hp.logo_url) {
              const profileData = {
                hospital_name: hp.hospital_name || null,
                logo_url: hp.logo_url || null,
              }
              localStorage.setItem('hospital_profile', JSON.stringify(profileData))
              useAuthStore.setState((state) => ({
                user: state.user
                  ? {
                      ...state.user,
                      hospital_name: hp.hospital_name || state.user.hospital_name || null,
                      logo_url: hp.logo_url || state.user.logo_url || null,
                    }
                  : null,
              }))
            }
          })
          .catch(() => {
            // Fallback to getSettings if admin user
            adminService.getSettings()
              .then((st) => {
                if (st.hospital_name || st.logo_url) {
                  const updatedProfile = {
                    hospital_name: st.hospital_name || storedProfile.hospital_name || null,
                    logo_url: st.logo_url || storedProfile.logo_url || null,
                  }
                  localStorage.setItem('hospital_profile', JSON.stringify(updatedProfile))
                  useAuthStore.setState((state) => ({
                    user: state.user
                      ? {
                          ...state.user,
                          hospital_name: st.hospital_name || state.user.hospital_name || null,
                          logo_url: st.logo_url || state.user.logo_url || null,
                        }
                      : null,
                  }))
                }
              })
              .catch(() => {})
          })
      })
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
