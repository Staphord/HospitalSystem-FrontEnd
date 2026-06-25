import { MOCK_LAB_REQUESTS } from '@/features/laboratory/data/mockLabRequests'
import type { LabTestRequest, TrackedSpecimen } from '@/features/laboratory/types/laboratory'

const SPECIMEN_OVERRIDES: Partial<Record<string, Partial<TrackedSpecimen>>> = {
  'rq-2': {
    id: 'LAB-2024-093',
    status: 'not_collected',
    location: 'Waiting Area',
    collectedBy: undefined,
    collectedAt: undefined,
    notes: '',
  },
  'rq-3': {
    id: 'LAB-2024-089',
    status: 'in_lab',
    location: 'Lab 2 / Main Hall',
    collectedBy: 'Nurse Sarah',
    collectedAt: '10:45 AM',
  },
  'rq-6': {
    id: 'LAB-2024-090',
    status: 'processing',
    location: 'Chemistry Lab',
    collectedBy: 'Technician Kamau',
    collectedAt: '11:15 AM',
    notes: 'Urgent',
  },
  'rq-5': {
    id: 'LAB-2024-091',
    status: 'rejected',
    location: 'Ward 4B',
    collectedBy: 'Nurse Martha',
    collectedAt: '08:30 AM',
    notes: 'Rejection: Insufficient volume for accurate culture',
    rejectionReason: 'insufficient_volume',
  },
  'rq-stat-1': {
    id: 'LAB-2024-092',
    status: 'collected',
    location: 'Lab 2',
    collectedBy: 'Nurse Sarah',
    collectedAt: '11:45 AM',
  },
}

function defaultTrackingStatus(request: LabTestRequest): TrackedSpecimen['status'] {
  if (request.specimenStatus === 'not_collected') return 'not_collected'
  if (request.status === 'completed') return 'complete'
  if (request.status === 'processing') return 'processing'
  return 'collected'
}

function defaultLocation(status: TrackedSpecimen['status']): string {
  if (status === 'not_collected') return 'Waiting Area'
  if (status === 'rejected') return 'Ward'
  if (status === 'processing') return 'Chemistry Lab'
  if (status === 'in_lab') return 'Lab 2 / Main Hall'
  if (status === 'complete') return 'Archive'
  return 'Collection Point'
}

function buildSpecimenFromRequest(request: LabTestRequest, index: number): TrackedSpecimen {
  const override = SPECIMEN_OVERRIDES[request.id]
  const status = override?.status ?? defaultTrackingStatus(request)
  const id = override?.id ?? `LAB-2024-${String(100 + index).padStart(3, '0')}`

  return {
    id,
    requestId: request.id,
    patientName: request.patientName,
    patientNumber: request.patientNumber,
    testName: request.testName,
    status,
    location: override?.location ?? defaultLocation(status),
    collectedBy:
      override?.collectedBy ??
      (status === 'not_collected' ? undefined : 'Lab Staff'),
    collectedAt:
      override?.collectedAt ??
      (status === 'not_collected' ? undefined : request.requestedAt),
    notes: override?.notes,
    rejectionReason: override?.rejectionReason,
  }
}

export const MOCK_SPECIMENS: TrackedSpecimen[] = MOCK_LAB_REQUESTS.map(buildSpecimenFromRequest)
