import type { LabTestRequest } from '@/features/laboratory/types/laboratory'
import { getRowActionTone, ROW_ACTION_TONE_CLASS } from '@/features/laboratory/utils/labOrderPriority'

export type LabRowAction = 'collect_specimen' | 'enter_results' | 'view_results'

export function getRowAction(request: LabTestRequest): LabRowAction {
  if (request.specimenStatus === 'not_collected') return 'collect_specimen'
  if (request.status === 'completed') return 'view_results'
  return 'enter_results'
}

export function getRowActionLabel(action: LabRowAction): string {
  if (action === 'collect_specimen') return 'Collect Specimen'
  if (action === 'view_results') return 'View'
  return 'Enter Results'
}

export function getRowActionButtonClass(request: LabTestRequest): string {
  return ROW_ACTION_TONE_CLASS[getRowActionTone(request)]
}
