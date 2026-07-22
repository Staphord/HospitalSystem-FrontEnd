export interface WardBed {
  bedId: string
  wardName: string
  bedNumber: string
  bedType: string
  isAvailable: boolean
  isActive: boolean
  notes?: string | null
  /** Populated when joining with active admissions */
  admissionId?: string
  patientId?: string
  diagnosis?: string
  admittingDoctorId?: string
  admissionDate?: string
}

export interface BedBoardWard {
  wardName: string
  beds: Array<{
    bedId: string
    bedNumber: string
    bedType: string
    isAvailable: boolean
    occupied: boolean
  }>
}

export interface Admission {
  admissionId: string
  visitId: string
  patientId: string
  bedId: string
  admittingDoctorId: string
  admittingDiagnosis: string
  admissionDate: string
  dischargeDate?: string | null
  lengthOfStayDays?: number | null
  dischargeDiagnosis?: string | null
  dischargeInstructions?: string | null
  status: string
  wardName?: string | null
  bedNumber?: string | null
}

export interface AdmissionCreate {
  visitId: string
  bedId: string
  admittingDiagnosis: string
}

export interface DischargeRequest {
  dischargeDiagnosis: string
  dischargeInstructions?: string
}

export interface InpatientOrder {
  orderId: string
  admissionId: string
  patientId: string
  orderType: string
  orderDetail: string
  frequency?: string | null
  startDate?: string | null
  endDate?: string | null
  orderedBy: string
  status: string
  orderedAt: string
  /** UI helpers when joined with admission */
  patientLabel?: string
  bedLabel?: string
}

export interface OrderCreate {
  orderType: string
  orderDetail: string
  frequency?: string
  startDate?: string
  endDate?: string
}

export interface NursingNote {
  noteId: string
  admissionId: string
  patientId: string
  noteType: string
  noteText: string
  vitalsBp?: string | null
  vitalsTemp?: number | null
  vitalsPulse?: number | null
  vitalsSpo2?: number | null
  authoredBy: string
  authoredAt: string
}

export interface NursingNoteCreate {
  noteType: string
  noteText: string
  vitalsBp?: string
  vitalsTemp?: number
  vitalsPulse?: number
  vitalsSpo2?: number
}
