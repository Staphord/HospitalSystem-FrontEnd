import type {
  EquipmentItem,
  ImagingScheduleItem,
  ModalityBreakdownItem,
  RadiologyDashboardStats,
  ReportDueItem,
} from '@/features/radiology/types/radiology'

export const RADIOLOGY_DASHBOARD_STATS: RadiologyDashboardStats = {
  pending: 5,
  scheduledToday: 8,
  inProgress: 2,
  reportsDue: 3,
}

export const TODAYS_IMAGING_SCHEDULE: ImagingScheduleItem[] = [
  {
    id: 'sch-1',
    time: '09:00 AM',
    patientName: 'Fatuma Said',
    patientNumber: 'PT-4891',
    modality: 'X-Ray (Chest)',
    requestId: 'img-1',
  },
  {
    id: 'sch-2',
    time: '10:00 AM',
    patientName: 'Sarah Mwangi',
    patientNumber: '#MNH-2210',
    modality: 'MRI Brain',
    requestId: 'img-3',
  },
  {
    id: 'sch-3',
    time: '09:30 AM',
    patientName: 'Hamisi Shaban',
    patientNumber: '#MNH-5567',
    modality: 'CT Head',
    requestId: 'img-8',
  },
  {
    id: 'sch-4',
    time: '01:15 PM',
    patientName: 'Kassim Suleiman',
    patientNumber: '#MNH-1029',
    modality: 'MRI Lumbar',
    requestId: 'img-6',
  },
]

export const REPORTS_DUE: ReportDueItem[] = [
  {
    id: 'rep-1',
    requestId: 'img-9',
    patientName: 'Anna Mwakesege',
    modality: 'X-Ray Pelvis',
    completedAt: '10:45 AM',
  },
  {
    id: 'rep-2',
    requestId: 'img-8',
    patientName: 'Hamisi Shaban',
    modality: 'CT Head',
    completedAt: '08:30 AM',
  },
  {
    id: 'rep-3',
    requestId: 'img-7',
    patientName: 'Joyce Mboya',
    modality: 'Ultrasound Breast',
    completedAt: 'Yesterday',
  },
]

export const MODALITY_BREAKDOWN: ModalityBreakdownItem[] = [
  { modality: 'X-Ray', sessions: 6, barPercent: 75 },
  { modality: 'Ultrasound', sessions: 4, barPercent: 50 },
  { modality: 'CT', sessions: 2, barPercent: 25 },
  { modality: 'MRI', sessions: 1, barPercent: 12.5 },
]

export const EQUIPMENT_STATUS: EquipmentItem[] = [
  { id: 'eq-1', name: 'X-Ray Room 1', status: 'optimal' },
  { id: 'eq-2', name: 'CT Scanner G-3', status: 'online' },
  { id: 'eq-3', name: 'MRI Room 4', status: 'maintenance' },
]
