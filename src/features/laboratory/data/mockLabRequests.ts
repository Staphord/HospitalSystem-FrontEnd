import type { LabRequestSummary, LabTestRequest } from '@/features/laboratory/types/laboratory'

export const LAB_REQUEST_SUMMARY: LabRequestSummary = {
  pending: 11,
  stat: 2,
  urgent: 4,
  inProgress: 3,
  completedToday: 28,
}

const BASE_REQUESTS: LabTestRequest[] = [
  {
    id: 'rq-stat-1',
    patientName: 'Fatuma Said',
    patientNumber: 'PT-4891',
    testName: 'Troponin',
    requestedBy: 'Dr. Amina Hassan',
    requestedAt: '09:15',
    priority: 'stat',
    specimenStatus: 'collected',
    status: 'pending',
  },
  {
    id: 'rq-2',
    patientName: 'Hassan Mwita',
    patientNumber: 'PT-4889',
    testName: 'Full Blood Count',
    requestedBy: 'Dr. Amina Hassan',
    requestedAt: '09:22',
    priority: 'routine',
    specimenStatus: 'not_collected',
    status: 'pending',
  },
  {
    id: 'rq-3',
    patientName: 'Grace Kimaro',
    patientNumber: 'PT-4892',
    testName: 'Urinalysis',
    requestedBy: 'Dr. Baraka',
    requestedAt: '09:45',
    priority: 'routine',
    specimenStatus: 'collected',
    status: 'processing',
  },
  {
    id: 'rq-4',
    patientName: 'Amina Juma',
    patientNumber: 'PT-1029',
    testName: 'Complete Blood Count (CBC)',
    requestedBy: 'Dr. Kamau',
    requestedAt: '09:05',
    priority: 'stat',
    specimenStatus: 'collected',
    status: 'pending',
  },
  {
    id: 'rq-5',
    patientName: 'Emanuel Mollel',
    patientNumber: 'PT-3841',
    testName: 'Electrolytes Panel',
    requestedBy: 'Dr. Shirima',
    requestedAt: '09:00',
    priority: 'urgent',
    specimenStatus: 'not_collected',
    status: 'pending',
  },
  {
    id: 'rq-6',
    patientName: 'Joseph Mwinyi',
    patientNumber: 'PT-9201',
    testName: 'CRP',
    requestedBy: 'Dr. Kamau',
    requestedAt: '08:55',
    priority: 'urgent',
    specimenStatus: 'collected',
    status: 'processing',
  },
  {
    id: 'rq-7',
    patientName: 'Zuwena Salum',
    patientNumber: 'PT-5521',
    testName: 'Lipid Panel',
    requestedBy: 'Dr. Baraka',
    requestedAt: '08:40',
    priority: 'routine',
    specimenStatus: 'collected',
    status: 'processing',
  },
  {
    id: 'rq-8',
    patientName: 'Hamza Bakari',
    patientNumber: 'PT-0045',
    testName: 'Liver Function Test',
    requestedBy: 'Dr. Amina Hassan',
    requestedAt: '08:30',
    priority: 'routine',
    specimenStatus: 'collected',
    status: 'completed',
  },
]

const EXTRA_TESTS = [
  'Thyroid Profile',
  'HbA1c',
  'Blood Glucose',
  'Renal Function Panel',
  'Coagulation Profile',
  'Malaria RDT',
  'HIV Screening',
  'Hepatitis B Surface Antigen',
]

const EXTRA_PATIENTS = [
  { name: 'Faustina Mwita', number: 'PT-1102' },
  { name: 'David Kessi', number: 'PT-2210' },
  { name: 'Zainab Ally', number: 'PT-3308' },
  { name: 'Thomas Massawe', number: 'PT-4415' },
  { name: 'Bakari Juma', number: 'PT-5520' },
  { name: 'Abeid Mariam', number: 'PT-6631' },
  { name: 'John Bocco', number: 'PT-7742' },
  { name: 'Fatuma Ali', number: 'PT-8853' },
]

const DOCTORS = ['Dr. Kamau', 'Dr. Shirima', 'Dr. Baraka', 'Dr. Amina Hassan']

function buildExtraRequests(): LabTestRequest[] {
  const extras: LabTestRequest[] = []
  for (let i = 0; i < 24; i++) {
    const patient = EXTRA_PATIENTS[i % EXTRA_PATIENTS.length]
    const hour = 7 + Math.floor(i / 4)
    const minute = (i * 7) % 60
    extras.push({
      id: `rq-extra-${i + 9}`,
      patientName: patient.name,
      patientNumber: patient.number,
      testName: EXTRA_TESTS[i % EXTRA_TESTS.length],
      requestedBy: DOCTORS[i % DOCTORS.length],
      requestedAt: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      priority: i % 7 === 0 ? 'stat' : i % 5 === 0 ? 'urgent' : 'routine',
      specimenStatus: i % 2 === 0 ? 'collected' : 'not_collected',
      status: i % 4 === 0 ? 'completed' : i % 4 === 1 ? 'processing' : 'pending',
    })
  }
  return extras
}

export const MOCK_LAB_REQUESTS: LabTestRequest[] = [...BASE_REQUESTS, ...buildExtraRequests()]
