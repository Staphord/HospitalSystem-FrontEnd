export const PHARMACY_DASHBOARD_STATS = {
  prescriptionsPending: 7,
  dispensedToday: 34,
  drugInteractions: 1,
  lowStockItems: 4,
} as const

export type BillingStatus = 'cleared' | 'pending'

export interface PendingPrescription {
  id: string
  patientName: string
  medicationCount: number
  billingStatus: BillingStatus
}

export const PENDING_PRESCRIPTIONS: PendingPrescription[] = [
  { id: 'rx-1', patientName: 'Sarah Juma', medicationCount: 3, billingStatus: 'cleared' },
  { id: 'rx-2', patientName: 'Hamisi Bakari', medicationCount: 1, billingStatus: 'pending' },
  { id: 'rx-3', patientName: 'Anna Mwakesege', medicationCount: 5, billingStatus: 'cleared' },
  { id: 'rx-4', patientName: 'John Doe', medicationCount: 2, billingStatus: 'cleared' },
]

export interface DrugInteraction {
  id: string
  patientName: string
  drugA: string
  drugB: string
  severity: 'high' | 'medium' | 'low'
}

export const DRUG_INTERACTIONS: DrugInteraction[] = [
  {
    id: 'di-1',
    patientName: 'Fatuma Said',
    drugA: 'Warfarin',
    drugB: 'Ibuprofen',
    severity: 'high',
  },
]

export interface LowStockItem {
  id: string
  name: string
  threshold: string
  remaining: number
  level: 'critical' | 'warning'
}

export const LOW_STOCK_ITEMS: LowStockItem[] = [
  { id: 'stk-1', name: 'Amoxicillin 500mg', threshold: '50 caps', remaining: 12, level: 'critical' },
  { id: 'stk-2', name: 'Paracetamol Syrup', threshold: '20 units', remaining: 8, level: 'warning' },
  { id: 'stk-3', name: 'Metformin 850mg', threshold: '100 tabs', remaining: 45, level: 'warning' },
]

export interface DispensedCategory {
  name: string
  percent: number
  barColor: 'primary' | 'info' | 'success'
}

export const DISPENSED_TODAY = {
  totalVolume: 142,
  categories: [
    { name: 'Antibiotics', percent: 42, barColor: 'primary' },
    { name: 'Analgesics', percent: 28, barColor: 'info' },
    { name: 'Antidiabetics', percent: 15, barColor: 'success' },
  ] satisfies DispensedCategory[],
}
