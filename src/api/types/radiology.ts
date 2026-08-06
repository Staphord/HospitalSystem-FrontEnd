/** Frontend radiology API types (camelCase UI models). */

export type ImagingModality = 'x-ray' | 'ct-scan' | 'mri' | 'ultrasound'

export type ImagingRequestStatus = 'requested' | 'scheduled' | 'in-progress' | 'complete'

export interface ImagingRequest {
  id: string
  patientName: string
  patientNumber: string
  age: string
  sex: string
  modality: ImagingModality
  bodyPart: string
  clinicalIndication: string
  requestedBy: string
  requestedAt: string
  requestedDate: string
  status: ImagingRequestStatus
  findings?: string
  impression?: string
  imageReference?: string
  visitId?: string
  reportId?: string
  reportStatus?: string
  urgency?: 'routine' | 'urgent' | 'stat'
  scheduledAt?: string
  testName?: string
}

export interface ImagingRequestSummary {
  newRequests: number
  scheduled: number
  inProgress: number
  completedToday: number
}

export interface RadiologyReport {
  reportId: string
  requestId: string
  visitId: string
  patientId: string
  modality: string
  bodyPart?: string
  scheduledAt?: string
  performedAt?: string
  findings?: string
  impression?: string
  imageReference?: string
  performedBy: string
  reportedBy?: string
  status: string
  reportedAt?: string
}

export interface ScheduleImagingPayload {
  modality: ImagingModality
  bodyPart?: string
  scheduledAt: string
}

export interface EnterReportPayload {
  findings: string
  impression: string
  imageReference?: string
}
