import type { LabRequestPriority, LabTestRequest } from '@/features/laboratory/types/laboratory'

/** Matches doctor consultation ORDER_PRIORITY_BADGE (EncounterPage). */
export const INVESTIGATION_ORDER_PRIORITY_BADGE: Record<LabRequestPriority, string> = {
  routine: 'bg-surface-container text-secondary border border-border-subtle',
  urgent: 'bg-warning/20 text-[#916a00]',
  stat: 'bg-error/10 text-error border border-error/20',
}

export const INVESTIGATION_ORDER_PRIORITY_BASE_CLASS =
  'inline-flex items-center px-2 py-0.5 rounded font-bold text-[10px] uppercase'

export function getPriorityRowHighlight(priority: LabRequestPriority): string | null {
  if (priority === 'stat') return 'bg-[#FFF4F4]'
  if (priority === 'urgent') return 'bg-warning/5'
  return null
}

export type RowActionTone = 'collect' | 'view' | 'stat' | 'urgent' | 'routine'

export function getRowActionTone(request: LabTestRequest): RowActionTone {
  if (request.specimenStatus === 'not_collected') return 'collect'
  if (request.status === 'completed') return 'view'
  if (request.priority === 'stat') return 'stat'
  if (request.priority === 'urgent') return 'urgent'
  return 'routine'
}

export const ROW_ACTION_TONE_CLASS: Record<RowActionTone, string> = {
  collect: 'border border-warning text-warning bg-warning/10 hover:bg-warning/20',
  view: 'border border-border-subtle text-secondary bg-surface-white hover:bg-surface-container-low',
  stat: 'bg-error hover:bg-error/90 text-white border-0',
  urgent: 'bg-warning hover:bg-warning/90 text-white border-0',
  routine: 'bg-primary hover:bg-primary-container text-white border-0',
}
