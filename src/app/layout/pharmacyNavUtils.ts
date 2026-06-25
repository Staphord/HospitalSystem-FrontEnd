export function getPharmacyNavIcon(label: string): string {
  switch (label) {
    case 'Dashboard':
    case 'My Dashboard':
      return 'dashboard'
    case 'Prescription Queue':
      return 'clinical_notes'
    case 'Stock Management':
      return 'inventory_2'
    default:
      return 'description'
  }
}

export function getPharmacyNavLabel(label: string): string {
  if (label === 'Dashboard') return 'My Dashboard'
  return label
}

export function getPharmacyPageTitle(path: string): string {
  const p = path.toLowerCase()
  if (p === '/dashboard' || p.endsWith('/dashboard')) return 'My Dashboard'
  if (/\/pharmacy\/queue\/[^/]+\/dispense/.test(p)) return 'Dispense'
  if (p.includes('/pharmacy/queue')) return 'Prescription Queue'
  if (p.includes('/pharmacy/stock')) return 'Stock Management'
  if (p.includes('/notifications')) return 'Notifications'
  if (p.includes('/profile')) return 'My Profile'
  return 'My Dashboard'
}

export function isPharmacyNavItemActive(navPath: string, pathname: string): boolean {
  const p = pathname.toLowerCase()

  if (navPath === '/dashboard') {
    return p === '/dashboard' || p.endsWith('/dashboard')
  }
  if (navPath === '/pharmacy/queue') {
    return p.includes('/pharmacy/queue')
  }
  if (navPath === '/pharmacy/stock') {
    return p.includes('/pharmacy/stock')
  }

  return pathname === navPath || pathname.startsWith(`${navPath}/`)
}
