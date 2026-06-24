export type AdmissionStatus = 'critical' | 'stable' | 'monitoring' | 'discharge-ready'

export type OrderType = 'medication' | 'nursing' | 'diet' | 'investigation'
export type OrderStatus = 'pending' | 'done' | 'discontinued'

export type DischargeCondition = 'recovered' | 'improved' | 'stable' | 'transferred' | 'deceased'

export interface AdmittedPatient {
  id: string
  patientId: string
  name: string
  patientNumber: string
  initials: string
  gender: string
  age: number
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

export interface ClinicalEvent {
  date: string
  description: string
}

export interface AdmissionSummary {
  admittingDiagnosis: string
  admittingDoctor: string
  wardService: string
  keyEvents: ClinicalEvent[]
}

export interface DischargeMedication {
  id: string
  drugName: string
  doseFreq: string
}

export interface DischargeDefaults {
  dischargeDiagnosis: string
  condition: DischargeCondition
  careSummary: string
  instructions: string
  medications: DischargeMedication[]
  followUpDate: string
}
