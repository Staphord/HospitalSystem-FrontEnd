import { apiClient } from '@/api/client'
import { receptionService } from '@/api/services/reception'
import type {
  Admission,
  AdmissionCondition,
  AdmissionCreate,
  BedBoardWard,
  DischargeRequest,
  HandoverCreate,
  InpatientOrder,
  NursingNote,
  NursingNoteCreate,
  OrderCreate,
  ShiftHandover,
  VisitorCreate,
  WardBed,
  WardVisitor,
} from '@/api/types/ward'

// ---------------------------------------------------------------------------
// Backend wire formats (ward-service via gateway /ward/*)
// ---------------------------------------------------------------------------

interface BackendBed {
  bed_id: string
  ward_name: string
  bed_number: string
  bed_type: string
  is_available: boolean
  is_active: boolean
  notes?: string | null
}

interface BackendAdmission {
  admission_id: string
  visit_id: string
  patient_id: string
  bed_id: string
  admitting_doctor_id: string
  admitting_diagnosis: string
  condition: string
  admission_date: string
  discharge_date?: string | null
  length_of_stay_days?: string | number | null
  discharge_diagnosis?: string | null
  discharge_instructions?: string | null
  discharge_order_by?: string | null
  status: string
  ward_name?: string | null
}

interface BackendOrder {
  order_id: string
  admission_id: string
  patient_id: string
  order_type: string
  order_detail: string
  frequency?: string | null
  start_date?: string | null
  end_date?: string | null
  ordered_by: string
  status: string
  ordered_at: string
}

interface BackendNote {
  note_id: string
  admission_id: string
  patient_id: string
  note_type: string
  note_text: string
  vitals_bp?: string | null
  vitals_temp?: string | number | null
  vitals_pulse?: number | null
  vitals_spo2?: string | number | null
  vitals_resp_rate?: number | null
  authored_by: string
  authored_at: string
}

interface BackendBedBoard {
  wards: Array<{
    ward_name: string
    beds: Array<{
      bed_id: string
      bed_number: string
      bed_type: string
      is_available: boolean
      occupied: boolean
    }>
  }>
}

interface BackendVisitor {
  visitor_id: string
  admission_id?: string | null
  patient_id?: string | null
  patient_name: string
  bed_label: string
  visitor_name: string
  visitor_phone?: string | null
  relationship: string
  national_id?: string | null
  check_in_at: string
  check_out_at?: string | null
  approved_by: string
  status: string
  denial_reason?: string | null
  allowed_duration_minutes: number
  ward_name?: string | null
  time_left_seconds?: number | null
}

interface BackendHandover {
  handover_id: string
  shift_label: string
  submitted_by: string
  overall_summary: string
  incidents_summary?: string | null
  patient_count: number
  patient_notes?: Record<string, string> | null
  ward_name?: string | null
  created_at: string
}

const mapBed = (b: BackendBed): WardBed => ({
  bedId: b.bed_id,
  wardName: b.ward_name,
  bedNumber: b.bed_number,
  bedType: b.bed_type,
  isAvailable: b.is_available,
  isActive: b.is_active,
  notes: b.notes,
})

const mapAdmission = (a: BackendAdmission, bedNumber?: string): Admission => ({
  admissionId: a.admission_id,
  visitId: a.visit_id,
  patientId: a.patient_id,
  bedId: a.bed_id,
  admittingDoctorId: a.admitting_doctor_id,
  admittingDiagnosis: a.admitting_diagnosis,
  condition: (a.condition as AdmissionCondition) || 'stable',
  admissionDate: a.admission_date,
  dischargeDate: a.discharge_date,
  lengthOfStayDays:
    a.length_of_stay_days === null || a.length_of_stay_days === undefined
      ? null
      : Number(a.length_of_stay_days),
  dischargeDiagnosis: a.discharge_diagnosis,
  dischargeInstructions: a.discharge_instructions,
  status: a.status,
  wardName: a.ward_name,
  bedNumber,
})

