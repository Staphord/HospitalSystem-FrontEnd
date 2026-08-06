import { apiClient } from '@/api/client'
import type {
  EnterReportPayload,
  ImagingModality,
  ImagingRequest,
  ImagingRequestStatus,
  ImagingRequestSummary,
  RadiologyReport,
  ScheduleImagingPayload,
} from '@/api/types/radiology'

// ---------------------------------------------------------------------------
// Backend wire formats (radiology-service via gateway /radiology/*)
// ---------------------------------------------------------------------------

interface BackendListItem {
  request_id: string
  test_name: string
  clinical_indication?: string | null
  urgency: string
  status: string
  requested_by?: string | null
  requested_at: string
  patient_name: string
  patient_number: string
  visit_id: string
  visit_number: string
  report_id?: string | null
  report_status?: string | null
  modality?: string | null
  scheduled_at?: string | null
}

interface BackendListResponse {
  requests: BackendListItem[]
  total: number
}

interface BackendPatient {
  patient_id: string
  patient_number: string
  full_name: string
  date_of_birth: string
  gender: string
  phone?: string | null
  allergies?: string | null
}

interface BackendVisit {
  visit_id: string
  visit_number: string
  visit_date: string
  visit_type: string
  payment_type: string
}

interface BackendReport {
  report_id: string
  request_id: string
  visit_id: string
  patient_id: string
  modality: string
  body_part?: string | null
  scheduled_at?: string | null
  performed_at?: string | null
  findings?: string | null
  impression?: string | null
  image_reference?: string | null
  performed_by: string
  reported_by?: string | null
  status: string
  reported_at?: string | null
  created_at: string
  updated_at: string
}

