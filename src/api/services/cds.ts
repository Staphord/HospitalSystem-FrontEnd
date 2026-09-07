import { apiClient } from '@/api/client'
import type {
  CdsDifferentialFeedbackRequest,
  CdsDifferentialFeedbackResponse,
  CdsDifferentialRequest,
  CdsDifferentialResponse,
} from '@/api/types/cds'

/**
 * Clinical decision support calls.
 *
 * Every call goes through the shared gateway client under the `/cds` prefix the
 * API Gateway already routes to clinical-decision-support-service, so no
 * per-service base URL exists and no component talks to a microservice port
 * directly.
 *
 * Nothing here decides anything clinical. Red flags, the versions behind a
 * result, and the requirement for human review are all server-owned; this
 * module only carries them.
 */
export const cdsService = {
  /**
   * Ask for considerations for clinician review on one visit.
   *
   * Called Clinical Differential Support deliberately. It is not a diagnosis
   * engine: the server returns considerations with their inputs, evidence,
   * missing data, contradictions, and limitations, and always requires a human
   * to decide.
   */
  differential: (data: CdsDifferentialRequest, signal?: AbortSignal) =>
    apiClient
      .post<CdsDifferentialResponse>('/cds/differential/suggest', data, { signal })
      .then((r) => r.data),

  /**
   * Record a clinician's judgement of one suggestion.
   *
   * Written for humans to review. Nothing reads it back into the workflow, so a
   * rating never quietly changes what the next clinician is shown.
   */
  differentialFeedback: (data: CdsDifferentialFeedbackRequest, signal?: AbortSignal) =>
    apiClient
      .post<CdsDifferentialFeedbackResponse>('/cds/differential/feedback', data, { signal })
      .then((r) => r.data),
}
