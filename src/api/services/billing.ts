// Planned — backend router is a stub.

import { apiClient } from '../client'

export interface BillItem {
  item_id: string
  bill_id: string
  item_code: string
  item_type: string
  description: string
  quantity: number
  unit_price: number
  line_total: number
  created_at: string
}

export interface Bill {
  bill_id: string
  visit_id?: string
  admission_id?: string
  patient_id: string
  patient_name?: string
  patient_number?: string
  status: string
  total_amount: number
  paid_amount?: number
  discount_amount?: number
  currency: string
  created_at: string
  updated_at: string
  items: BillItem[]
}

export interface PaymentIn {
  amount: number
  payment_method: string
  reference_number?: string
  notes?: string
}

export interface PaymentOut {
  payment_id: string
  bill_id: string
  amount_paid: number
  payment_method: string
  receipt_number: string
  created_at: string
  status: string
}

export interface BillItemCreate {
  item_code?: string
  item_type?: string
  description: string
  quantity?: number
  unit_price: number
}

export interface BillAdjustmentIn {
  discount_amount: number
  reason: string
}

export const billingService = {
  listPendingBills: (): Promise<Bill[]> =>
    apiClient.get<Bill[]>('/billing/pending-bills').then((r) => r.data),

  listAllBills: (): Promise<Bill[]> =>
    apiClient.get<Bill[]>('/billing/bills').then((r) => r.data),

  getBill: (billId: string): Promise<Bill> =>
    apiClient.get<Bill>(`/billing/bills/${encodeURIComponent(billId)}`).then((r) => r.data),

  addBillItem: (billId: string, data: BillItemCreate): Promise<Bill> =>
    apiClient.post<Bill>(`/billing/bills/${encodeURIComponent(billId)}/items`, data).then((r) => r.data),

  adjustBill: (billId: string, data: BillAdjustmentIn): Promise<Bill> =>
    apiClient.post<Bill>(`/billing/bills/${encodeURIComponent(billId)}/adjust`, data).then((r) => r.data),

  recordPayment: (billId: string, data: PaymentIn): Promise<PaymentOut> =>
    apiClient.post<PaymentOut>(`/billing/bills/${encodeURIComponent(billId)}/payments`, data).then((r) => r.data),
}
