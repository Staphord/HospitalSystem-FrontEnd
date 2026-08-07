import type { EquipmentItem } from '@/features/radiology/types/radiology'

// Placeholder data: the backend has no equipment/asset-tracking model yet.
// Swap this out once radiology-service exposes a real equipment status endpoint.
export const EQUIPMENT_STATUS: EquipmentItem[] = [
  { id: 'eq-1', name: 'X-Ray Room 1', status: 'optimal' },
  { id: 'eq-2', name: 'CT Scanner G-3', status: 'online' },
  { id: 'eq-3', name: 'MRI Room 4', status: 'maintenance' },
]
