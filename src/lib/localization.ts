/**
 * Localization utilities to format dates, times, and currencies
 * dynamically based on tenant-specific settings.
 */

export function formatTenantDate(dateInput: string | Date | null | undefined, dateFormat: string = 'DD/MM/YYYY'): string {
  if (!dateInput) return '-'
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(date.getTime())) return '-'

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  switch (dateFormat) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`
    case 'DD/MM/YYYY':
    default:
      return `${day}/${month}/${year}`
  }
}

export function formatTenantCurrency(amount: number | null | undefined, currency: string = 'USD'): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '-'

  // East African currencies are formatted without decimal places, USD with 2
  const fractionDigits = ['TZS', 'KES', 'UGX'].includes(currency.toUpperCase()) ? 0 : 2

  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })

  return `${currency.toUpperCase()} ${formatted}`
}

export function formatTenantDateTime(dateInput: string | Date | null | undefined, dateFormat: string = 'DD/MM/YYYY', timezone: string = 'UTC'): string {
  if (!dateInput) return '-'
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(date.getTime())) return '-'

  // Format date component
  const dateStr = formatTenantDate(date, dateFormat)

  // Format time component locally/with timezone context
  try {
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone === 'UTC' ? 'UTC' : timezone,
    })
    return `${dateStr} ${timeStr}`
  } catch {
    // Fallback if timezone string is invalid/unsupported
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    return `${dateStr} ${timeStr}`
  }
}

export function formatShortDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—'
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  if (isNaN(date.getTime())) return '—'

  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return `${dateStr}, ${timeStr}`
}

export function formatDoctorName(rawName?: string | null): string {
  if (!rawName || !rawName.trim()) return 'Doctor'
  const trimmed = rawName.trim()

  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return 'Doctor'
  }

  if (!trimmed.includes(' ') && (trimmed.includes('_') || trimmed.includes('.'))) {
    const formatted = trimmed.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    return formatted.toLowerCase().startsWith('dr') ? formatted : `Dr. ${formatted}`
  }

  return trimmed
}



