import type {
  SpecimenRejectionReason,
  SpecimenStatus,
  SpecimenSummary,
  SpecimenTrackingStatus,
  TrackedSpecimen,
} from '@/features/laboratory/types/laboratory'

export const SPECIMEN_TRACKING_STATUS_LABEL: Record<SpecimenTrackingStatus, string> = {
  not_collected: 'Not Collected',
  collected: 'Collected',
  in_lab: 'In Lab',
  processing: 'Processing',
  complete: 'Complete',
  rejected: 'Rejected',
}

export const SPECIMEN_STATUS_PILL_CLASS: Record<SpecimenTrackingStatus, string> = {
  not_collected: 'bg-warning/10 text-[#CC8900]',
  collected: 'bg-[#00B8D9]/10 text-[#008DA6]',
  in_lab: 'bg-primary/10 text-primary',
  processing: 'bg-secondary/10 text-secondary',
  complete: 'bg-success/10 text-[#2D9468]',
  rejected: 'bg-error/10 text-error',
}

export const REJECTION_REASON_LABEL: Record<SpecimenRejectionReason, string> = {
  insufficient_volume: 'Insufficient Volume',
  improper_labeling: 'Improper Labeling',
  contaminated: 'Contaminated Specimen',
  container_leaking: 'Container Leaking',
}

export const REJECTION_REASONS: SpecimenRejectionReason[] = [
  'insufficient_volume',
  'improper_labeling',
  'contaminated',
  'container_leaking',
]

/** Maps detailed specimen status → simple status on Test Requests. */
export function deriveRequestSpecimenStatus(status: SpecimenTrackingStatus): SpecimenStatus {
  if (status === 'not_collected' || status === 'rejected') return 'not_collected'
  return 'collected'
}

export function computeSpecimenSummary(specimens: TrackedSpecimen[]): SpecimenSummary {
  return {
    awaitingCollection: specimens.filter(
      (s) => s.status === 'not_collected' || s.status === 'rejected',
    ).length,
    collected: specimens.filter((s) => s.status === 'collected').length,
    inProcessing: specimens.filter((s) => s.status === 'in_lab' || s.status === 'processing').length,
    completedToday: specimens.filter((s) => s.status === 'complete').length,
  }
}

export function isSpecimenRejected(specimen: TrackedSpecimen): boolean {
  return specimen.status === 'rejected'
}
