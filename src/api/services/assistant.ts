import { apiClient } from '@/api/client'
import type {
  AssistantChatRequest,
  AssistantChatResponse,
  AssistantConversationListResponse,
  AssistantConversationResponse,
  AssistantFeedbackRequest,
  AssistantSuggestionsResponse,
  AssistantVoiceLanguage,
  AssistantVoiceTranscriptResponse,
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

  /**
   * Starting questions for the signed-in user.
   *
   * There is no role or tenant parameter, and none would be accepted: the server
   * resolves both from the verified token and returns only questions this user
   * can actually get an answer to.
   */
  getSuggestions: (signal?: AbortSignal) =>
    apiClient
      .get<AssistantSuggestionsResponse>('/reports/assistant/suggestions', { signal })
      .then((r) => r.data),

  /** Rate a previous answer. Returns no content. */
  sendFeedback: (data: AssistantFeedbackRequest, signal?: AbortSignal) =>
    apiClient
      .post<void>('/reports/assistant/feedback', data, { signal })
      .then(() => undefined),

  /**
   * List the signed-in user's own previous conversations, newest first.
   *
   * The server scopes this to the caller resolved from the token, so there is
   * no user or tenant parameter to pass, and none would be accepted.
   */
  listConversations: (signal?: AbortSignal) =>
    apiClient
      .get<AssistantConversationListResponse>('/reports/assistant/conversations', {
        signal,
      })
      .then((r) => r.data),

  /** Reopen one of the user's own conversations. */
  getConversation: (conversationId: string, signal?: AbortSignal) =>
    apiClient
      .get<AssistantConversationResponse>(
        `/reports/assistant/conversations/${encodeURIComponent(conversationId)}`,
        { signal },
      )
      .then((r) => r.data),

  /** Delete one of the user's own conversations. Returns no content. */
  deleteConversation: (conversationId: string, signal?: AbortSignal) =>
    apiClient
      .delete<void>(
        `/reports/assistant/conversations/${encodeURIComponent(conversationId)}`,
        { signal },
      )
      .then(() => undefined),

  /** Delete every conversation the signed-in user owns, and only theirs. */
  clearConversations: (signal?: AbortSignal) =>
    apiClient
      .delete<void>('/reports/assistant/conversations', { signal })
      .then(() => undefined),

  /**
   * Send one push-to-talk recording for transcription.
   *
   * The recording is posted as raw bytes with its own Content-Type, which the
   * server checks against the actual container. Abortable, so a user who
   * changes their mind stops the upload rather than waiting it out.
   */
  transcribe: (
    audio: Blob,
    options: { language?: AssistantVoiceLanguage; signal?: AbortSignal } = {},
  ) =>
    apiClient
      .post<AssistantVoiceTranscriptResponse>(
        '/reports/assistant/voice/transcribe',
        audio,
        {
          headers: { 'Content-Type': audio.type || 'audio/webm' },
          params: options.language ? { language: options.language } : undefined,
          signal: options.signal,
        },
      )
      .then((r) => r.data),
}
