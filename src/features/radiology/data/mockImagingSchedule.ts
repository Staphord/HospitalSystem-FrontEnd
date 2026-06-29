import type { ImagingScheduleAppointment, ScheduleWeekDay } from '@/features/radiology/types/radiology'

export const SCHEDULE_START_HOUR = 8
export const SCHEDULE_END_HOUR = 18
export const SCHEDULE_ROW_HEIGHT_PX = 96

export const DEMO_WEEK_DAYS: ScheduleWeekDay[] = [
  { label: 'MON', date: 15, month: 4, year: 2024, isToday: false },
  { label: 'TUE', date: 16, month: 4, year: 2024, isToday: false },
  { label: 'WED', date: 17, month: 4, year: 2024, isToday: true },
  { label: 'THU', date: 18, month: 4, year: 2024, isToday: false },
  { label: 'FRI', date: 19, month: 4, year: 2024, isToday: false },
]

export const DEMO_WEEK_LABEL = 'May 15 — May 19, 2024'

export const IMAGING_SCHEDULE_APPOINTMENTS: ImagingScheduleAppointment[] = [
  {
    id: 'appt-1',
    patientName: 'Robert Jameson',
    dateOfBirth: '12/05/1984',
    age: '39y',
    modality: 'x-ray',
    bodyPart: 'Chest',
    departmentLabel: 'X-Ray Department',
    dayIndex: 0,
    startHour: 8,
    startMinute: 0,
    durationMinutes: 45,
    clinicalIndication:
      'Persistent cough, r/o pneumonia. Previous imaging shows mild congestion. Patient is non-smoker.',
    priority: 'routine',
    requestId: 'img-1',
  },
  {
    id: 'appt-2',
    patientName: 'Maria Alvarez',
    dateOfBirth: '03/22/1971',
    age: '53y',
    modality: 'ct-scan',
    bodyPart: 'Abdomen w/ Contrast',
    departmentLabel: 'CT Department',
    dayIndex: 1,
    startHour: 9,
    startMinute: 0,
    durationMinutes: 75,
    clinicalIndication: 'Acute abdominal pain with elevated lipase. Rule out pancreatitis.',
    priority: 'urgent',
  },
  {
    id: 'appt-3',
    patientName: 'Jonathan Smith',
    dateOfBirth: '08/14/1965',
    age: '58y',
    modality: 'mri',
    bodyPart: 'Lumbar Spine',
    departmentLabel: 'MRI Department',
    dayIndex: 2,
    startHour: 8,
    startMinute: 15,
    durationMinutes: 90,
    clinicalIndication: 'Chronic lower back pain with radiculopathy. Post-operative follow-up.',
    priority: 'routine',
    requestId: 'img-3',
  },
  {
    id: 'appt-4',
    patientName: 'Emily Wilson',
    dateOfBirth: '11/30/1988',
    age: '35y',
    modality: 'ultrasound',
    bodyPart: 'Carotid',
    departmentLabel: 'Ultrasound Department',
    dayIndex: 3,
    startHour: 10,
    startMinute: 30,
    durationMinutes: 30,
    clinicalIndication: 'Carotid bruit on examination. Evaluate for stenosis.',
    priority: 'routine',
  },
  {
    id: 'appt-5',
    patientName: 'Lee Thompson',
    dateOfBirth: '06/02/1959',
    age: '64y',
    modality: 'ct-scan',
    bodyPart: 'Head',
    departmentLabel: 'CT Department',
    dayIndex: 4,
    startHour: 13,
    startMinute: 0,
    durationMinutes: 60,
    clinicalIndication: 'Head trauma following fall. Rule out intracranial bleed.',
    priority: 'stat',
    requestId: 'img-8',
  },
]
