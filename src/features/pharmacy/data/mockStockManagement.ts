export type DrugCategory =
  | 'Analgesic'
  | 'Antibiotic'
  | 'Antidiabetic'
  | 'Antihypertensive'
  | 'Anticoagulant'
  | 'NSAID'
  | 'General'

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

export type StockRemovalReason =
  | 'dispensed'
  | 'expired'
  | 'damaged'
  | 'correction'

export interface StockItem {
  id: string
  drugName: string
  category: DrugCategory
  stock: number
  unit: string
  minThreshold: number
  maxThreshold: number
  expiry: string
  expiringSoon?: boolean
}

export const STOCK_CATEGORIES: DrugCategory[] = [
  'Analgesic',
  'Antibiotic',
  'Antidiabetic',
  'Antihypertensive',
  'Anticoagulant',
  'NSAID',
  'General',
]

export const STOCK_REMOVAL_REASONS: { value: StockRemovalReason; label: string }[] = [
  { value: 'dispensed', label: 'Dispensed' },
  { value: 'expired', label: 'Expired' },
  { value: 'damaged', label: 'Damaged/Wasted' },
  { value: 'correction', label: 'Inventory Correction' },
]

export const STOCK_TOTAL_COUNT = 248
export const STOCK_PAGE_SIZE = 10

export function getStockStatus(stock: number, minThreshold: number): StockStatus {
  if (stock === 0) return 'out_of_stock'
  if (stock < minThreshold) return 'low_stock'
  return 'in_stock'
}

export function computeStockStats(items: StockItem[]) {
  let lowStock = 0
  let outOfStock = 0
  let expiringSoon = 0

  for (const item of items) {
    const status = getStockStatus(item.stock, item.minThreshold)
    if (status === 'low_stock') lowStock += 1
    if (status === 'out_of_stock') outOfStock += 1
    if (item.expiringSoon) expiringSoon += 1
  }

  return {
    totalItems: STOCK_TOTAL_COUNT,
    lowStock,
    outOfStock,
    expiringSoon,
  }
}

export const INITIAL_STOCK_ITEMS: StockItem[] = [
  {
    id: 'stk-paracetamol-500',
    drugName: 'Paracetamol 500mg',
    category: 'Analgesic',
    stock: 45,
    unit: 'Pack (10)',
    minThreshold: 100,
    maxThreshold: 500,
    expiry: '12/2025',
    expiringSoon: true,
  },
  {
    id: 'stk-amoxicillin-250',
    drugName: 'Amoxicillin 250mg',
    category: 'Antibiotic',
    stock: 0,
    unit: 'Vial',
    minThreshold: 50,
    maxThreshold: 200,
    expiry: '08/2024',
  },
  {
    id: 'stk-metformin-500',
    drugName: 'Metformin 500mg',
    category: 'Antidiabetic',
    stock: 820,
    unit: 'Tablet',
    minThreshold: 200,
    maxThreshold: 1000,
    expiry: '03/2026',
  },
  {
    id: 'stk-amlodipine-5',
    drugName: 'Amlodipine 5mg',
    category: 'Antihypertensive',
    stock: 450,
    unit: 'Tablet',
    minThreshold: 150,
    maxThreshold: 800,
    expiry: '11/2025',
    expiringSoon: true,
  },
  {
    id: 'stk-ibuprofen-400',
    drugName: 'Ibuprofen 400mg',
    category: 'NSAID',
    stock: 12,
    unit: 'Tablet',
    minThreshold: 50,
    maxThreshold: 300,
    expiry: '01/2026',
    expiringSoon: true,
  },
  {
    id: 'stk-warfarin-5',
    drugName: 'Warfarin 5mg Tablets',
    category: 'Anticoagulant',
    stock: 450,
    unit: 'Tablet',
    minThreshold: 100,
    maxThreshold: 600,
    expiry: '06/2026',
  },
  {
    id: 'stk-amoxicillin-500',
    drugName: 'Amoxicillin 500mg',
    category: 'Antibiotic',
    stock: 12,
    unit: 'Capsule',
    minThreshold: 50,
    maxThreshold: 400,
    expiry: '09/2025',
  },
  {
    id: 'stk-paracetamol-syrup',
    drugName: 'Paracetamol Syrup',
    category: 'Analgesic',
    stock: 8,
    unit: 'Bottle',
    minThreshold: 20,
    maxThreshold: 80,
    expiry: '10/2025',
  },
  {
    id: 'stk-omeprazole-20',
    drugName: 'Omeprazole 20mg',
    category: 'General',
    stock: 1200,
    unit: 'Capsule',
    minThreshold: 200,
    maxThreshold: 1500,
    expiry: '04/2026',
  },
  {
    id: 'stk-metformin-850',
    drugName: 'Metformin 850mg',
    category: 'Antidiabetic',
    stock: 120,
    unit: 'Tablet',
    minThreshold: 100,
    maxThreshold: 500,
    expiry: '02/2026',
  },
]

export const CATEGORY_BADGE: Record<DrugCategory, string> = {
  Analgesic: 'bg-primary/10 text-primary',
  Antibiotic: 'bg-success/10 text-success',
  Antidiabetic: 'bg-tertiary-container/10 text-tertiary',
  Antihypertensive: 'bg-warning/10 text-warning',
  Anticoagulant: 'bg-error/10 text-error',
  NSAID: 'bg-secondary/10 text-secondary',
  General: 'bg-surface-container-highest text-outline',
}
