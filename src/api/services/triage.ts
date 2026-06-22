import type { TriageAssessmentForm } from '@/features/triage/types/triageAssessment'

export interface SaveTriageAssessmentResponse {
  assessmentId: string
  visitId: string
  status: 'completed'
}

export const triageService = {
  async saveAssessment(payload: TriageAssessmentForm): Promise<SaveTriageAssessmentResponse> {
    await new Promise((resolve) => setTimeout(resolve, 600))
    return {
      assessmentId: `ASM-${Date.now()}`,
      visitId: payload.visitId,
      status: 'completed',
    }
  },
}