const mapOrder = (o: BackendOrder, extras?: { patientLabel?: string; bedLabel?: string }): InpatientOrder => ({
  orderId: o.order_id,
  admissionId: o.admission_id,
  patientId: o.patient_id,
  orderType: o.order_type,
  orderDetail: o.order_detail,
  frequency: o.frequency,
  startDate: o.start_date,
  endDate: o.end_date,
  orderedBy: o.ordered_by,
  status: o.status,
  orderedAt: o.ordered_at,
  patientLabel: extras?.patientLabel,
  bedLabel: extras?.bedLabel,
})

const mapNote = (n: BackendNote): NursingNote => ({
  noteId: n.note_id,
  admissionId: n.admission_id,
  patientId: n.patient_id,
  noteType: n.note_type,
  noteText: n.note_text,
  vitalsBp: n.vitals_bp,
  vitalsTemp: n.vitals_temp == null ? null : Number(n.vitals_temp),
  vitalsPulse: n.vitals_pulse,
  vitalsSpo2: n.vitals_spo2 == null ? null : Number(n.vitals_spo2),
  vitalsRespRate: n.vitals_resp_rate,
  authoredBy: n.authored_by,
  authoredAt: n.authored_at,
})

const mapVisitor = (v: BackendVisitor): WardVisitor => ({
  visitorId: v.visitor_id,
  admissionId: v.admission_id,
  patientId: v.patient_id,
  patientName: v.patient_name,
  bedLabel: v.bed_label,
  visitorName: v.visitor_name,
  visitorPhone: v.visitor_phone,
  relationship: v.relationship,
  nationalId: v.national_id,
  checkInAt: v.check_in_at,
  checkOutAt: v.check_out_at,
  approvedBy: v.approved_by,
  status: v.status,
  denialReason: v.denial_reason,
  allowedDurationMinutes: v.allowed_duration_minutes,
  wardName: v.ward_name,
  timeLeftSeconds: v.time_left_seconds,
})

const mapHandover = (h: BackendHandover): ShiftHandover => ({
  handoverId: h.handover_id,
  shiftLabel: h.shift_label,
  submittedBy: h.submitted_by,
  overallSummary: h.overall_summary,
  incidentsSummary: h.incidents_summary,
  patientCount: h.patient_count,
  patientNotes: h.patient_notes,
  wardName: h.ward_name,
  createdAt: h.created_at,
})

const shortId = (id: string) => (id ? id.slice(0, 8) : '—')

export const parseVisitDurationMinutes = (duration: string): number => {
  const lower = duration.toLowerCase()
  const num = parseInt(lower.replace(/[^0-9]/g, ''), 10)
  if (!Number.isFinite(num) || num <= 0) return 30
  if (lower.includes('hour')) return num * 60
  return num
}

