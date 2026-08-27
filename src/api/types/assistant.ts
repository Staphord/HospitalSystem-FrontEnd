/**
 * Hospital Assistant contracts.
 *
 * These mirror the server contracts in report-service
 * (app/assistant/contracts.py) exactly. Fields the server owns — tenant, role,
 * database routing, provider credentials — are deliberately absent: they are
 * resolved from the verified token on the server and are rejected outright if a
 * browser sends them.
 *
 * Only operational chat and feedback exist in this phase. Voice, medication
 * checks, and clinical differential support arrive in later phases with their
 * own flags and permissions, and are not declared here.
 */

/** Outcome of an answer. Only a supported answer may cite sources. */
export type AssistantAnswerStatus = 'supported' | 'unsupported' | 'unavailable'

/** Where a segment of an answer came from. */
export interface AssistantSource {
  label: string
  kind: string
  version?: string | null
}

/** A single operational question from an authenticated staff user. */
export interface AssistantChatRequest {
  question: string
  conversation_id?: string | null
  locale?: string | null
}

/**
 * Validated envelope returned to the browser. `answer` is plain text or the
 * tightly controlled Markdown subset the server allows. It is never raw HTML
 * and is never rendered as HTML.
 */
export interface AssistantChatResponse {
  request_id: string
  status: AssistantAnswerStatus
  answer: string
  sources: AssistantSource[]
  follow_ups: string[]
}

export type AssistantFeedbackRating = 'helpful' | 'not_helpful' | 'incorrect'

/** Feedback on one previously returned answer, scoped by its request id. */
export interface AssistantFeedbackRequest {
  request_id: string
  rating: AssistantFeedbackRating
  comment?: string | null
}

/** Stable failure codes returned by the server. */
export type AssistantErrorCode =
  | 'CAPABILITY_DISABLED'
  | 'PERMISSION_DENIED'
  | 'INVALID_REQUEST'
  | 'REQUEST_TOO_LARGE'
  | 'PROVIDER_UNAVAILABLE'
  | 'PROVIDER_TIMEOUT'
  | 'INVALID_PROVIDER_OUTPUT'
  | 'UNSUPPORTED_QUESTION'
  | 'NEEDS_REVIEW'

/**
 * Safe, user-facing failure envelope. Carries a stable code and a short message
 * only. Provider payloads, prompts, database errors, and stack traces are never
 * placed in it by the server, and must never be surfaced by the client.
 */
export interface AssistantErrorResponse {
  request_id: string
  code: AssistantErrorCode
  message: string
}
