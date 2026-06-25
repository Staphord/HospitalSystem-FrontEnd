export type AdmissionStatus = 'critical' | 'stable' | 'monitoring' | 'discharge-ready'

export type OrderType = 'medication' | 'nursing' | 'diet' | 'investigation'

export type OrderStatus = 'pending' | 'done' | 'discontinued'

export type InvestigationUrgency = 'stat' | 'urgent' | 'routine'

export interface AdmittedPatient {
  id: string
  patientId: string
  name: string
  patientNumber: string
  initials: string
  ward: string
  bed: string
  admissionDate: string
  lengthOfStay: number
  diagnosis: string
  primaryDiagnosis: string
  status: AdmissionStatus
}

export interface InpatientOrder {
  id: string
  admissionId: string
  type: OrderType
  description: string
  subDescription?: string
  issuedAt: string
  dueLabel: string
  status: OrderStatus
  completedBy?: string
}