export const wardService = {
  listBeds: (params?: {
    ward_name?: string
    bed_type?: string
    is_available?: boolean
    is_active?: boolean
  }): Promise<WardBed[]> =>
    apiClient
      .get<BackendBed[]>('/ward/beds', { params })
      .then((r) => r.data.map(mapBed)),

  getBedBoard: (): Promise<BedBoardWard[]> =>
    apiClient.get<BackendBedBoard>('/ward/beds/board').then((r) =>
      (r.data.wards ?? []).map((w) => ({
        wardName: w.ward_name,
        beds: w.beds.map((b) => ({
          bedId: b.bed_id,
          bedNumber: b.bed_number,
          bedType: b.bed_type,
          isAvailable: b.is_available,
          occupied: b.occupied,
        })),
      })),
    ),

  assignBed: (bedId: string, admissionId?: string): Promise<WardBed> =>
    apiClient
      .post<BackendBed>(`/ward/beds/${bedId}/assign`, {
        admission_id: admissionId ?? null,
      })
      .then((r) => mapBed(r.data)),

  releaseBed: (bedId: string): Promise<WardBed> =>
    apiClient.post<BackendBed>(`/ward/beds/${bedId}/release`).then((r) => mapBed(r.data)),

  listAdmissions: (params?: {
    status?: string
    patient_id?: string
    ward_name?: string
    limit?: number
    offset?: number
  }): Promise<Admission[]> =>
    apiClient.get<BackendAdmission[]>('/ward/admissions', { params }).then(async (r) => {
      const beds = await apiClient
        .get<BackendBed[]>('/ward/beds', { params: { is_active: true } })
        .then((br) => br.data)
        .catch(() => [] as BackendBed[])
      const bedMap = new Map(beds.map((b) => [b.bed_id, b.bed_number]))
      return r.data.map((a) => mapAdmission(a, bedMap.get(a.bed_id)))
    }),

  getAdmission: (admissionId: string): Promise<Admission> =>
    apiClient
      .get<BackendAdmission>(`/ward/admissions/${admissionId}`)
      .then((r) => mapAdmission(r.data)),

  createAdmission: (data: AdmissionCreate): Promise<Admission> =>
    apiClient
      .post<BackendAdmission>('/ward/admissions', {
        visit_id: data.visitId,
        bed_id: data.bedId,
        admitting_diagnosis: data.admittingDiagnosis,
      })
      .then((r) => mapAdmission(r.data)),

  dischargeAdmission: (admissionId: string, data: DischargeRequest): Promise<Admission> =>
    apiClient
      .post<BackendAdmission>(`/ward/admissions/${admissionId}/discharge`, {
        discharge_diagnosis: data.dischargeDiagnosis,
        discharge_instructions: data.dischargeInstructions ?? null,
      })
      .then((r) => mapAdmission(r.data)),

  getLengthOfStay: (admissionId: string) =>
    apiClient.get(`/ward/admissions/${admissionId}/los`).then((r) => r.data),

  updateCondition: (admissionId: string, condition: AdmissionCondition): Promise<Admission> =>
    apiClient
      .patch<BackendAdmission>(`/ward/admissions/${admissionId}/condition`, { condition })
      .then((r) => mapAdmission(r.data)),

  listOrders: (admissionId: string): Promise<InpatientOrder[]> =>
    apiClient
      .get<BackendOrder[]>(`/ward/admissions/${admissionId}/orders`)
      .then((r) => r.data.map((o) => mapOrder(o))),

  /** Load orders for all active admissions (UI aggregate view). */
  listActiveOrders: async (): Promise<InpatientOrder[]> => {
    const admissions = await wardService.listAdmissions({ status: 'active', limit: 200 })
    const batches = await Promise.all(
      admissions.map(async (adm) => {
        const orders = await wardService.listOrders(adm.admissionId).catch(() => [] as InpatientOrder[])
        return orders.map((o) => ({
          ...o,
          patientLabel: `Patient ${shortId(adm.patientId)}`,
          bedLabel: adm.bedNumber ? `Bed ${adm.bedNumber}` : adm.wardName || '—',
        }))
      }),
    )
    return batches.flat()
  },

  createOrder: (admissionId: string, data: OrderCreate): Promise<InpatientOrder> =>
    apiClient
      .post<BackendOrder>(`/ward/admissions/${admissionId}/orders`, {
        order_type: data.orderType.toLowerCase(),
        order_detail: data.orderDetail,
        frequency: data.frequency ?? null,
        start_date: data.startDate ?? null,
        end_date: data.endDate ?? null,
      })
      .then((r) => mapOrder(r.data)),

  updateOrder: (
    admissionId: string,
    orderId: string,
    data: Partial<{ orderDetail: string; frequency: string; status: string }>,
  ): Promise<InpatientOrder> => {
    const payload: Record<string, unknown> = {}
    if (data.orderDetail !== undefined) payload.order_detail = data.orderDetail
    if (data.frequency !== undefined) payload.frequency = data.frequency
    if (data.status !== undefined) payload.status = data.status.toLowerCase()
    return apiClient
      .patch<BackendOrder>(`/ward/admissions/${admissionId}/orders/${orderId}`, payload)
      .then((r) => mapOrder(r.data))
  },

  listNursingNotes: (admissionId: string): Promise<NursingNote[]> =>
    apiClient
      .get<BackendNote[]>(`/ward/admissions/${admissionId}/nursing-notes`)
      .then((r) => r.data.map(mapNote)),

  createNursingNote: (admissionId: string, data: NursingNoteCreate): Promise<NursingNote> =>
    apiClient
      .post<BackendNote>(`/ward/admissions/${admissionId}/nursing-notes`, {
        note_type: data.noteType,
        note_text: data.noteText,
        vitals_bp: data.vitalsBp ?? null,
        vitals_temp: data.vitalsTemp ?? null,
        vitals_pulse: data.vitalsPulse ?? null,
        vitals_spo2: data.vitalsSpo2 ?? null,
        vitals_resp_rate: data.vitalsRespRate ?? null,
      })
      .then((r) => mapNote(r.data)),

  /** Beds joined with active admissions for bed-map UI. */
  listBedsWithAdmissions: async (wardName?: string): Promise<WardBed[]> => {
    const [beds, admissions] = await Promise.all([
      wardService.listBeds({ ward_name: wardName, is_active: true }),
      wardService.listAdmissions({ status: 'active', ward_name: wardName, limit: 200 }),
    ])
    const byBed = new Map(admissions.map((a) => [a.bedId, a]))
    return beds.map((b) => {
      const adm = byBed.get(b.bedId)
      if (!adm) return b
      return {
        ...b,
        isAvailable: false,
        admissionId: adm.admissionId,
        patientId: adm.patientId,
        diagnosis: adm.admittingDiagnosis,
        admittingDoctorId: adm.admittingDoctorId,
        admissionDate: adm.admissionDate,
        condition: adm.condition,
      }
    })
  },

  getRecentPatients: (limit = 6): Promise<PatientListItem[]> =>
    apiClient
      .get<PatientListItem[]>('/consultation/patients/recent', { params: { limit } })
      .then((r) => r.data)
      .catch(async () => {
        const res = await receptionService.searchPatients('', 1, limit).catch(() => ({ patients: [], total: 0 }))
        return (res.patients || []).map((p) => ({
          id: p.id,
          patient_number: p.patient_number,
          full_name: p.full_name,
          date_of_birth: p.date_of_birth,
          gender: p.gender,
          phone_number: p.phone_primary,
          allergies: p.allergies,
        }))
      }),

  searchPatients: (query: string, page = 1, pageSize = 50): Promise<PatientSearchResponse> =>
    apiClient
      .get<PatientSearchResponse>('/consultation/patients', {
        params: { query, page, page_size: pageSize },
      })
      .then((r) => r.data)
      .catch(async () => {
        const res = await receptionService.searchPatients(query, page, pageSize)
        return {
          patients: (res.patients || []).map((p) => ({
            id: p.id,
            patient_number: p.patient_number,
            full_name: p.full_name,
            date_of_birth: p.date_of_birth,
            gender: p.gender,
            phone_number: p.phone_primary,
            allergies: p.allergies,
          })),
          total: res.total,
        }
      }),

  getPatientHistory: (patientId: string): Promise<PatientHistoryData> =>
    apiClient
      .get<PatientHistoryData>(`/consultation/encounters/patient/${patientId}/history`)
      .then((r) => r.data),

  getAdmissionDetails: (admissionId: string) =>
    apiClient
      .get(`/consultation/inpatient/admissions/${admissionId}`)
      .then((r) => r.data)
      .catch(() => wardService.getAdmission(admissionId)),

  getInpatientOrders: (admissionId: string) =>
    apiClient
      .get(`/consultation/inpatient/admissions/${admissionId}/orders`)
      .then((r) => r.data)
      .catch(() => wardService.listOrders(admissionId)),

  updateOrderStatus: (orderId: string, status: string) =>
    apiClient
      .patch(`/consultation/inpatient/orders/${orderId}`, { status })
      .then((r) => r.data)
      .catch(() => apiClient.patch(`/ward/orders/${orderId}/status`, { status }).then((r) => r.data)),

  issueInpatientOrder: (admissionId: string, data: any) =>
    apiClient
      .post(`/consultation/inpatient/admissions/${admissionId}/orders`, data)
      .then((r) => r.data)
      .catch(() => wardService.createOrder(admissionId, data)),

  getAdmittedPatients: () =>
    apiClient
      .get('/consultation/inpatient/admissions')
      .then((r) => r.data)
      .catch(() => wardService.listAdmissions({ status: 'active' })),

  dischargePatient: (admissionId: string, data: any) =>
    apiClient
      .post(`/consultation/inpatient/admissions/${admissionId}/discharge`, data)
      .then((r) => r.data)
      .catch(() => wardService.dischargeAdmission(admissionId, data)),

  listVisitors: (params?: { status?: string; active_only?: boolean; limit?: number }): Promise<WardVisitor[]> =>
    apiClient
      .get<BackendVisitor[]>('/ward/visitors', { params })
      .then((r) => r.data.map(mapVisitor)),

  listActiveVisitors: (): Promise<WardVisitor[]> =>
    apiClient
      .get<BackendVisitor[]>('/ward/visitors/active')
      .then((r) => r.data.map(mapVisitor)),

  createVisitor: (data: VisitorCreate): Promise<WardVisitor> =>
    apiClient
      .post<BackendVisitor>('/ward/visitors', {
        admission_id: data.admissionId ?? null,
        patient_name: data.patientName,
        bed_label: data.bedLabel,
        visitor_name: data.visitorName,
        visitor_phone: data.visitorPhone ?? null,
        relationship: data.relationship,
        national_id: data.nationalId ?? null,
        approved: data.approved,
        denial_reason: data.denialReason ?? null,
        allowed_duration_minutes: data.allowedDurationMinutes ?? 30,
        ward_name: data.wardName ?? null,
      })
      .then((r) => mapVisitor(r.data)),

  checkoutVisitor: (visitorId: string): Promise<WardVisitor> =>
    apiClient
      .post<BackendVisitor>(`/ward/visitors/${visitorId}/checkout`)
      .then((r) => mapVisitor(r.data)),

  listHandovers: (limit = 50): Promise<ShiftHandover[]> =>
    apiClient
      .get<BackendHandover[]>('/ward/handovers', { params: { limit } })
      .then((r) => r.data.map(mapHandover)),

  createHandover: (data: HandoverCreate): Promise<ShiftHandover> =>
    apiClient
      .post<BackendHandover>('/ward/handovers', {
        shift_label: data.shiftLabel,
        overall_summary: data.overallSummary,
        incidents_summary: data.incidentsSummary ?? null,
        patient_notes: data.patientNotes,
        ward_name: data.wardName ?? null,
      })
      .then((r) => mapHandover(r.data)),
}

