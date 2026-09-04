import axios from 'axios'
import type { CdsErrorCode, CdsErrorResponse } from '@/api/types/cds'

/**
 * Failure states the clinical suggestion card can show.
 *
 * The user-facing wording is owned here rather than taken from the server, so
 * no database error, stack trace, or upstream payload can reach the screen even
 * if a service is changed later.
 *
 * Every message avoids implying that anything was checked and found fine. A
 * failed request is not a clear result, and the wording must never let a tired
 * clinician read it as one.
 */
export type CdsFailureKind =
  | 'unauthenticated'
  | 'permission_denied'
  | 'capability_disabled'
  | 'invalid_request'
  | 'not_found'
  | 'suggestion_unavailable'
  | 'rate_limited'
  | 'timeout'
  | 'network'
  | 'unknown'

export interface CdsFailure {
  kind: CdsFailureKind
  /** Short, safe sentence shown to the user. */
  message: string
  /** Whether trying again is worth offering. */
  retryable: boolean
  /** Correlation id, when the server supplied one. Safe to display. */
  requestId?: string
}

const MESSAGES: Record<CdsFailureKind, string> = {
  unauthenticated: 'Your session has expired. Sign in again to use clinical support.',
  permission_denied: 'Your role does not have access to clinical differential support.',
  capability_disabled: 'Clinical differential support is not enabled for this hospital.',
  invalid_request: 'That request could not be read. Check the details and try again.',
  not_found: 'That visit is not available.',
  suggestion_unavailable:
    'No considerations could be produced. This is not a statement that there is nothing to consider.',
  rate_limited: 'Too many requests in a short time. Wait a moment and try again.',
  timeout:
    'The request timed out, so no considerations were produced. This is not a statement that there is nothing to consider.',
  network:
    'Could not reach clinical support, so no considerations were produced. Check your connection and try again.',
  unknown:
    'No considerations were produced. This is not a statement that there is nothing to consider.',
}

const RETRYABLE: ReadonlySet<CdsFailureKind> = new Set<CdsFailureKind>([
  'suggestion_unavailable',
  'rate_limited',
  'timeout',
  'network',
  'unknown',
])

const BY_CODE: Record<CdsErrorCode, CdsFailureKind> = {
  capability_disabled: 'capability_disabled',
  permission_denied: 'permission_denied',
  invalid_request: 'invalid_request',
  resource_not_found: 'not_found',
  suggestion_unavailable: 'suggestion_unavailable',
}

function failure(kind: CdsFailureKind, requestId?: string): CdsFailure {
  return {
    kind,
    message: MESSAGES[kind],
    retryable: RETRYABLE.has(kind),
    ...(requestId ? { requestId } : {}),
  }
}

function isCdsErrorBody(value: unknown): value is CdsErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as CdsErrorResponse).code === 'string' &&
    (value as CdsErrorResponse).code in BY_CODE
  )
}

/**
 * Map any thrown value to a safe, displayable failure.
 *
 * Anything unrecognised becomes `unknown`, whose wording still says nothing was
 * ruled out. Defaulting an unrecognised failure to something reassuring is the
 * mistake this function exists to make impossible.
 */
export function toCdsFailure(error: unknown): CdsFailure {
  if (axios.isCancel(error)) return failure('unknown')

  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return failure('timeout')
    }

    const status = error.response?.status
    const body: unknown = error.response?.data
    const requestId = isCdsErrorBody(body) ? body.request_id : undefined

    if (!error.response) return failure('network')
    if (status === 401) return failure('unauthenticated', requestId)
    if (status === 429) return failure('rate_limited', requestId)

    if (isCdsErrorBody(body)) return failure(BY_CODE[body.code], requestId)

    if (status === 403) return failure('permission_denied')
    // A 404 on this surface is either a visit that is not yours or a capability
    // that is switched off. The two are meant to be indistinguishable.
    if (status === 404) return failure('not_found')
    if (status === 422 || status === 400) return failure('invalid_request')
    if (status === 503) return failure('suggestion_unavailable')
  }

  return failure('unknown')
}

/**
 * Whether a failure means the capability is simply not present for this user.
 *
 * The card withdraws entirely in that case rather than showing an error: a
 * clinician at a hospital without this capability should see the screen exactly
 * as it was before the feature existed.
 */
export function isAbsent(failure: CdsFailure): boolean {
  return failure.kind === 'capability_disabled' || failure.kind === 'permission_denied'
}
