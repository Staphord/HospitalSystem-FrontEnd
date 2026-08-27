import { describe, it, expect } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import type { AssistantErrorCode } from '@/api/types/assistant'
import { toAssistantFailure } from '@/features/assistant/lib/assistantErrors'

function axiosErrorWith(status: number, data: unknown): AxiosError {
  const error = new AxiosError('request failed')
  error.response = {
    status,
    statusText: '',
    data,
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  }
  return error
}

function envelope(code: AssistantErrorCode, message = 'server message') {
  return { request_id: 'req-1', code, message }
}

describe('toAssistantFailure', () => {
  it.each([
    ['CAPABILITY_DISABLED', 404, 'capability_disabled'],
    ['PERMISSION_DENIED', 403, 'permission_denied'],
    ['INVALID_REQUEST', 400, 'invalid_request'],
    ['REQUEST_TOO_LARGE', 413, 'too_large'],
    ['PROVIDER_TIMEOUT', 504, 'timeout'],
    ['PROVIDER_UNAVAILABLE', 503, 'provider_unavailable'],
    ['INVALID_PROVIDER_OUTPUT', 502, 'invalid_output'],
  ])('maps the %s envelope to %s', (code, status, expected) => {
    const failure = toAssistantFailure(
      axiosErrorWith(status, envelope(code as AssistantErrorCode)),
    )

    expect(failure.kind).toBe(expected)
    expect(failure.requestId).toBe('req-1')
  })

  it('falls back to the HTTP status when there is no envelope', () => {
    expect(toAssistantFailure(axiosErrorWith(403, 'plain text')).kind).toBe('permission_denied')
    expect(toAssistantFailure(axiosErrorWith(401, undefined)).kind).toBe('unauthenticated')
    expect(toAssistantFailure(axiosErrorWith(429, undefined)).kind).toBe('rate_limited')
    expect(toAssistantFailure(axiosErrorWith(422, undefined)).kind).toBe('invalid_request')
  })

  it('treats a missing response as a network failure', () => {
    expect(toAssistantFailure(new AxiosError('offline')).kind).toBe('network')
  })

  it('treats a non-axios throw as unknown rather than surfacing it', () => {
    expect(toAssistantFailure(new Error('kaboom')).kind).toBe('unknown')
  })

  it('never surfaces the server message text', () => {
    const failure = toAssistantFailure(
      axiosErrorWith(
        503,
        envelope('PROVIDER_UNAVAILABLE', 'groq upstream 500 at api.groq.com key gsk_secret'),
      ),
    )

    expect(failure.message).not.toContain('groq')
    expect(failure.message).not.toContain('gsk_')
    expect(failure.message).toBe('The assistant is temporarily unavailable. Try again shortly.')
  })

  it('never surfaces a stack trace or database error from an unexpected body', () => {
    const failure = toAssistantFailure(
      axiosErrorWith(500, {
        detail: 'Traceback (most recent call last): psycopg2.OperationalError',
      }),
    )

    expect(failure.message).toBe('Something went wrong. Try again.')
    expect(failure.message).not.toContain('Traceback')
    expect(failure.message).not.toContain('psycopg2')
  })

  it('offers retry only where retrying could plausibly help', () => {
    expect(toAssistantFailure(axiosErrorWith(504, undefined)).retryable).toBe(true)
    expect(toAssistantFailure(axiosErrorWith(403, undefined)).retryable).toBe(false)
    expect(toAssistantFailure(axiosErrorWith(404, undefined)).retryable).toBe(false)
  })
})
