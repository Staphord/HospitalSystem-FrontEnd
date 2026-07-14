// Synced with backend reception-service, patient-service, and visit-service schemas

// ─── Patient ────────────────────────────────────────────────────────────────

export interface BackendPatient {
  id: string
  patient_number: string
  full_name: string
  date_of_birth: string
  gender: 'male' | 'female' | 'other'
  national_id?: string
  phone_primary?: string
  phone_secondary?: string
  email?: string
  address?: string
  next_of_kin_name?: string
  next_of_kin_relationship?: string
  next_of_kin_phone?: string
  allergies?: string
  blood_group?: string
  created_at: string
}

export interface PatientSearchResponse {
  patients: BackendPatient[]
  total: number
}

// ─── Insurance ──────────────────────────────────────────────────────────────

export interface BackendInsurancePolicy {
  insurance_id: string
  patient_id: string
  insurer_name: string
  policy_number: string
  coverage_limit?: number
  expiry_date?: string
  verification_status: 'pending' | 'verified' | 'rejected'
  is_active: boolean
  created_at: string
}

export interface InsurancePolicyCreateRequest {
  insurer_name: string
  policy_number: string
  coverage_limit?: number
  expiry_date?: string
}

// ─── Visit ───────────────────────────────────────────────────────────────────

export interface VisitCreateRequest {
  patient_id: string
  visit_type: 'outpatient' | 'emergency' | 'checkup' | 'referral'
  payment_type: 'cash' | 'insurance'
  insurance_id?: string
}

export interface QueueSummary {
  queue_id: string
  queue_type: string
  queue_number: string
  priority: string
  status: 'waiting' | 'in_progress' | 'skipped' | 'completed'
}

export interface VisitSummary {
  visit_id: string
  visit_number: string
  status: string
}

export interface VisitCreateResponse {
  visit: VisitSummary
  queue: QueueSummary
}

// ─── Register-and-Visit (combined) ───────────────────────────────────────────

export type PatientCreatePayload = Omit<BackendPatient, 'id' | 'patient_number' | 'created_at'>

export interface RegisterAndVisitRequest {
  patient: PatientCreatePayload
  visit: Omit<VisitCreateRequest, 'patient_id'>
  insurance?: InsurancePolicyCreateRequest
}

export interface CombinedRegisterAndVisitResponse {
  patient: BackendPatient
  visit: VisitCreateResponse
}

// ─── Queue Worklist ──────────────────────────────────────────────────────────

export interface QueueWorklistItem {
  queue_id: string
  queue_type: string
  queue_number: string
  priority: string
  status: string
  created_at: string
  called_at?: string
  completed_at?: string
  patient: {
    patient_id: string
    patient_number: string
    full_name: string
  }
  visit: {
    visit_id: string
    visit_number: string
    visit_type: string
    payment_type: string
    status: string
    queue_number: string | null
  }
}
