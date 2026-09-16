import axios from 'axios'
import type { AssistantErrorCode, AssistantErrorResponse } from '@/api/types/assistant'

/**
 * Failure states the panel can show.
 *
 * The user-facing wording is owned here rather than taken from the server, so
 * no provider payload, prompt, tool name, database error, or stack trace can
 * reach the screen even if an upstream service is changed later.
 */
export type AssistantFailureKind =
  | 'unauthenticated'
  | 'permission_denied'
  | 'capability_disabled'
  | 'invalid_request'
  | 'too_large'
  | 'rate_limited'
  | 'timeout'
  | 'provider_unavailable'
  | 'invalid_output'
  | 'network'
  | 'unknown'
  // Voice
  | 'microphone_denied'
  | 'microphone_unavailable'
  | 'recording_unsupported'
  | 'invalid_audio'
  | 'audio_too_long'
  | 'unsupported_audio'

export interface AssistantFailure {
  kind: AssistantFailureKind
  /** Short, safe sentence shown to the user. */
  message: string
  /** Whether asking the same question again is worth offering. */
  retryable: boolean
  /** Correlation id, when the server supplied one. Safe to display. */
  requestId?: string
}

const MESSAGES: Record<AssistantFailureKind, string> = {
  unauthenticated: 'Your session has expired. Sign in again to use the assistant.',
  permission_denied: 'Your role does not have access to the assistant.',
  capability_disabled: 'The assistant is not enabled for this hospital.',
  invalid_request: 'That question could not be read. Try rephrasing it.',
  too_large: 'That question is too long. Shorten it and try again.',
  rate_limited: 'Too many questions in a short time. Wait a moment and try again.',
  timeout: 'The assistant took too long to respond. Try again.',
  provider_unavailable: 'The assistant is temporarily unavailable. Try again shortly.',
  invalid_output: 'The assistant could not produce a usable answer. Try rephrasing.',
  network: 'Could not reach the assistant. Check your connection and try again.',
  unknown: 'Something went wrong. Try again.',
  microphone_denied:
    'Microphone access was blocked. Allow it in your browser settings to use voice.',
  microphone_unavailable: 'No microphone was found. Check that one is connected.',
  recording_unsupported: 'This browser cannot record audio. Type your question instead.',
  invalid_audio: 'That recording could not be read. Try recording again.',
  audio_too_long: 'That recording is too long. Keep it under a minute.',
  unsupported_audio: 'That audio format is not supported. Try recording again.',
}

const RETRYABLE: ReadonlySet<AssistantFailureKind> = new Set<AssistantFailureKind>([
  'timeout',
  'provider_unavailable',
  'invalid_output',
  'network',
  'rate_limited',
  'unknown',
  // A failed recording is worth another try; a blocked microphone is not,
  // because retrying cannot change a browser permission the user must alter.
  'invalid_audio',
  'audio_too_long',
  'unsupported_audio',
  'microphone_unavailable',
])

const KIND_BY_CODE: Partial<Record<AssistantErrorCode, AssistantFailureKind>> = {
  CAPABILITY_DISABLED: 'capability_disabled',
  PERMISSION_DENIED: 'permission_denied',
  INVALID_REQUEST: 'invalid_request',
  REQUEST_TOO_LARGE: 'too_large',
  PROVIDER_UNAVAILABLE: 'provider_unavailable',
  PROVIDER_TIMEOUT: 'timeout',
  INVALID_PROVIDER_OUTPUT: 'invalid_output',
  INVALID_AUDIO: 'invalid_audio',
  AUDIO_TOO_LONG: 'audio_too_long',
  UNSUPPORTED_AUDIO_FORMAT: 'unsupported_audio',
}

const KIND_BY_STATUS: Record<number, AssistantFailureKind> = {
  400: 'invalid_request',
  401: 'unauthenticated',
  403: 'permission_denied',
  404: 'capability_disabled',
  413: 'too_large',
  415: 'unsupported_audio',
  422: 'invalid_request',
  429: 'rate_limited',
  502: 'invalid_output',
  503: 'provider_unavailable',
  504: 'timeout',
}

function isErrorEnvelope(data: unknown): data is AssistantErrorResponse {
  if (!data || typeof data !== 'object') return false
  const candidate = data as Record<string, unknown>
  return typeof candidate.code === 'string' && typeof candidate.request_id === 'string'
}

function build(kind: AssistantFailureKind, requestId?: string): AssistantFailure {
  return {
    kind,
    message: MESSAGES[kind],
    retryable: RETRYABLE.has(kind),
    requestId,
  }
}

/**
 * Turn any thrown value into a safe failure description.
 *
 * The server's own message text is intentionally discarded in favour of local
 * copy. Only the stable code, the HTTP status, and the request id are trusted.
 */
export function toAssistantFailure(error: unknown): AssistantFailure {
  if (!axios.isAxiosError(error)) {
    return build('unknown')
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return build('timeout')
  }

  const response = error.response
  if (!response) {
    return build('network')
  }

  const envelope = isErrorEnvelope(response.data) ? response.data : null
  const requestId = envelope?.request_id

  if (envelope) {
    const byCode = KIND_BY_CODE[envelope.code]
    if (byCode) return build(byCode, requestId)
  }

  return build(KIND_BY_STATUS[response.status] ?? 'unknown', requestId)
}

/** A cancelled request is a user action, not a failure to report. */
export function isCancellation(error: unknown): boolean {
  return axios.isCancel(error) || (axios.isAxiosError(error) && error.code === 'ERR_CANCELED')
}

/**
 * Turn a getUserMedia rejection into a safe failure description.
 *
 * The browser distinguishes "you said no" from "there is no microphone", and
 * the two need different advice: one is fixed in browser settings, the other by
 * plugging something in. Retrying a denied permission would just fail again.
 */
export function toMicrophoneFailure(error: unknown): AssistantFailure {
  const name = (error as { name?: string } | null)?.name ?? ''

  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return build('microphone_denied')
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return build('microphone_unavailable')
  }
  if (name === 'NotReadableError' || name === 'AbortError') {
    return build('microphone_unavailable')
  }
  return build('recording_unsupported')
}
