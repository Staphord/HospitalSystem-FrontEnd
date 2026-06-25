import type { PrescriptionBillingStatus } from '@/features/pharmacy/data/mockPrescriptionQueue'
import { PRESCRIPTION_QUEUE_ITEMS } from '@/features/pharmacy/data/mockPrescriptionQueue'

export interface PrescriptionLineItem {
  id: string
  drugName: string
  category: string
  dose: string
  frequency: string
  duration: string
  qtyToDispense: number
  stockAvailable: number
  stockLevel: 'ok' | 'low'
  defaultDispense: boolean
  labelInstructions: string
  hasInteraction?: boolean
  labelDeptSubtitle?: string
}

export interface DrugInteractionDetail {
  drugA: string
  drugB: string
  severity: string
}

export interface DispensePrescriptionDetail {
  id: string
  patientName: string
  patientNumber: string
  age: number
  gender: string
  billingStatus: PrescriptionBillingStatus
  prescribedBy: string
  prescribedAt: string
  interaction?: DrugInteractionDetail
  items: PrescriptionLineItem[]
}

const DISPENSE_DETAILS: Record<string, DispensePrescriptionDetail> = {
  'rx-1029': {
    id: 'rx-1029',
    patientName: 'Fatuma Said',
    patientNumber: 'PT-4891',
    age: 45,
    gender: 'Female',
    billingStatus: 'cleared',
    prescribedBy: 'Dr. Mrema',
    prescribedAt: '10:05 AM',
    interaction: {
      drugA: 'Warfarin',
      drugB: 'Ibuprofen',
      severity: 'HIGH SEVERITY',
    },
    items: [
      {
        id: 'line-1',
        drugName: 'Warfarin 5mg Tablets',
        category: 'Anticoagulant',
        dose: '5mg',
        frequency: 'OD',
        duration: '30 Days',
        qtyToDispense: 30,
        stockAvailable: 450,
        stockLevel: 'ok',
        defaultDispense: true,
        labelInstructions: 'Take ONE tablet daily (OD) for 30 days.',
      },
      {
        id: 'line-2',
        drugName: 'Ibuprofen 400mg',
        category: 'NSAID',
        dose: '400mg',
        frequency: 'TID',
        duration: '7 Days',
        qtyToDispense: 21,
        stockAvailable: 12,
        stockLevel: 'low',
        defaultDispense: false,
        labelInstructions: 'Take ONE tablet three times daily (TID) after meals for 7 days.',
        hasInteraction: true,
      },
      {
        id: 'line-3',
        drugName: 'Omeprazole 20mg',
        category: 'PPI',
        dose: '20mg',
        frequency: 'OD',
        duration: '30 Days',
        qtyToDispense: 30,
        stockAvailable: 1200,
        stockLevel: 'ok',
        defaultDispense: true,
        labelInstructions: 'Take ONE capsule daily (OD) before breakfast.',
        labelDeptSubtitle: 'Pharmacy Dept',
      },
    ],
  },
  'rx-9012': {
    id: 'rx-9012',
    patientName: 'Sarah Juma',
    patientNumber: 'PT-9012',
    age: 32,
    gender: 'Female',
    billingStatus: 'cleared',
    prescribedBy: 'Dr. Mrema',
    prescribedAt: '08:30 AM',
    items: [
      {
        id: 'line-1',
        drugName: 'Amoxicillin 500mg',
        category: 'Antibiotic',
        dose: '500mg',
        frequency: 'TID',
        duration: '7 Days',
        qtyToDispense: 21,
        stockAvailable: 340,
        stockLevel: 'ok',
        defaultDispense: true,
        labelInstructions: 'Take ONE capsule three times daily (TID) for 7 days.',
      },
      {
        id: 'line-2',
        drugName: 'Paracetamol 500mg',
        category: 'Analgesic',
        dose: '500mg',
        frequency: 'QID',
        duration: '5 Days',
        qtyToDispense: 20,
        stockAvailable: 800,
        stockLevel: 'ok',
        defaultDispense: true,
        labelInstructions: 'Take ONE tablet four times daily (QID) when needed for pain.',
      },
    ],
  },
}

