import { apiClient } from '@/api/client'

export interface BackendLabRequestItem {
  request_id: string
  visit_id: string
  patient_id: string
  patient_name: string
  patient_number: string
  test_name: string
  test_code?: string
  clinical_indication?: string
  urgency: 'stat' | 'urgent' | 'routine'
  status: 'pending' | 'specimen_collected' | 'in_progress' | 'completed' | 'cancelled'
  requested_by_name?: string
  requested_at: string
}

export interface BackendLabRequestDetail {
  request_id: string
  visit_id: string
  patient: {
    patient_id: string
    patient_number: string
    full_name: string
    date_of_birth: string
    gender: string
  }
  test_name: string
  test_code?: string
  clinical_indication?: string
  urgency: string
  status: string
  requested_by_name?: string
  requested_at: string
  specimen?: {
    specimen_id: string
    status: string
    specimen_type: string
    collected_at: string
    received_at?: string
    rejection_reason?: string
  } | null
  result?: {
    result_id: string
    status: string
    result_value: string
    unit?: string
    reference_range?: string
    is_critical: boolean
    resulted_at: string
  } | null
}

export interface SpecimenCreateInput {
  specimen_type: string
  collection_site?: string
  specimen_label?: string
  collected_at: string
}

export interface SpecimenStatusUpdateInput {
  status: 'received' | 'processing' | 'completed' | 'rejected'
  received_at?: string
  rejection_reason?: string
}

export interface ResultCreateInput {
  result_value: string
  unit?: string
  reference_range?: string
  is_critical?: boolean
  result_notes?: string
  specimen_type?: string
  specimen_label?: string
}

export interface ResultUpdateInput {
  result_value?: string
  unit?: string
  reference_range?: string
  is_critical?: boolean
  result_notes?: string
}

export interface LabBillCreateInput {
  unit_price: number
  description: string
}

export const laboratoryService = {
  getRequests: (params?: { status?: string; urgency?: string; date?: string }) =>
    apiClient
      .get<{ requests: BackendLabRequestItem[] }>('/laboratory/requests', { params })
      .then((r) => r.data.requests),

  getRequestDetail: (requestId: string) =>
    apiClient
      .get<BackendLabRequestDetail>(`/laboratory/requests/${requestId}`)
      .then((r) => r.data),

  collectSpecimen: (requestId: string, payload: SpecimenCreateInput) =>
    apiClient
      .post(`/laboratory/requests/${requestId}/specimen`, payload)
      .then((r) => r.data),

  updateSpecimenStatus: (requestId: string, payload: SpecimenStatusUpdateInput) =>
    apiClient
      .patch(`/laboratory/requests/${requestId}/specimen`, payload)
      .then((r) => r.data),

  getRequestSpecimens: (requestId: string) =>
    apiClient
      .get<{ specimens: any[] }>(`/laboratory/requests/${requestId}/specimen`)
      .then((r) => r.data.specimens),

  createResult: (requestId: string, payload: ResultCreateInput) =>
    apiClient
      .post(`/laboratory/requests/${requestId}/result`, payload)
      .then((r) => r.data),

  updateResult: (requestId: string, payload: ResultUpdateInput) =>
    apiClient
      .patch(`/laboratory/requests/${requestId}/result`, payload)
      .then((r) => r.data),

  getResult: (requestId: string) =>
    apiClient
      .get(`/laboratory/requests/${requestId}/result`)
      .then((r) => r.data),

  verifyResult: (resultId: string) =>
    apiClient
      .post(`/laboratory/results/${resultId}/verify`)
      .then((r) => r.data),

  createBill: (requestId: string, payload: LabBillCreateInput) =>
    apiClient
      .post(`/laboratory/requests/${requestId}/bill`, payload)
      .then((r) => r.data),

  getVisitVerifiedResults: (visitId: string) =>
    apiClient
      .get(`/laboratory/visits/${visitId}/results`)
      .then((r) => r.data),
}
