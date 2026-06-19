export function getReceptionNavIcon(label: string): string {
  switch (label) {
    case 'Dashboard':
      return 'dashboard'
    case 'Register Patient':
      return 'person_add'
    case 'Patient Search':
      return 'person_search'
    case 'Queue Management':
      return 'group'
    case 'Billing':
      return 'payments'
    default:
      return 'description'
  }
}

export function getReceptionNavLabel(label: string): string {
  if (label === 'Dashboard') return 'My Dashboard'
  if (label === 'Billing') return 'Payment & Insurance'
  return label
}
