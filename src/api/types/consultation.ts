export interface ConsultationQueueItem {
  queue_id: string
  queue_number: string
  priority: string
  visit_id: string
  visit_number: string
  patient_id: string
  full_name: string
  patient_number: string
  age: number
  triage_category?: string | null
  chief_complaint?: string | null
  wait_time_minutes: number
  queue_status: string
  visit_status?: string
  pending_investigations_count?: number
  completed_investigations_count?: number
}

export interface PatientResponse {
  id: string
  patient_number: string
  full_name: string
  date_of_birth: string
  gender: string
  phone_primary: string
  allergies?: string | null
  blood_group?: string | null
}

export interface TriageAssessmentResponse {
  blood_pressure_systolic?: number | null
  blood_pressure_diastolic?: number | null
  temperature?: number | null
  pulse_rate?: number | null
  oxygen_saturation?: number | null
  respiratory_rate?: number | null
  weight_kg?: number | null
  chief_complaint: string
  triage_category: string
  triage_notes?: string | null
  assessed_at: string
}

export interface DiagnosisResponse {
  id: string
  consultation_id: string
  diagnosis_type: 'provisional' | 'differential' | 'final'
  code?: string | null
  description: string
  sequence_order?: number | null
  recorded_by?: string | null
  recorded_at: string
}

export interface InvestigationRequestResponse {
  id: string
  visit_id: string
  consultation_id: string
  patient_id: string
  request_type: string
  test_name: string
  test_code?: string | null
  clinical_history?: string | null
  status: string
  urgency: string
  created_by?: string | null     // alias for requested_by in backend schema
  created_at?: string | null     // alias for requested_at in backend schema
  result?: Record<string, any> | null
}

export interface PrescriptionResponse {
  id: string
  visit_id: string
  consultation_id: string
  patient_id: string
  drug_name: string
  dose: string
  frequency: string
  duration: string
  route: string
  instructions?: string | null
  prescribed_by?: string | null
  status: string
  prescribed_at: string
}

export interface ConsultationResponse {
  id: string
  visit_id: string
  patient_id: string
  history_of_presenting_illness?: string | null
  examination_findings?: string | null
  clinical_impression?: string | null
  consultation_status: string
  started_at: string
  completed_at?: string | null
  disposition?: string | null
  referral_type?: string | null
  referral_notes?: string | null
  admission_reason?: string | null
  discharge_instructions?: string | null
  follow_up_date?: string | null
  return_date?: string | null
  return_reason?: string | null
  diagnoses: DiagnosisResponse[]
  investigation_requests: InvestigationRequestResponse[]
  prescriptions: PrescriptionResponse[]
}

export interface EncounterViewResponse {
  patient: PatientResponse
  current_visit_id: string
  triage_summary?: TriageAssessmentResponse | null
  consultation: ConsultationResponse;
}