function buildFallbackDetail(queueId: string): DispensePrescriptionDetail | undefined {
  const queueItem = PRESCRIPTION_QUEUE_ITEMS.find((item) => item.id === queueId)
  if (!queueItem || queueItem.billingStatus !== 'cleared') return undefined

  const patientNumber = queueItem.patientNumber.replace('#', '')

  return {
    id: queueItem.id,
    patientName: queueItem.patientName,
    patientNumber,
    age: 38,
    gender: 'Male',
    billingStatus: queueItem.billingStatus,
    prescribedBy: queueItem.prescribedBy,
    prescribedAt: queueItem.prescribedAt,
    items: [
      {
        id: 'line-1',
        drugName: 'Generic Medication 250mg',
        category: 'General',
        dose: '250mg',
        frequency: 'BD',
        duration: '14 Days',
        qtyToDispense: 28,
        stockAvailable: 200,
        stockLevel: 'ok',
        defaultDispense: true,
        labelInstructions: 'Take as directed by your physician.',
      },
    ],
  }
}

export function getDispensePrescriptionById(id: string): DispensePrescriptionDetail | undefined {
  if (DISPENSE_DETAILS[id]) return DISPENSE_DETAILS[id]
  return buildFallbackDetail(id)
}

const PRESCRIPTION_VIEW_DETAILS: Record<string, DispensePrescriptionDetail> = {
  ...DISPENSE_DETAILS,
  'rx-4432': {
    id: 'rx-4432',
    patientName: 'Hamisi Bakari',
    patientNumber: 'PT-4432',
    age: 28,
    gender: 'Male',
    billingStatus: 'awaiting_clearance',
    prescribedBy: 'Dr. Baraka',
    prescribedAt: '09:15 AM',
    items: [
      {
        id: 'line-1',
        drugName: 'Metformin 500mg',
        category: 'Antidiabetic',
        dose: '500mg',
        frequency: 'BD',
        duration: '30 Days',
        qtyToDispense: 60,
        stockAvailable: 520,
        stockLevel: 'ok',
        defaultDispense: true,
        labelInstructions: 'Take ONE tablet twice daily (BD) with meals.',
      },
    ],
  },
  'rx-8812': {
    id: 'rx-8812',
    patientName: 'Anna Mwakesege',
    patientNumber: 'PT-8812',
    age: 52,
    gender: 'Female',
    billingStatus: 'not_cleared',
    prescribedBy: 'Dr. Sarah',
    prescribedAt: '10:45 AM',
    items: [
      {
        id: 'line-1',
        drugName: 'Amlodipine 5mg',
        category: 'Antihypertensive',
        dose: '5mg',
        frequency: 'OD',
        duration: '30 Days',
        qtyToDispense: 30,
        stockAvailable: 310,
        stockLevel: 'ok',
        defaultDispense: true,
        labelInstructions: 'Take ONE tablet daily (OD) in the morning.',
      },
      {
        id: 'line-2',
        drugName: 'Hydrochlorothiazide 25mg',
        category: 'Diuretic',
        dose: '25mg',
        frequency: 'OD',
        duration: '30 Days',
        qtyToDispense: 30,
        stockAvailable: 180,
        stockLevel: 'ok',
        defaultDispense: true,
        labelInstructions: 'Take ONE tablet daily (OD) in the morning.',
      },
      {
        id: 'line-3',
        drugName: 'Atorvastatin 20mg',
        category: 'Statin',
        dose: '20mg',
        frequency: 'OD',
        duration: '30 Days',
        qtyToDispense: 30,
        stockAvailable: 95,
        stockLevel: 'ok',
        defaultDispense: true,
        labelInstructions: 'Take ONE tablet daily (OD) at bedtime.',
      },
    ],
  },
}

function buildViewFallbackDetail(queueId: string): DispensePrescriptionDetail | undefined {
  const queueItem = PRESCRIPTION_QUEUE_ITEMS.find((item) => item.id === queueId)
  if (!queueItem) return undefined

  const patientNumber = queueItem.patientNumber.replace('#', '')

  return {
    id: queueItem.id,
    patientName: queueItem.patientName,
    patientNumber,
    age: 38,
    gender: '—',
    billingStatus: queueItem.billingStatus,
    prescribedBy: queueItem.prescribedBy,
    prescribedAt: queueItem.prescribedAt,
    items: Array.from({ length: queueItem.medicationCount }, (_, index) => ({
      id: `line-${index + 1}`,
      drugName: `Prescribed medication ${index + 1}`,
      category: '—',
      dose: '—',
      frequency: '—',
      duration: '—',
      qtyToDispense: 0,
      stockAvailable: 0,
      stockLevel: 'ok' as const,
      defaultDispense: true,
      labelInstructions: 'Details unavailable.',
    })),
  }
}

/** Read-only prescription view — available regardless of billing clearance. */
export function getPrescriptionViewById(id: string): DispensePrescriptionDetail | undefined {
  if (PRESCRIPTION_VIEW_DETAILS[id]) return PRESCRIPTION_VIEW_DETAILS[id]
  return buildViewFallbackDetail(id)
}

export function formatDispenseDate(): string {
  return new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
