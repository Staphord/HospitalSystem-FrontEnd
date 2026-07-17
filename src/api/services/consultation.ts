import { apiClient } from '@/api/client'
import type { 
  ConsultationQueueItem, 
  EncounterViewResponse, 
  DiagnosisResponse, 
  InvestigationRequestResponse, 
  PrescriptionResponse 
} from '@/api/types/consultation'
import type { Referral, NewReferralInput } from '@/features/consultation/types/referrals'

export const consultationService = {
  /** Fetch active doctor queue for consultation */
  getQueue: (status = 'waiting') =>
    apiClient
      .get<ConsultationQueueItem[]>('/consultation/queue', { params: { status } })
      .then((r) => r.data),

  getEncounter: (visitId: string) =>
    apiClient
      .get<EncounterViewResponse>(`/consultation/encounters/${visitId}`)
      .then((r) => r.data),

  openEncounter: (visitId: string) =>
    apiClient
      .post<any>(`/consultation/encounters/${visitId}/open`)
      .then((r) => r.data),

  updateNotes: (
    consultationId: string, 
    presentingHistory: string, 
    examinationFindings: string, 
    clinicalImpression: string
  ) =>
    apiClient
      .put(`/consultation/${consultationId}/notes`, {
        presenting_history: presentingHistory,
        examination_findings: examinationFindings,
        clinical_impression: clinicalImpression,
      })
      .then((r) => r.data),

  addDiagnosis: (
    consultationId: string, 
    diagnosisType: string, 
    description: string, 
    code?: string
  ) =>
    apiClient
      .post<DiagnosisResponse>(`/consultation/${consultationId}/diagnoses`, {
        diagnosis_type: diagnosisType,
        description,
        code,
      })
      .then((r) => r.data),

  deleteDiagnosis: (diagnosisId: string) =>
    apiClient
      .delete(`/consultation/diagnoses/${diagnosisId}`)
      .then((r) => r.data),

  addInvestigation: (
    consultationId: string, 
    requestType: string, 
    testName: string, 
    clinicalIndication: string, 
    urgency = 'routine', 
    testCode?: string
  ) =>
    apiClient
      .post<InvestigationRequestResponse>(`/consultation/${consultationId}/investigations`, {
        request_type: requestType.toLowerCase() === 'radiology' ? 'radiology' : 'lab',
        test_name: testName,
        clinical_indication: clinicalIndication,
        urgency,
        test_code: testCode,
      })
      .then((r) => r.data),

  deleteInvestigation: (requestId: string) =>
    apiClient
      .delete(`/consultation/investigations/${requestId}`)
      .then((r) => r.data),

  addPrescription: (
    consultationId: string, 
    drugName: string, 
    dose: string, 
    frequency: string, 
    duration: string, 
    route: string, 
    instructions?: string
  ) =>
    apiClient
      .post<PrescriptionResponse>(`/consultation/${consultationId}/prescriptions`, {
        drug_name: drugName,
        dose,
        frequency,
        duration,
        route,
        instructions,
      })
      .then((r) => r.data),

  deletePrescription: (prescriptionId: string) =>
    apiClient
      .delete(`/consultation/prescriptions/${prescriptionId}`)
      .then((r) => r.data),

  updateDisposition: (
    consultationId: string, 
    disposition: string, 
    options?: {
      referralType?: string
      referralNotes?: string
      admissionReason?: string
      dischargeInstructions?: string
      followUpDate?: string
      returnDate?: string
      returnReason?: string
    }
  ) =>
    apiClient
      .put(`/consultation/${consultationId}/disposition`, {
        disposition,
        referral_type: options?.referralType,
        referral_notes: options?.referralNotes,
        admission_reason: options?.admissionReason,
        discharge_instructions: options?.dischargeInstructions,
        follow_up_date: options?.followUpDate,
        return_date: options?.returnDate,
        return_reason: options?.returnReason,
      })
      .then((r) => r.data),

  completeConsultation: (consultationId: string) =>
    apiClient
      .post(`/consultation/${consultationId}/complete`)
      .then((r) => r.data),

  /** Get all investigation results for the dashboard */
  getInvestigationResults: () =>
    apiClient
      .get('/consultation/investigations/results')
      .then((r) => r.data as InvestigationResultData[]),

  /** Acknowledge an investigation result */
  acknowledgeInvestigation: (requestId: string) =>
    apiClient
      .put(`/consultation/investigations/${requestId}/acknowledge`)
      .then((r) => r.data),

  /** Get all outgoing clinical referrals */
  getReferrals: () =>
    apiClient
      .get('/consultation/referrals')
      .then((r) => r.data as any[]),

  /** Create a new outgoing referral */
  addReferral: (input: NewReferralInput) =>
    apiClient
      .post('/consultation/referrals', {
        patient_id: input.patientId,
        type: input.type,
        referred_to: input.referredTo,
        reason: input.reason,
        urgency: input.urgency,
        category: input.category,
        department: input.department,
        preferred_doctor: input.preferredDoctor,
        hospital_name: input.hospitalName,
        external_doctor: input.externalDoctor,
        contact_number: input.contactNumber,
      })
      .then((r) => r.data as any),

  /** Cancel an outgoing referral */
  cancelReferral: (id: string) =>
    apiClient
      .put(`/consultation/referrals/${id}/cancel`)
      .then((r) => r.data),

  /** Get doctor dashboard statistics and queues */
  getDashboardStats: () =>
    apiClient
      .get('/consultation/dashboard/stats')
      .then((r) => r.data as DoctorDashboardStatsResponse),
}

export interface DoctorDashboardStatsResponse {
  stats: {
    waiting_patients: number
    in_progress: number
    completed_today: number
    pending_results: number
  }
  next_patients: {
    name: string
    patient_id: string
    condition: string
    wait_time: string
    urgency: 'urgent' | 'normal' | 'consulting'
    visit_id: string
  }[]
  pending_results: {
    id: string
    patient_name: string
    test: string
    time: string
    status: 'critical' | 'ready' | 'pending'
  }[]
  summary: {
    diagnoses_count: number
    prescriptions_issued: number
    investigations_ordered: number
    referrals_made: number
  }
  critical_alerts: {
    id: string
    title: string
    description: string
    is_highlight: boolean
  }[]
}

export interface InvestigationResultData {
  id: string
  patient: {
    id: string
    patient_number: string
    full_name: string
  }
  visit_id: string
  test_name: string
  request_type: string
  urgency: string
  status: 'critical' | 'ready' | 'pending' | 'acknowledged'
  ordered_at: string
  completed_at: string | null
  result_values?: string | null
  reference_range?: string | null
  lab_notes?: string | null
}

