import { apiClient } from '@/api/client'
import type {
  AssistantConfigResponse,
  AssistantConfigUpdate,
  AssistantProviderTestResult,
} from '@/api/types/assistantConfig'

/**
 * Platform assistant configuration calls. Super admin only.
 *
 * These live under the existing `/reports` gateway prefix that already routes
 * to report-service, which owns the assistant, so no new gateway route and no
 * per-service base URL is introduced. The `/admin` segment is what marks them
 * as platform scope rather than staff scope; the server refuses every tenant
 * role on them, hospital_admin included.
 */
export const assistantConfigService = {
  /** Read what is in force, with the API key masked. */
  get: (signal?: AbortSignal) =>
    apiClient
      .get<AssistantConfigResponse>('/reports/admin/assistant-config', { signal })
      .then((r) => r.data),

  /**
   * Save a partial change and return what is now in force.
   *
   * Send `api_key` only when the super admin actually typed a new one: omitting
   * it keeps the stored key, so an unrelated change to a timeout cannot wipe
   * the credential.
   */
  update: (data: AssistantConfigUpdate, signal?: AbortSignal) =>
    apiClient
      .put<AssistantConfigResponse>('/reports/admin/assistant-config', data, {
        signal,
      })
      .then((r) => r.data),

  /**
   * Check the stored credential against the provider.
   *
   * Lists models rather than generating anything, so nothing is billed for
   * tokens and no hospital data is involved. It also reports when the key works
   * but the chosen model is not served by the account, which is otherwise only
   * discovered by a nurse asking a question.
   */
  test: (signal?: AbortSignal) =>
    apiClient
      .post<AssistantProviderTestResult>(
        '/reports/admin/assistant-config/test',
        {},
        { signal },
      )
      .then((r) => r.data),
}
