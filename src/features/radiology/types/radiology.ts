export type {
  ImagingModality,
  ImagingRequestStatus,
  ImagingRequest,
  ImagingRequestSummary,
} from '@/api/types/radiology'

export interface RadiologyDashboardStats {
  pending: number
  scheduledToday: number
  inProgress: number
  reportsDue: number
}

export interface ImagingScheduleItem {
  id: string
  time: string
  patientName: string
  patientNumber: string
  modality: string
  requestId?: string
}

export interface ReportDueItem {
  id: string
  requestId: string
  patientName: string
  modality: string
  completedAt: string
}

export interface ModalityBreakdownItem {
  modality: string
  sessions: number
  barPercent: number
}

export type EquipmentStatus = 'optimal' | 'online' | 'maintenance'

export interface EquipmentItem {
  id: string
  name: string
  status: EquipmentStatus
}

export interface ReportAttachment {
  id: string
  fileName: string
  fileSize: string
}

export type ScheduleModality = 'x-ray' | 'ct-scan' | 'mri' | 'ultrasound'

export interface ImagingScheduleAppointment {
  id: string
  patientName: string
  dateOfBirth: string
  age: string
  modality: ScheduleModality
  bodyPart: string
  departmentLabel: string
  dayIndex: number
  startHour: number
  startMinute: number
  durationMinutes: number
  clinicalIndication: string
  priority: 'routine' | 'urgent' | 'stat'
  requestId?: string
}

export interface ScheduleWeekDay {
  label: string
  date: number
  month: number
  year: number
  isToday: boolean
}

export type ImagingRequestAction = 'start' | 'schedule' | 'enter-report' | 'view-record'
