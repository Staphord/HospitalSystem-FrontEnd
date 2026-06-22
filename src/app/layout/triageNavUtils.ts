export function getTriageNavIcon(label: string): string {
  switch (label) {
    case 'Dashboard':
      return 'dashboard'
    case 'Triage':
      return 'queue'
    case 'Patient History':
      return 'history'
    default:
      return 'description'
  }
}

export function getTriageNavLabel(label: string): string {
  if (label === 'Dashboard') return 'My Dashboard'
  if (label === 'Triage') return 'Triage Queue'
  return label
}

export function getTriagePageTitle(path: string): string {
  const p = path.toLowerCase()
  if (p === '/dashboard' || p.endsWith('/dashboard')) return 'My Dashboard'
  if (p.includes('/triage/queue')) return 'Triage Queue'
  if (p.includes('/triage/history')) return 'Patient History'
  // /triage/history/:patientId is also covered by the above includes check
  if (p.includes('/triage/assess')) return 'Triage Assessment'
  if (p.includes('/notifications')) return 'Notifications'
  if (p.includes('/profile')) return 'My Profile'
  return 'My Dashboard'
}

/** Assessment is part of the triage queue workflow — keep queue nav highlighted. */
export function isTriageNavItemActive(navPath: string, pathname: string): boolean {
  const p = pathname.toLowerCase()

  if (navPath === '/triage/queue') {
    return p.includes('/triage/queue') || p.includes('/triage/assess')
  }
  if (navPath === '/dashboard') {
    return p === '/dashboard' || p.endsWith('/dashboard')
  }
  if (navPath === '/triage/history') {
    return p.includes('/triage/history')   // covers /triage/history and /triage/history/:patientId
  }

  return pathname === navPath || pathname.startsWith(`${navPath}/`)
}
