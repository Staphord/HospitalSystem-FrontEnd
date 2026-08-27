import { apiClient } from '@/api/client'
import type {
  AssistantChatRequest,
  AssistantChatResponse,
  AssistantFeedbackRequest,
} from '@/api/types/assistant'

/**
 * Hospital Assistant service calls.
 *
 * Every call goes through the shared gateway client. The assistant lives under
 * the existing `/reports` gateway prefix that already routes to report-service,
 * so no per-service base URL exists and no component talks to a microservice
 * port directly.
 */
export const assistantService = {
  /** Ask one operational question. Abortable so the user can cancel a slow request. */
  chat: (data: AssistantChatRequest, signal?: AbortSignal) =>
    apiClient
      .post<AssistantChatResponse>('/reports/assistant/chat', data, { signal })
      .then((r) => r.data),

  /** Rate a previous answer. Returns no content. */
  sendFeedback: (data: AssistantFeedbackRequest, signal?: AbortSignal) =>
    apiClient
      .post<void>('/reports/assistant/feedback', data, { signal })
      .then(() => undefined),
}
