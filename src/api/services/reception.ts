// Proxied via api-gateway → reception-service
import { apiClient } from '@/api/client'
import type {
  BackendPatient,
  PatientSearchResponse,
  BackendInsurancePolicy,
  InsurancePolicyCreateRequest,
  VisitCreateRequest,
  VisitCreateResponse,
  RegisterAndVisitRequest,
  CombinedRegisterAndVisitResponse,
  QueueWorklistItem,
} from '@/api/types/reception'

export const receptionService = {
  // ── Patients ────────────────────────────────────────────────────────────

  /** Search returning patients by name, phone, or national ID */
  searchPatients: (query: string, page = 1, pageSize = 20) =>
    apiClient
      .get<PatientSearchResponse>('/reception/patients', {
        params: { search: query, page, page_size: pageSize },
      })
      .then((r) => r.data),

  /** Register a new patient profile */
  registerPatient: (data: Omit<BackendPatient, 'id' | 'patient_number' | 'created_at'>) =>
    apiClient.post<BackendPatient>('/reception/patients', data).then((r) => r.data),

  /** Fetch a single patient's full profile by their UUID */
  getPatient: (patientId: string) =>
    apiClient.get<BackendPatient>(`/patients/${patientId}`).then((r) => r.data),

  // ── Insurance ───────────────────────────────────────────────────────────

  /** Add an insurance policy to an existing patient */
  addInsurancePolicy: (patientId: string, data: InsurancePolicyCreateRequest) =>
    apiClient
      .post<BackendInsurancePolicy>(`/reception/patients/${patientId}/insurance`, data)
      .then((r) => r.data),

  /** List patient insurance policies */
  getInsurancePolicies: (patientId: string) =>
    apiClient
      .get<BackendInsurancePolicy[]>(`/reception/patients/${patientId}/insurance`)
      .then((r) => r.data),

  /** Record the outcome of a manual insurance verification */
  verifyInsurance: (insuranceId: string, status: 'verified' | 'rejected') =>
    apiClient
      .patch<BackendInsurancePolicy>(`/reception/insurance/${insuranceId}/verify`, {
        verification_status: status,
      })
      .then((r) => r.data),

  // ── Visits ──────────────────────────────────────────────────────────────

  /** Check-in a returning patient — creates a visit and routes to triage */
  createVisit: (data: VisitCreateRequest) =>
    apiClient.post<VisitCreateResponse>('/reception/visits', data).then((r) => r.data),

  /** Register a new patient AND create their first visit in one request */
  registerAndVisit: (data: RegisterAndVisitRequest) =>
    apiClient
      .post<CombinedRegisterAndVisitResponse>('/reception/register-and-visit', data)
      .then((r) => r.data),

  // ── Queue ────────────────────────────────────────────────────────────────

  /** Fetch the live reception worklist for a given queue type */
  getTriageQueue: (queueType = 'triage') =>
    apiClient
      .get<QueueWorklistItem[]>('/reception/queue', { params: { queue_type: queueType } })
      .then((r) => r.data),

  /** Update the status of a queue entry (e.g. skip / in_progress / completed) */
  updateQueueStatus: (queueId: string, status: 'in_progress' | 'completed' | 'skipped') =>
    apiClient
      .patch<any>(`/visits/queues/${queueId}/status`, { status })
      .then((r) => r.data),
}
