import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

const HOSPITAL_MANAGEMENT_SYSTEM = 'Hospital Management System'
const HOSPITAL_MANAGEMENT_PLATFORM = 'Hospital Management Platform'
const DEFAULT_FAVICON = '/favicon.png'

export function DocumentTitleProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const roles = useAuthStore((s) => s.roles)
  const isImpersonating = useAuthStore((s) => s.isImpersonating)

  useEffect(() => {
    const isSuperAdmin = roles.includes('super_admin')
    const hospitalName = user?.hospital_name?.trim()
    const logoUrl = user?.logo_url?.trim()

    // 1. Update Title
    if (isSuperAdmin && !isImpersonating) {
      document.title = HOSPITAL_MANAGEMENT_PLATFORM
    } else if (hospitalName) {
      document.title = `${hospitalName} | ${HOSPITAL_MANAGEMENT_SYSTEM}`
    } else {
      document.title = HOSPITAL_MANAGEMENT_SYSTEM
    }

    // 2. Update Favicon
    let faviconLink = document.querySelector<HTMLLinkElement>("link[rel*='icon']")
    if (!faviconLink) {
      faviconLink = document.createElement('link')
      faviconLink.rel = 'icon'
      document.getElementsByTagName('head')[0].appendChild(faviconLink)
    }

    const showHospitalLogo = (!isSuperAdmin || isImpersonating) && !!logoUrl
    faviconLink.href = showHospitalLogo ? logoUrl! : DEFAULT_FAVICON
  }, [user, roles, isImpersonating])

  return <>{children}</>
}
