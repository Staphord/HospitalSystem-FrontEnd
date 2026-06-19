export type BillPaymentStatus = 'Paid' | 'Partial' | 'Unpaid' | 'Insurance Pending'
export type BillPaymentMethod = 'Cash' | 'Insurance' | 'Exempt'

export interface PaymentRow {
  id: string
  patientName: string
  patientNumber: string
  visitDate: string
  totalBill: number
  paid: number
  paymentMethod: BillPaymentMethod
  status: BillPaymentStatus
  insurer: string | null
  lineItems: { label: string; amount: number }[]
  lastPaymentAt: string | null
}

export const INITIAL_PAYMENT_ROWS: PaymentRow[] = [
  {
    id: 'pay1',
    patientName: 'Zuwena Salum',
    patientNumber: 'PT-3841',
    visitDate: '2026-06-11',
    totalBill: 45000,
    paid: 0,
    paymentMethod: 'Insurance',
    status: 'Insurance Pending',
    insurer: 'NHIF',
    lineItems: [
      { label: 'Consultation', amount: 15000 },
      { label: 'Laboratory', amount: 30000 },
    ],
    lastPaymentAt: null,
  },
  {
    id: 'pay2',
    patientName: 'Fatuma Said',
    patientNumber: 'PT-4891',
    visitDate: '2026-06-11',
    totalBill: 25000,
    paid: 0,
    paymentMethod: 'Cash',
    status: 'Unpaid',
    insurer: null,
    lineItems: [
      { label: 'Consultation', amount: 15000 },
      { label: 'Registration', amount: 10000 },
    ],
    lastPaymentAt: null,
  },
  {
    id: 'pay3',
    patientName: 'Grace Kimaro',
    patientNumber: 'PT-4892',
    visitDate: '2026-06-11',
    totalBill: 30000,
    paid: 30000,
    paymentMethod: 'Cash',
    status: 'Paid',
    insurer: null,
    lineItems: [
      { label: 'Consultation', amount: 15000 },
      { label: 'Pharmacy', amount: 15000 },
    ],
    lastPaymentAt: '10:05',
  },
  {
    id: 'pay4',
    patientName: 'Hassan Mwita',
    patientNumber: 'PT-4889',
    visitDate: '2026-06-11',
    totalBill: 60000,
    paid: 20000,
    paymentMethod: 'Insurance',
    status: 'Partial',
    insurer: 'Jubilee Insurance',
    lineItems: [
      { label: 'Consultation', amount: 20000 },
      { label: 'Radiology', amount: 40000 },
    ],
    lastPaymentAt: '09:40',
  },
  {
    id: 'pay5',
    patientName: 'Amir Juma',
    patientNumber: 'PT-4903',
    visitDate: '2026-06-11',
    totalBill: 55000,
    paid: 55000,
    paymentMethod: 'Insurance',
    status: 'Paid',
    insurer: 'Strategis Insurance',
    lineItems: [
      { label: 'Consultation', amount: 25000 },
      { label: 'Laboratory', amount: 30000 },
    ],
    lastPaymentAt: '09:55',
  },
  {
    id: 'pay6',
    patientName: 'Joseph Mwinyi',
    patientNumber: 'PT-9201',
    visitDate: '2026-06-11',
    totalBill: 18000,
    paid: 0,
    paymentMethod: 'Cash',
    status: 'Unpaid',
    insurer: null,
    lineItems: [{ label: 'Consultation', amount: 18000 }],
    lastPaymentAt: null,
  },
  {
    id: 'pay7',
    patientName: 'Mary Ngoma',
    patientNumber: 'PT-5501',
    visitDate: '2026-06-11',
    totalBill: 40000,
    paid: 0,
    paymentMethod: 'Insurance',
    status: 'Insurance Pending',
    insurer: 'AAR Healthcare',
    lineItems: [
      { label: 'Consultation', amount: 15000 },
      { label: 'Laboratory', amount: 25000 },
    ],
    lastPaymentAt: null,
  },
  {
    id: 'pay8',
    patientName: 'Linda Mtui',
    patientNumber: 'PT-4911',
    visitDate: '2026-06-11',
    totalBill: 0,
    paid: 0,
    paymentMethod: 'Exempt',
    status: 'Paid',
    insurer: null,
    lineItems: [{ label: 'Exempt visit', amount: 0 }],
    lastPaymentAt: '07:55',
  },
]

export function formatTzs(amount: number) {
  return `TZS ${amount.toLocaleString('en-US')}`
}

export function getOutstanding(row: PaymentRow) {
  return Math.max(0, row.totalBill - row.paid)
}

export function derivePaymentStatus(totalBill: number, paid: number, method: BillPaymentMethod, current: BillPaymentStatus): BillPaymentStatus {
  if (method === 'Exempt' || totalBill === 0) return 'Paid'
  if (method === 'Insurance' && paid === 0 && current === 'Insurance Pending') return 'Insurance Pending'
  if (paid >= totalBill) return 'Paid'
  if (paid > 0) return 'Partial'
  return method === 'Insurance' ? 'Insurance Pending' : 'Unpaid'
}

export function paymentStatusStyles(status: BillPaymentStatus) {
  switch (status) {
    case 'Paid':
      return { bg: 'bg-success/10', text: 'text-success' }
    case 'Partial':
      return { bg: 'bg-warning/10', text: 'text-warning' }
    case 'Unpaid':
      return { bg: 'bg-error/10', text: 'text-error' }
    case 'Insurance Pending':
      return { bg: 'bg-info/10', text: 'text-info' }
  }
}

export function canRecordPayment(row: PaymentRow) {
  return row.status !== 'Paid' && row.paymentMethod !== 'Exempt'
}