export interface PatientListItem {
  id: string
  patient_number: string
  full_name: string
  date_of_birth: string
  gender: string
  phone_number?: string
  allergies?: string
}

export interface PatientSearchResponse {
  patients: PatientListItem[]
  total: number
}

export interface PatientHistoryData {
  patient: {
    id: string
    patient_number: string
    full_name: string
    date_of_birth: string
    gender: string
    phone_primary?: string
    phone_secondary?: string
    email?: string
    address?: string
    national_id?: string
    blood_group?: string
    allergies?: string
  }
  total_visits: number
  last_visit_date: string | null
  active_conditions: string[]
  previous_visits: Array<{
    visit_id: string
    created_at: string
    visit_type?: string
    status?: string
    triage?: {
      vitals_bp?: string
      vitals_pulse?: number
      vitals_temp?: number
      vitals_spo2?: number
      priority?: string
    } | null
    consultation?: {
      consultation_id?: string
      presenting_history?: string
      examination_findings?: string
      clinical_impression?: string
      disposition?: string
      referral_type?: string
      referral_notes?: string
      admission_reason?: string
      discharge_instructions?: string
      follow_up_date?: string
      return_date?: string
      return_reason?: string
      diagnoses?: Array<{
        diagnosis_type?: string
        diagnosis_name?: string
        icd_code?: string
      }>
      investigations?: Array<{
        test_name?: string
        request_type?: string
        status?: string
        result?: string
      }>
      prescriptions?: Array<{
        drug_name?: string
        dosage?: string
        frequency?: string
        duration?: string
      }>
    } | null
  }>
}

