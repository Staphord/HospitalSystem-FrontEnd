export function getLaboratoryNavIcon(label: string): string {
  switch (label) {
    case 'My Dashboard':
      return 'dashboard'
    case 'Test Requests':
      return 'biotech'
    case 'Results Entry':
      return 'assignment'
    case 'Specimen Tracking':
      return 'inventory_2'
    default:
      return 'description'
  }
}

export function getLaboratoryPageTitle(path: string): string {
  const p = path.toLowerCase()
  if (p === '/dashboard' || p.endsWith('/dashboard')) return 'My Dashboard'
  if (p.includes('/laboratory/requests')) return 'Test Requests'
  if (p.includes('/laboratory/results')) return 'Results Entry'
  if (p.includes('/laboratory/specimens')) return 'Specimen Tracking'
  if (p.includes('/notifications')) return 'Notifications'
  if (p.includes('/profile')) return 'My Profile'
  return 'My Dashboard'
}

export function isLaboratoryNavItemActive(navPath: string, pathname: string): boolean {
  const p = pathname.toLowerCase()

  if (navPath === '/dashboard') {
    return p === '/dashboard' || p.endsWith('/dashboard')
  }
  if (navPath === '/laboratory/requests') {
    return p.includes('/laboratory/requests')
  }
  if (navPath === '/laboratory/results') {
    return p.includes('/laboratory/results')
  }
  if (navPath === '/laboratory/specimens') {
    return p.includes('/laboratory/specimens')
  }

  return pathname === navPath || pathname.startsWith(`${navPath}/`)
}
