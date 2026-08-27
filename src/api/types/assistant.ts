/**
 * Hospital Assistant contracts.
 *
 * These mirror the server contracts in report-service
 * (app/assistant/contracts.py) exactly. Fields the server owns — tenant, role,
 * database routing, provider credentials — are deliberately absent: they are
 * resolved from the verified token on the server and are rejected outright if a
 * browser sends them.
 *
 * Operational chat, feedback, and push-to-talk voice exist. Medication checks
 * and clinical differential support arrive in later phases with their own flags
 * and permissions, and are not declared here.
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
  | 'INVALID_AUDIO'
  | 'AUDIO_TOO_LONG'
  | 'UNSUPPORTED_AUDIO_FORMAT'

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

/** Whether a capture produced usable speech. */
export type VoiceTranscriptStatus = 'transcribed' | 'no_speech_detected'

/**
 * What the server determined about one recording, from the audio itself.
 *
 * Nothing here is sent by the browser: duration, sample rate, container, and
 * codec are all read out of the uploaded bytes on the server. Duration is
 * optional because some browser containers genuinely do not carry it, and
 * `duration_source` says whether it was verified or merely bounded by the size
 * limit.
 */
export interface VoiceTranscriptMetadata {
  duration_ms?: number | null
  mime_type: string
  sample_rate_hz?: number | null
  byte_size: number
  container?: string | null
  codec?: string | null
  duration_source?: string | null
  /** Always false. Raw audio is not retained. */
  audio_retained: boolean
  /** Always false on arrival; confirmation happens in the browser. */
  transcript_confirmed_by_user: boolean
}

/**
 * A transcript returned for the speaker to read, correct, and confirm.
 *
 * `requires_confirmation` is always true. The server never forwards a
 * transcript onwards on the user's behalf, so nothing acts on these words until
 * the person who spoke them submits them.
 */
export interface AssistantVoiceTranscriptResponse {
  request_id: string
  status: VoiceTranscriptStatus
  transcript: string
  language?: string | null
  metadata: VoiceTranscriptMetadata
  requires_confirmation: boolean
}

/** Recognition hints the server accepts. Anything else is auto-detected. */
export type AssistantVoiceLanguage = 'en' | 'sw'
