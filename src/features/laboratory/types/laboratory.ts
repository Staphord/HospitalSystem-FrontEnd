export interface LabDashboardStats {
  pendingTests: number
  inProgress: number
  completedToday: number
  criticalValues: number
}

export interface StatLabRequest {
  id: string
  patientName: string
  testName: string
  requestedBy: string
  requestedAgo: string
  priority: LabRequestPriority
}

export interface CriticalValue {
  id: string
  patientName: string
  testName: string
  result: string
  refRange: string
}

export interface CompletedTest {
  id: string
  testName: string
  requestId: string
  completedAt: string
}

export interface TurnaroundMetric {
  department: string
  minutes: number
  barPercent: number
  opacity?: string
}

export interface StatTurnaroundMetric extends TurnaroundMetric {
  isStat?: boolean
}

export type LabRequestPriority = 'stat' | 'urgent' | 'routine'
export type LabRequestStatus = 'pending' | 'processing' | 'completed'
export type SpecimenStatus = 'not_collected' | 'collected'

/** Full lifecycle — Specimen Tracking page only. */
export type SpecimenTrackingStatus =
  | 'not_collected'
  | 'collected'
  | 'in_lab'
  | 'processing'
  | 'complete'
  | 'rejected'

export type SpecimenRejectionReason =
  | 'insufficient_volume'
  | 'improper_labeling'
  | 'contaminated'
  | 'container_leaking'

export interface TrackedSpecimen {
  id: string
  requestId: string
  patientName: string
  patientNumber: string
  testName: string
  collectedBy?: string
  collectedAt?: string
  status: SpecimenTrackingStatus
  location: string
  notes?: string
  rejectionReason?: SpecimenRejectionReason
}

export interface SpecimenSummary {
  awaitingCollection: number
  collected: number
  inProcessing: number
  completedToday: number
}

export type ResultFlag = 'normal' | 'abnormal' | 'critical' | null

export interface LabResultParameter {
  id: string
  name: string
  unit: string
  refRange: string
  criticalHigh?: number
  criticalLow?: number
  abnormalHigh?: number
  abnormalLow?: number
}

export interface LabTestRequest {
  id: string
  patientName: string
  patientNumber: string
  testName: string
  requestedBy: string
  requestedAt: string
  priority: LabRequestPriority
  specimenStatus: SpecimenStatus
  status: LabRequestStatus
  specimenId?: string
  collectedAt?: string
  parameters?: LabResultParameter[]
  observations?: string
  resultValues?: Record<string, string>
}

export interface LabRequestSummary {
  pending: number
  stat: number
  urgent: number
  inProgress: number
  completedToday: number
}

export type LabRequestActionType = 'collect_specimen' | 'enter_results' | 'view_results'
