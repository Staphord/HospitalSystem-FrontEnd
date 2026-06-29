export type PrescriptionBillingStatus = 'cleared' | 'awaiting_clearance' | 'not_cleared'

export interface PrescriptionQueueItem {
  id: string
  patientName: string
  patientNumber: string
  medicationCount: number
  prescribedBy: string
  prescribedAt: string
  billingStatus: PrescriptionBillingStatus
  interactionNote?: string
}

export const PRESCRIPTION_QUEUE_STATS = {
  pending: 7,
  billingCleared: 5,
  awaitingClearance: 2,
  drugInteractions: 1,
} as const

export const PRESCRIPTION_QUEUE_ITEMS: PrescriptionQueueItem[] = [
  {
    id: 'rx-9012',
    patientName: 'Sarah Juma',
    patientNumber: '#PT-9012',
    medicationCount: 3,
    prescribedBy: 'Dr. Mrema',
    prescribedAt: '08:30 AM',
    billingStatus: 'cleared',
  },
  {
    id: 'rx-4432',
    patientName: 'Hamisi Bakari',
    patientNumber: '#PT-4432',
    medicationCount: 1,
    prescribedBy: 'Dr. Baraka',
    prescribedAt: '09:15 AM',
    billingStatus: 'awaiting_clearance',
  },
  {
    id: 'rx-1029',
    patientName: 'Fatuma Said',
    patientNumber: '#PT-1029',
    medicationCount: 4,
    prescribedBy: 'Dr. Mrema',
    prescribedAt: '10:05 AM',
    billingStatus: 'cleared',
    interactionNote: 'Potential ACEi/Potassium sparing interaction',
  },
  {
    id: 'rx-8812',
    patientName: 'Anna Mwakesege',
    patientNumber: '#PT-8812',
    medicationCount: 5,
    prescribedBy: 'Dr. Sarah',
    prescribedAt: '10:45 AM',
    billingStatus: 'not_cleared',
  },
]

export const PRESCRIPTION_QUEUE_TOTAL = 48
