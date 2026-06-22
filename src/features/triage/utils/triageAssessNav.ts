export type TriageAssessFrom = 'dashboard' | 'queue'

export interface TriageAssessLocationState {
  from?: TriageAssessFrom
  highlightVisitId?: string
}

export interface TriageQueueLocationState {
  highlightVisitId?: string
}

/** Pass navigation source so breadcrumb/back match where the user came from. */
export function buildAssessNavigateState(
  visitId: string,
  from: TriageAssessFrom = 'queue',
): TriageAssessLocationState {
  if (from === 'queue') {
    return { from: 'queue', highlightVisitId: visitId }
  }
  return { from: 'dashboard' }
}

export function buildQueueHighlightState(visitId: string): TriageQueueLocationState {
  return { highlightVisitId: visitId }
}

export function resolveTriageAssessFrom(state: unknown): TriageAssessFrom {
  if (state && typeof state === 'object' && 'from' in state) {
    const from = (state as TriageAssessLocationState).from
    if (from === 'dashboard' || from === 'queue') return from
  }
  return 'queue'
}

export function resolveHighlightVisitId(state: unknown): string | undefined {
  if (state && typeof state === 'object' && 'highlightVisitId' in state) {
    const id = (state as TriageAssessLocationState).highlightVisitId
    return typeof id === 'string' ? id : undefined
  }
  return undefined
}

export function getTriageAssessParent(from: TriageAssessFrom): { label: string; path: string } {
  if (from === 'dashboard') {
    return { label: 'My Dashboard', path: '/dashboard' }
  }
  return { label: 'Triage Queue', path: '/triage/queue' }
}
