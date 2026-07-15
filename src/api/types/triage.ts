export interface BackendPatientSummary {
  patient_id: string
  patient_number: string
  full_name: string
  date_of_birth: string
  gender: string
}

export interface BackendVisitSummary {
  visit_id: string
  visit_number: string
  visit_type: string
  payment_type: string
}

export interface BackendTriageQueueItem {
  queue_id: string
  queue_number: string
  priority: 'emergency' | 'urgent' | 'semi_urgent' | 'non_urgent'
  status: 'waiting' | 'in_progress' | 'completed' | 'skipped'
  called_at: string | null
  completed_at: string | null
  created_at: string
  patient: BackendPatientSummary
  visit: BackendVisitSummary
}

export interface TriageQueueResponse {
  queue: BackendTriageQueueItem[]
  total: number
}

export interface BackendVitals {
  blood_pressure_systolic: number | null
  blood_pressure_diastolic: number | null
  temperature: number | null
  pulse_rate: number | null
  oxygen_saturation: number | null
  respiratory_rate: number | null
  weight_kg: number | null
}

export interface TriageAssessmentCreateRequest {
  visit_id: string
  patient_id: string
  blood_pressure_systolic?: number | null
  blood_pressure_diastolic?: number | null
  temperature?: number | null
  pulse_rate?: number | null
  oxygen_saturation?: number | null
  respiratory_rate?: number | null
  weight_kg?: number | null
  chief_complaint: string
  complaint_code?: string | null
  triage_category: 'emergency' | 'urgent' | 'semi_urgent' | 'non_urgent'
  triage_notes?: string | null
}

export interface DoctorQueueEntryResponse {
  queue_id: string
  queue_type: string
  priority: string
  status: string
}

export interface TriageAssessmentResponse {
  triage_id: string
  visit_id: string
  patient_id: string
  triage_nurse_id: string
  vitals: BackendVitals
  chief_complaint: string
  complaint_code: string | null
  triage_category: string
  triage_notes: string | null
  assessed_at: string
  doctor_queue_entry: DoctorQueueEntryResponse | null
}

export interface NurseSummary {
  user_id: string
  full_name: string
}

export interface TriageSummaryResponse {
  triage_id: string
  visit_id: string
  patient: BackendPatientSummary
  triage_nurse: NurseSummary
  vitals: BackendVitals
  chief_complaint: string
  complaint_code: string | null
  triage_category: string
  triage_notes: string | null
  assessed_at: string
}

export interface TriageCategorySuggestionResponse {
  suggested_category: 'emergency' | 'urgent' | 'semi_urgent' | 'non_urgent'
  reason: string
}

export interface QueueCallResponse {
  queue_id: string
  status: 'in_progress'
  called_at: string
}

export interface QueueSkipResponse {
  queue_id: string
  status: 'skipped'
  completed_at: string
}

export interface TriageHistoryPatientItem {
  id: string
  name: string
  patientNumber: string
  gender: string
  dob: string
  age: number
  phone: string
  lastTriageCategory: string | null
  lastAssessedAt: string | null
  assessmentCount: number
}

export interface TriageHistorySearchResponse {
  patients: TriageHistoryPatientItem[]
  total: number
}

