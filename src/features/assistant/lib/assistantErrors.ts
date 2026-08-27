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
}

const RETRYABLE: ReadonlySet<AssistantFailureKind> = new Set<AssistantFailureKind>([
  'timeout',
  'provider_unavailable',
  'invalid_output',
  'network',
  'rate_limited',
  'unknown',
])

const KIND_BY_CODE: Partial<Record<AssistantErrorCode, AssistantFailureKind>> = {
  CAPABILITY_DISABLED: 'capability_disabled',
  PERMISSION_DENIED: 'permission_denied',
  INVALID_REQUEST: 'invalid_request',
  REQUEST_TOO_LARGE: 'too_large',
  PROVIDER_UNAVAILABLE: 'provider_unavailable',
  PROVIDER_TIMEOUT: 'timeout',
  INVALID_PROVIDER_OUTPUT: 'invalid_output',
}

const KIND_BY_STATUS: Record<number, AssistantFailureKind> = {
  400: 'invalid_request',
  401: 'unauthenticated',
  403: 'permission_denied',
  404: 'capability_disabled',
  413: 'too_large',
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