interface BackendDetail {
  request_id: string
  test_name: string
  request_type: string
  clinical_indication?: string | null
  urgency: string
  requested_by?: string | null
  requested_at: string
  status: string
  patient: BackendPatient
  visit: BackendVisit
  report?: BackendReport | null
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

const FE_TO_BE_MODALITY: Record<ImagingModality, string> = {
  'x-ray': 'xray',
  'ct-scan': 'ct',
  mri: 'mri',
  ultrasound: 'ultrasound',
}

const BE_TO_FE_MODALITY: Record<string, ImagingModality> = {
  xray: 'x-ray',
  'x-ray': 'x-ray',
  ct: 'ct-scan',
  'ct-scan': 'ct-scan',
  mri: 'mri',
  ultrasound: 'ultrasound',
  fluoroscopy: 'x-ray',
  mammography: 'x-ray',
  other: 'x-ray',
}

function mapModality(modality?: string | null, testName?: string): ImagingModality {
  if (modality && BE_TO_FE_MODALITY[modality.toLowerCase()]) {
    return BE_TO_FE_MODALITY[modality.toLowerCase()]
  }
  const t = (testName || '').toLowerCase()
  if (t.includes('ct')) return 'ct-scan'
  if (t.includes('mri')) return 'mri'
  if (t.includes('ultra')) return 'ultrasound'
  return 'x-ray'
}

function mapUiStatus(
  requestStatus: string,
  reportStatus?: string | null,
): ImagingRequestStatus {
  if (
    requestStatus === 'completed' ||
    reportStatus === 'reported' ||
    reportStatus === 'verified'
  ) {
    return 'complete'
  }
  if (requestStatus === 'in_progress' || reportStatus === 'performed') {
    return 'in-progress'
  }
  if (reportStatus === 'scheduled') {
    return 'scheduled'
  }
  return 'requested'
}

function ageFromDob(dob?: string | null): string {
  if (!dob) return '—'
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return '—'
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1
  return `${age}Y`
}

function mapSex(gender?: string | null): string {
  const g = (gender || '').toLowerCase()
  if (g.startsWith('m')) return 'M'
  if (g.startsWith('f')) return 'F'
  return g ? g.charAt(0).toUpperCase() : '—'
}

function formatRequestedAt(iso: string): { time: string; date: string } {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { time: iso, date: '' }
  return {
    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: d.toISOString().slice(0, 10),
  }
}

function mapListItem(item: BackendListItem): ImagingRequest {
  const { time, date } = formatRequestedAt(item.requested_at)
  const status = mapUiStatus(item.status, item.report_status)
  return {
    id: item.request_id,
    patientName: item.patient_name,
    patientNumber: item.patient_number,
    age: '—',
    sex: '—',
    modality: mapModality(item.modality, item.test_name),
    bodyPart: item.test_name || '—',
    clinicalIndication: item.clinical_indication || '',
    requestedBy: item.requested_by || 'Doctor',
    requestedAt: time,
    requestedDate: date,
    status,
    visitId: item.visit_id,
    reportId: item.report_id ?? undefined,
    reportStatus: item.report_status ?? undefined,
    urgency: (item.urgency as ImagingRequest['urgency']) || 'routine',
    scheduledAt: item.scheduled_at ?? undefined,
    testName: item.test_name,
  }
}

function mapDetail(detail: BackendDetail): ImagingRequest {
  const { time, date } = formatRequestedAt(detail.requested_at)
  const report = detail.report
  return {
    id: detail.request_id,
    patientName: detail.patient.full_name,
    patientNumber: detail.patient.patient_number,
    age: ageFromDob(detail.patient.date_of_birth),
    sex: mapSex(detail.patient.gender),
    modality: mapModality(report?.modality, detail.test_name),
    bodyPart: report?.body_part || detail.test_name || '—',
    clinicalIndication: detail.clinical_indication || '',
    requestedBy: detail.requested_by || 'Doctor',
    requestedAt: time,
    requestedDate: date,
    status: mapUiStatus(detail.status, report?.status),
    findings: report?.findings ?? undefined,
    impression: report?.impression ?? undefined,
    imageReference: report?.image_reference ?? undefined,
    visitId: detail.visit.visit_id,
    reportId: report?.report_id,
    reportStatus: report?.status,
    urgency: (detail.urgency as ImagingRequest['urgency']) || 'routine',
    scheduledAt: report?.scheduled_at ?? undefined,
    testName: detail.test_name,
  }
}

function mapReport(r: BackendReport): RadiologyReport {
  return {
    reportId: r.report_id,
    requestId: r.request_id,
    visitId: r.visit_id,
    patientId: r.patient_id,
    modality: r.modality,
    bodyPart: r.body_part ?? undefined,
    scheduledAt: r.scheduled_at ?? undefined,
    performedAt: r.performed_at ?? undefined,
    findings: r.findings ?? undefined,
    impression: r.impression ?? undefined,
    imageReference: r.image_reference ?? undefined,
    performedBy: r.performed_by,
    reportedBy: r.reported_by ?? undefined,
    status: r.status,
    reportedAt: r.reported_at ?? undefined,
  }
}

function toBackendStatusFilter(status?: ImagingRequestStatus | 'all'): string | undefined {
  if (!status || status === 'all') return undefined
  switch (status) {
    case 'requested':
      return 'pending'
    case 'in-progress':
      return 'in_progress'
    case 'complete':
      return 'completed'
    case 'scheduled':
      // Scheduled is derived from report; fetch pending and filter client-side
      return undefined
    default:
      return undefined
  }
}

function buildSummary(requests: ImagingRequest[]): ImagingRequestSummary {
  const today = new Date().toISOString().slice(0, 10)
  return {
    newRequests: requests.filter((r) => r.status === 'requested').length,
    scheduled: requests.filter((r) => r.status === 'scheduled').length,
    inProgress: requests.filter((r) => r.status === 'in-progress').length,
    completedToday: requests.filter(
      (r) => r.status === 'complete' && r.requestedDate === today,
    ).length,
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const radiologyService = {
  listRequests: async (params?: {
    status?: ImagingRequestStatus | 'all'
    urgency?: string
    search?: string
    skip?: number
    limit?: number
  }): Promise<{ requests: ImagingRequest[]; total: number; summary: ImagingRequestSummary }> => {
    const statusParam = toBackendStatusFilter(params?.status)
    const { data } = await apiClient.get<BackendListResponse>('/radiology/requests', {
      params: {
        status: statusParam,
        urgency: params?.urgency,
        search: params?.search,
        skip: params?.skip ?? 0,
        limit: params?.limit ?? 200,
      },
    })
    let requests = (data.requests ?? []).map(mapListItem)
    if (params?.status === 'scheduled') {
      requests = requests.filter((r) => r.status === 'scheduled')
    } else if (params?.status && params.status !== 'all') {
      requests = requests.filter((r) => r.status === params.status)
    }
    return {
      requests,
      total: params?.status === 'scheduled' ? requests.length : data.total,
      summary: buildSummary(requests),
    }
  },

  getRequest: (requestId: string): Promise<ImagingRequest> =>
    apiClient
      .get<BackendDetail>(`/radiology/requests/${requestId}`)
      .then((r) => mapDetail(r.data)),

  scheduleRequest: (requestId: string, payload: ScheduleImagingPayload): Promise<RadiologyReport> =>
    apiClient
      .post<BackendReport>(`/radiology/requests/${requestId}/schedule`, {
        modality: FE_TO_BE_MODALITY[payload.modality],
        body_part: payload.bodyPart,
        scheduled_at: payload.scheduledAt,
      })
      .then((r) => mapReport(r.data)),

  performRequest: (requestId: string): Promise<RadiologyReport> =>
    apiClient
      .post<BackendReport>(`/radiology/requests/${requestId}/perform`, {})
      .then((r) => mapReport(r.data)),

  enterReport: (requestId: string, payload: EnterReportPayload): Promise<RadiologyReport> =>
    apiClient
      .put<BackendReport>(`/radiology/requests/${requestId}/report`, {
        findings: payload.findings,
        impression: payload.impression,
        image_reference: payload.imageReference,
      })
      .then((r) => mapReport(r.data)),

  getRequestReport: (requestId: string): Promise<RadiologyReport> =>
    apiClient
      .get<BackendReport>(`/radiology/requests/${requestId}/report`)
      .then((r) => mapReport(r.data)),

  verifyReport: (reportId: string): Promise<RadiologyReport> =>
    apiClient
      .patch<BackendReport>(`/radiology/reports/${reportId}/verify`)
      .then((r) => mapReport(r.data)),
}
