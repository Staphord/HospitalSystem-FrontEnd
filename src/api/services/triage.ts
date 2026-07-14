import { apiClient } from '@/api/client'
import type {
  TriageQueueResponse,
  TriageAssessmentCreateRequest,
  TriageAssessmentResponse,
  TriageSummaryResponse,
  TriageCategorySuggestionResponse,
  QueueCallResponse,
  QueueSkipResponse
} from '@/api/types/triage'

export const triageService = {
  /** Fetch live triage queue filtered by status (default: waiting,in_progress) */
  getQueue: (status = 'waiting,in_progress') =>
    apiClient
      .get<TriageQueueResponse>('/triage/queue', { params: { status } })
      .then((r) => r.data),

  /** Record a new triage assessment */
  createAssessment: (data: TriageAssessmentCreateRequest) =>
    apiClient
      .post<TriageAssessmentResponse>('/triage/assessments', data)
      .then((r) => r.data),

  /** Suggest triage category based on current vitals values */
  suggestCategory: (vitals: {
    blood_pressure_systolic?: number | null
    blood_pressure_diastolic?: number | null
    temperature?: number | null
    pulse_rate?: number | null
    oxygen_saturation?: number | null
    respiratory_rate?: number | null
    weight_kg?: number | null
  }) =>
    apiClient
      .post<TriageCategorySuggestionResponse>('/triage/assessments/suggest-category', vitals)
      .then((r) => r.data),

  /** Fetch a triage assessment details for a given visit_id */
  getAssessment: (visitId: string) =>
    apiClient
      .get<TriageSummaryResponse>(`/triage/assessments/${visitId}`)
      .then((r) => r.data),

  /** Call a patient from the queue */
  callPatient: (queueId: string) =>
    apiClient
      .patch<QueueCallResponse>(`/triage/queue/${queueId}/call`)
      .then((r) => r.data),

  /** Skip a patient in the queue */
  skipPatient: (queueId: string) =>
    apiClient
      .patch<QueueSkipResponse>(`/triage/queue/${queueId}/skip`)
      .then((r) => r.data)
}
