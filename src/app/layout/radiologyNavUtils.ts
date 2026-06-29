export function getRadiologyNavIcon(label: string): string {
  switch (label) {
    case 'My Dashboard':
      return 'dashboard'
    case 'Imaging Requests':
      return 'medical_services'
    case 'Imaging Schedule':
      return 'calendar_month'
    default:
      return 'description'
  }
}

export function getRadiologyPageTitle(path: string): string {
  const p = path.toLowerCase()
  if (p === '/dashboard' || p.endsWith('/dashboard')) return 'My Dashboard'
  if (/\/radiology\/requests\/[^/]+\/report/.test(p)) return 'Imaging Report'
  if (p.includes('/radiology/requests')) return 'Imaging Requests'
  if (p.includes('/radiology/schedule')) return 'Imaging Schedule'
  if (p.includes('/notifications')) return 'Notifications'
  if (p.includes('/profile')) return 'My Profile'
  return 'My Dashboard'
}

export function isRadiologyNavItemActive(navPath: string, pathname: string): boolean {
  const p = pathname.toLowerCase()

  if (navPath === '/dashboard') {
    return p === '/dashboard' || p.endsWith('/dashboard')
  }
  if (navPath === '/radiology/requests') {
    return p.includes('/radiology/requests')
  }
  if (navPath === '/radiology/schedule') {
    return p.includes('/radiology/schedule')
  }

  return pathname === navPath || pathname.startsWith(`${navPath}/`)
}
