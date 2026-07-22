import { apiClient } from '@/api/client'

export interface PharmacyQueueItem {
  queue_id: string
  queue_number: string
  priority: 'emergency' | 'urgent' | 'semi_urgent' | 'non_urgent'
  status: 'waiting' | 'in_progress' | 'completed'
  visit_id: string
  visit_number: string
  patient_id: string
  patient_name: string
  payment_type: 'cash' | 'insurance'
  billing_cleared: boolean
  prescription_count: number
  called_at: string | null
  created_at: string
}

export interface PharmacyQueueResponse {
  date: string
  queue: PharmacyQueueItem[]
}

export interface PrescriptionItem {
  prescription_id: string
  drug_name: string
  dose: string
  frequency: string
  duration: string
  route: string
  instructions: string | null
  prescribed_by: string
  prescribed_at: string
  status: 'pending' | 'dispensed' | 'cancelled'
  dispensing_record?: {
    dispensing_id: string
    quantity_dispensed: number
    dispensed_at: string
  } | null
}

export interface PatientPrescriptionContext {
  patient_id: string
  patient_name: string
  date_of_birth: string
  allergies?: string | null
}

export interface VisitPrescriptionsResponse {
  visit_id: string
  visit_number: string
  patient: PatientPrescriptionContext
  final_diagnosis: string
  billing_cleared: boolean
  prescriptions: PrescriptionItem[]
}

export interface InteractionAlert {
  type: 'drug_allergy' | 'drug_drug'
  severity: 'high' | 'moderate' | 'low'
  drug_name?: string | null
  drug_a?: string | null
  drug_b?: string | null
  detail: string
  recommendation: string
}

export interface InteractionCheckResponse {
  visit_id: string
  alerts: InteractionAlert[]
  alert_count: number
  checked_at: string
}

export interface DispenseResponse {
  dispensing_id: string
  prescription_id: string
  drug_name: string
  quantity_dispensed: number
  unit: string
  batch_number: string
  expiry_date: string
  billing_cleared: boolean
  dispensed_by: string
  dispensed_at: string
  remaining_stock: number
  low_stock_alert_sent: boolean
  bill_item_id: string
}

export interface InventoryItem {
  inventory_id: string
  drug_name: string
  brand_name: string | null
  drug_code: string
  category: string
  unit: string
  quantity_in_stock: number
  reorder_level: number
  unit_cost: number
  unit_price: number
  location: string | null
  is_active: boolean
}

export interface InventoryListResponse {
  items: InventoryItem[]
  total: number
  page: number
  page_size: number
}

export interface LowStockAlertItem {
  inventory_id: string
  drug_name: string
  quantity_in_stock: number
  reorder_level: number
  unit: string
  shortage_gap: number
  last_restocked_at?: string | null
}

export interface LowStockAlertsResponse {
  alert_count: number
  alerts: LowStockAlertItem[]
}

export interface LabelPayload {
  patient_name: string
  drug_name: string
  dose: string
  frequency: string
  duration: string
  route: string
  instructions: string | null
  dispensed_date: string
  dispensed_by: string
  batch_number: string
  expiry_date: string
}

export interface LabelGenerateResponse {
  label: LabelPayload
  department_subtitle?: string
}

export const pharmacyService = {
  getQueue: async (status: string = 'waiting', date?: string): Promise<PharmacyQueueResponse> => {
    const res = await apiClient.get<PharmacyQueueResponse>('/pharmacy/queue', {
      params: { status, date },
    })
    return res.data
  },

  getPrescriptionDetails: async (visitId: string): Promise<VisitPrescriptionsResponse> => {
    const res = await apiClient.get<VisitPrescriptionsResponse>(`/pharmacy/prescriptions/${visitId}`)
    return res.data
  },

  checkDrugInteractions: async (visitId: string): Promise<InteractionCheckResponse> => {
    const res = await apiClient.get<InteractionCheckResponse>(`/pharmacy/prescriptions/${visitId}/interaction-check`)
    return res.data
  },

  dispensePrescription: async (data: {
    prescription_id: string
    visit_id: string
    drug_name: string
    batch_number: string
    expiry_date: string
    quantity_dispensed: number
    unit: string
    interaction_alert_acknowledged: boolean
  }): Promise<DispenseResponse> => {
    const res = await apiClient.post<DispenseResponse>('/pharmacy/dispense', data)
    return res.data
  },

  getInventory: async (params?: {
    search?: string
    category?: string
    low_stock?: boolean
    page?: number
    page_size?: number
  }): Promise<InventoryListResponse> => {
    const res = await apiClient.get<InventoryListResponse>('/pharmacy/inventory', { params })
    return res.data
  },

  restockInventory: async (data: {
    inventory_id: string
    quantity_added: number
    batch_number: string
    expiry_date: string
    unit_cost: number
    notes?: string
  }): Promise<any> => {
    const res = await apiClient.post('/pharmacy/inventory/restock', data)
    return res.data
  },

  adjustInventory: async (data: {
    inventory_id: string
    transaction_type: 'adjustment' | 'write_off' | 'return'
    quantity_change: number
    notes: string
  }): Promise<any> => {
    const res = await apiClient.post('/pharmacy/inventory/adjust', data)
    return res.data
  },

  generateLabel: async (data: {
    prescription_item_id: string
    quantity: number
  }): Promise<LabelGenerateResponse> => {
    const res = await apiClient.post<LabelGenerateResponse>('/pharmacy/labels/generate', data)
    return res.data
  },

  getLowStockAlerts: async (): Promise<LowStockAlertsResponse> => {
    const res = await apiClient.get<LowStockAlertsResponse>('/pharmacy/inventory/low-stock-alerts')
    return res.data
  },
}
