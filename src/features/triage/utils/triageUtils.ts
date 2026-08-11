import type { TriageVisit } from '@/features/triage/types/triageAssessment'

export function getDefaultTriageCategory(visit: TriageVisit) {
  if (visit.isEmergency || visit.priority === 'emergency') return 'emergency' as const
  if (visit.priority === 'urgent') return 'urgent' as const
  return 'semi_urgent' as const
}
