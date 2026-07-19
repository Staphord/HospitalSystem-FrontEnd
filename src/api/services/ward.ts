import { apiClient } from '@/api/client'
import type {
  Admission,
  AdmissionCreate,
  BedBoardWard,
  DischargeRequest,
  InpatientOrder,
  NursingNote,
  NursingNoteCreate,
  OrderCreate,
  WardBed,
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
  authoredBy: n.authored_by,
  authoredAt: n.authored_at,
})

const shortId = (id: string) => (id ? id.slice(0, 8) : '—')

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
      }
    })
  },
}
