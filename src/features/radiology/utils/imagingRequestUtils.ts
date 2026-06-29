import type {
  ImagingModality,
  ImagingRequest,
  ImagingRequestAction,
  ImagingRequestStatus,
} from '@/features/radiology/types/radiology'

export type ImagingRequestSecondaryAction =
  | 'enter-report'
  | 'schedule'
  | 'view-record'
  | 'reschedule'
  | 'put-on-hold'
  | 'cancel-request'
  | 'cancel-appointment'
  | 'amend-report'
  | 'print-report'

export interface SecondaryActionItem {
  action: ImagingRequestSecondaryAction
  label: string
  icon: string
  /** Bold + primary color — the most common action for this status */
  primary?: boolean
  danger?: boolean
}

const MENU_ACTIONS: Record<ImagingRequestStatus, SecondaryActionItem[]> = {
  requested: [
    { action: 'enter-report', label: 'Enter Report', icon: 'edit_note', primary: true },
    { action: 'schedule', label: 'Schedule', icon: 'calendar_month' },
    { action: 'cancel-request', label: 'Cancel Request', icon: 'cancel', danger: true },
  ],
  scheduled: [
    { action: 'enter-report', label: 'Enter Report', icon: 'edit_note', primary: true },
    { action: 'reschedule', label: 'Reschedule', icon: 'event_repeat' },
    { action: 'put-on-hold', label: 'Put On Hold', icon: 'pause_circle' },
    { action: 'cancel-appointment', label: 'Cancel', icon: 'cancel', danger: true },
  ],
  'in-progress': [
    { action: 'enter-report', label: 'Enter Report', icon: 'edit_note', primary: true },
    { action: 'put-on-hold', label: 'Put On Hold', icon: 'pause_circle' },
    { action: 'cancel-appointment', label: 'Cancel', icon: 'cancel', danger: true },
  ],
  complete: [
    { action: 'view-record', label: 'View Record', icon: 'visibility' },
    { action: 'amend-report', label: 'Amend Report', icon: 'edit_note' },
    { action: 'print-report', label: 'Print / Download', icon: 'print' },
  ],
}

export function getMenuActions(request: ImagingRequest): SecondaryActionItem[] {
  return MENU_ACTIONS[request.status] ?? []
}

/** @deprecated kept for any remaining call sites; use getMenuActions instead */
export function getSecondaryActions(request: ImagingRequest): SecondaryActionItem[] {
  return getMenuActions(request)
}

export const MODALITY_LABELS: Record<ImagingModality, string> = {
  'x-ray': 'X-Ray',
  'ct-scan': 'CT Scan',
  mri: 'MRI',
  ultrasound: 'Ultrasound',
}

export const MODALITY_BADGE_CLASS: Record<ImagingModality, string> = {
  'x-ray': 'bg-primary/10 text-primary',
  'ct-scan': 'bg-[#6554C0]/10 text-[#6554C0]',
  mri: 'bg-secondary/10 text-secondary',
  ultrasound: 'bg-info/10 text-info',
}

export const STATUS_LABELS: Record<ImagingRequestStatus, string> = {
  requested: 'Requested',
  scheduled: 'Scheduled',
  'in-progress': 'In Progress',
  complete: 'Complete',
}

export const STATUS_BADGE_CLASS: Record<ImagingRequestStatus, string> = {
  requested: 'bg-warning/10 text-warning border-warning/20',
  scheduled: 'bg-info/10 text-info border-info/20',
  'in-progress': 'bg-primary/10 text-primary border-primary/20',
  complete: 'bg-success/10 text-success border-success/20',
}

export function getImagingRequestAction(request: ImagingRequest): ImagingRequestAction {
  switch (request.status) {
    case 'scheduled':
      return 'start'
    case 'requested':
      return 'schedule'
    case 'in-progress':
      return 'enter-report'
    case 'complete':
      return 'view-record'
    default:
      return 'schedule'
  }
}

export function getImagingRequestActionLabel(action: ImagingRequestAction): string {
  switch (action) {
    case 'start':
      return 'Start'
    case 'schedule':
      return 'Schedule'
    case 'enter-report':
      return 'Enter Report'
    case 'view-record':
      return 'View Record'
    default:
      return 'Schedule'
  }
}

export function getImagingRequestActionButtonClass(action: ImagingRequestAction): string {
  if (action === 'start') {
    return 'bg-primary-container text-white hover:bg-primary border-0'
  }
  return 'border border-border-subtle text-secondary hover:bg-surface-white bg-transparent'
}

export function matchesModalityFilter(
  modality: ImagingModality,
  filter: ImagingModality | 'all',
): boolean {
  if (filter === 'all') return true
  return modality === filter
}

export function matchesStatusFilter(
  status: ImagingRequestStatus,
  filter: ImagingRequestStatus | 'all',
): boolean {
  if (filter === 'all') return true
  return status === filter
}

export function matchesSearchQuery(request: ImagingRequest, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  return (
    request.patientName.toLowerCase().includes(q) ||
    request.patientNumber.toLowerCase().includes(q) ||
    MODALITY_LABELS[request.modality].toLowerCase().includes(q) ||
    request.bodyPart.toLowerCase().includes(q) ||
    request.clinicalIndication.toLowerCase().includes(q) ||
    request.requestedBy.toLowerCase().includes(q)
  )
}
