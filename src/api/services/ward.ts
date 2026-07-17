import { apiClient } from '@/api/client'
import type { AdmittedPatient, InpatientOrder, AdmissionSummary } from '@/features/consultation/types/inpatientOrders'

const mapAdmittedPatient = (data: any): AdmittedPatient => {
  if (!data) return data
  return {
    id: data.id,
    patientId: data.patient_id || data.patientId,
    name: data.name,
    patientNumber: data.patient_number || data.patientNumber,
    initials: data.initials,
    gender: data.gender,
    age: data.age,
    ward: data.ward,
    bed: data.bed,
    admissionDate: data.admission_date || data.admissionDate,
    lengthOfStay: data.length_of_stay !== undefined ? data.length_of_stay : data.lengthOfStay,
    diagnosis: data.diagnosis,
    primaryDiagnosis: data.primary_diagnosis || data.primaryDiagnosis,
    status: data.status,
  }
}

const mapInpatientOrder = (data: any): InpatientOrder => {
  if (!data) return data
  return {
    id: data.id,
    admissionId: data.admission_id || data.admissionId,
    type: data.order_type || data.type,
    description: data.description,
    subDescription: data.sub_description || data.subDescription,
    issuedAt: data.issued_at || data.issuedAt,
    dueLabel: data.due_label || data.dueLabel,
    status: data.status,
    completedBy: data.completed_by || data.completedBy,
  }
}

const mapAdmissionSummary = (data: any): AdmissionSummary => {
  if (!data) return data
  return {
    admittingDiagnosis: data.admitting_diagnosis || data.admittingDiagnosis,
    admittingDoctor: data.admitting_doctor || data.admittingDoctor,
    wardService: data.ward_service || data.wardService,
    keyEvents: (data.key_events || data.keyEvents || []).map((e: any) => ({
      date: e.date,
      description: e.description,
    })),
  }
}

export const wardService = {
  getAdmittedPatients: () =>
    apiClient.get('/consultation/inpatient/admissions')
      .then((r) => ({ ...r, data: (r.data || []).map(mapAdmittedPatient) })),

  getAdmissionDetails: (id: string) =>
    apiClient.get(`/consultation/inpatient/admissions/${id}`)
      .then((r) => ({
        ...r,
        data: {
          patient: mapAdmittedPatient(r.data?.patient),
          summary: mapAdmissionSummary(r.data?.summary),
        }
      })),

  getInpatientOrders: (id: string) =>
    apiClient.get(`/consultation/inpatient/admissions/${id}/orders`)
      .then((r) => ({ ...r, data: (r.data || []).map(mapInpatientOrder) })),

  issueInpatientOrder: (id: string, data: any) =>
    apiClient.post(`/consultation/inpatient/admissions/${id}/orders`, data)
      .then((r) => ({ ...r, data: mapInpatientOrder(r.data) })),

  updateOrderStatus: (orderId: string, status: string) =>
    apiClient.put(`/consultation/inpatient/orders/${orderId}/status`, { status })
      .then((r) => ({ ...r, data: mapInpatientOrder(r.data) })),

  dischargePatient: (id: string, data: any) =>
    apiClient.post(`/consultation/inpatient/admissions/${id}/discharge`, data)
      .then((r) => r.data),

  /** Fetch a patient's full history from the real backend */
  getPatientHistory: (patientId: string) =>
    apiClient.get(`/consultation/encounters/patient/${patientId}/history`)
      .then((r) => r.data as PatientHistoryData),
}

// ── Type for the real backend PatientHistory response ────────────────────────
export interface PatientHistoryData {
  patient: {
    id: string
    patient_number: string
    full_name: string
    date_of_birth: string
    gender: string
    phone_primary: string
    phone_secondary?: string
    email?: string
    address?: string
    allergies?: string
    blood_group?: string
    next_of_kin_name?: string
    next_of_kin_phone?: string
    next_of_kin_relationship?: string
  }
  previous_visits: Array<{
    visit_id: string
    visit_date: string
    visit_type: string
    status: string
    triage_summary?: {
      chief_complaint?: string
      triage_category?: string
      triage_notes?: string
      assessed_at?: string
    } | null
    consultation?: {
      id: string
      history_of_presenting_illness?: string
      examination_findings?: string
      clinical_impression?: string
      consultation_status: string
      disposition?: string
      referral_type?: string
      referral_notes?: string
      admission_reason?: string
      discharge_instructions?: string
      follow_up_date?: string
      return_date?: string
      return_reason?: string
      created_by?: string
      diagnoses: Array<{ diagnosis_code?: string; diagnosis_name: string; diagnosis_type: string }>
      investigation_requests: Array<{ test_name: string; request_type: string; status: string; created_at?: string }>
      prescriptions: Array<{ drug_name: string; dose?: string; frequency?: string; duration?: string }>
    } | null
  }>
}
