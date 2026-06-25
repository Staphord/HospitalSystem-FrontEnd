export function getConsultationNavIcon(label: string): string {
  switch (label) {
    case 'Dashboard':
      return 'dashboard'
    case 'Consultation':
      return 'group'
    case 'Inpatient':
      return 'bed'
    case 'Investigation Results':
      return 'lab_research'
    case 'Patient History':
      return 'history'
    case 'My Referrals':
      return 'sync_alt'
    default:
      return 'description'
  }
}

export function getConsultationNavLabel(label: string): string {
  if (label === 'Dashboard') return 'My Dashboard'
  if (label === 'Consultation') return 'Patient Queue'
  return label
}

export function getConsultationPageTitle(path: string): string {
  const p = path.toLowerCase()
  if (p === '/dashboard' || p.endsWith('/dashboard')) return 'My Dashboard'
  if (p.includes('/consultation/queue')) return 'Patient Queue'
  if (p.includes('/consultation/inpatient') && p.includes('/discharge')) return 'Discharge Patient'
  if (p.includes('/consultation/inpatient') && p.includes('/orders')) return 'Inpatient Orders'
  if (p.includes('/consultation/inpatient')) return 'Admitted Patients'
  if (p.includes('/consultation/results')) return 'Investigation Results'
  if (p.includes('/consultation/history')) return 'Patient History'
  if (p.includes('/consultation/referrals')) return 'My Referrals'
  if (p.includes('/consultation/encounter')) return 'Patient Encounter'
  if (p.includes('/notifications')) return 'Notifications'
  if (p.includes('/profile')) return 'My Profile'
  return 'My Dashboard'
}

export function isConsultationNavItemActive(navPath: string, pathname: string): boolean {
  const p = pathname.toLowerCase()

  if (navPath === '/dashboard') {
    return p === '/dashboard' || p.endsWith('/dashboard')
  }
  if (navPath === '/consultation/queue') {
    return p.includes('/consultation/queue') || p.includes('/consultation/encounter')
  }
  if (navPath === '/consultation/inpatient') {
    return p.includes('/consultation/inpatient')
  }
  if (navPath === '/consultation/results') {
    return p.includes('/consultation/results')
  }
  if (navPath === '/consultation/history') {
    return p.includes('/consultation/history')
  }
  if (navPath === '/consultation/referrals') {
    return p.includes('/consultation/referrals')
  }

  return pathname === navPath || pathname.startsWith(`${navPath}/`)
}
