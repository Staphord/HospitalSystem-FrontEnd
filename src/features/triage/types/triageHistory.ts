export interface TriageHistoryPatient {
  id: string
  name: string
  patientNumber: string
  lastVisitDate: string
  gender: string
  age: number
  dob: string
  phone: string
  avatarUrl?: string
}

export interface TriageHistorySearchResult extends TriageHistoryPatient {
  lastTriageCategory: string
  lastAssessedAt: string
  assessmentCount: number
}

export type VisitOutcome = 'Active' | 'Completed' | 'Cancelled'

export interface TriageVisitRecord {
  visitId: string
  date: string
  chiefComplaint: string
  triageCategory: 'Emergency' | 'Urgent' | 'Semi-Urgent' | 'Non-Urgent'
  attendingDoctor: string
  diagnosis: string
  outcome: VisitOutcome
  vitals?: string
  doctorNotes?: string
  rawStatus?: string
  vitalsRaw?: any
  triageNurse?: any
}
