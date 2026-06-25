export type VisitOutcome = 'Recovered' | 'Stable' | 'Admitted' | 'Referred' | 'Pending'

export interface AllergyRecord {
  substance: string
  severity: string
  documentedBy: string
  documentedOn: string
}

export interface ConsultationHistoryPatient {
  id: string
  name: string
  patientNumber: string
  dob: string
  age: number
  gender: string
  phone: string
  paymentMethod: string
  registeredOn: string
  totalVisits: number
  lastVisitDate: string
  activeConditions: number
  allergies: AllergyRecord[]
  avatarInitials: string
}

export interface ConsultationHistorySearchResult extends ConsultationHistoryPatient {
  lastDiagnosis: string
}

export interface VisitClinicalNotes {
  visitType: string
  attending: string
  chiefComplaint: string
  objectiveExam: string
  assessment: string
}

export interface VisitInvestigation {
  test: string
  result: string
  date: string
}

export interface VisitPrescription {
  drug: string
  dose: string
  duration: string
}

export interface ConsultationVisitRecord {
  visitId: string
  date: string
  attendingDoctor: string
  chiefComplaint: string
  diagnosis: string
  outcome: VisitOutcome
  clinicalNotes: VisitClinicalNotes
  investigations: VisitInvestigation[]
  prescriptions: VisitPrescription[]
  disposition: string
}
