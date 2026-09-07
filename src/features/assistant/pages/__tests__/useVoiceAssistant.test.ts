import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import {
  MAX_RECORDING_MS,
  useVoiceAssistant,
} from '@/features/assistant/hooks/useVoiceAssistant'
import type { AssistantVoiceTranscriptResponse } from '@/api/types/assistant'

/**
 * jsdom implements neither MediaRecorder nor getUserMedia, so both are stood up
 * here with the surface the hook actually uses. That keeps these tests on the
 * capture lifecycle - when the microphone opens, when it closes, what is
 * uploaded, and what is thrown away - rather than on a polyfill.
 */

const transcribeMock = vi.hoisted(() => vi.fn())

vi.mock('@/api/services/assistant', () => ({
  assistantService: { transcribe: transcribeMock },
}))

class FakeTrack {
  stopped = false
  stop() {
    this.stopped = true
  }
}

class FakeStream {
  tracks = [new FakeTrack()]
  getTracks() {
    return this.tracks
  }
}

let currentRecorder: FakeRecorder | null = null
let supportedTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4']

class FakeRecorder {
  state: 'inactive' | 'recording' = 'inactive'
  mimeType: string
  ondataavailable: ((event: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor(mimeType: string) {
    this.mimeType = mimeType
  }

  start() {
    this.state = 'recording'
  }

  stop() {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob(['x'.repeat(2048)], { type: this.mimeType }) })
    this.onstop?.()
  }

  emitEmptyStop() {
    this.state = 'inactive'
    this.onstop?.()
  }
}

/**
 * A constructor that hands back the recorder it just built, so a test can drive
 * it. Returning the instance rather than capturing `this` keeps the stub a
 * plain factory.
 */
function makeMediaRecorderStub() {
  function Stub(_stream: unknown, options?: { mimeType?: string }) {
    const recorder = new FakeRecorder(options?.mimeType ?? 'audio/webm')
    currentRecorder = recorder
    return recorder
  }
  Stub.isTypeSupported = (type: string) => supportedTypes.includes(type)
  return Stub as unknown as typeof MediaRecorder
}

let lastStream: FakeStream | null = null
let getUserMedia: ReturnType<typeof vi.fn>

function transcript(
  overrides: Partial<AssistantVoiceTranscriptResponse> = {},
): AssistantVoiceTranscriptResponse {
  return {
    request_id: 'req-voice-1',
    status: 'transcribed',
    transcript: 'Ninawezaje kusajili mgonjwa mpya?',
    language: 'swahili',
    metadata: {
      mime_type: 'audio/webm',
      byte_size: 2048,
      duration_ms: 4000,
      duration_source: 'clusters',
      audio_retained: false,
      transcript_confirmed_by_user: false,
    },
    requires_confirmation: true,
    ...overrides,
  }
}

function axiosFailure(status: number, code?: string): AxiosError {
  return new AxiosError('failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: '',
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
    data: code ? { request_id: 'req-voice-1', code, message: 'server text' } : {},
  })
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  transcribeMock.mockReset()
  transcribeMock.mockResolvedValue(transcript())
  currentRecorder = null
  lastStream = null

  getUserMedia = vi.fn(async () => {
    lastStream = new FakeStream()
    return lastStream
  })

  supportedTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4']
  vi.stubGlobal('MediaRecorder', makeMediaRecorderStub())
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia },
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

async function startRecording(hook: ReturnType<typeof renderHook<ReturnType<typeof useVoiceAssistant>, unknown>>) {
  await act(async () => {
    await hook.result.current.start()
  })
}

describe('microphone permission', () => {
  it('does not touch the microphone until the user presses record', () => {
    renderHook(() => useVoiceAssistant())
    expect(getUserMedia).not.toHaveBeenCalled()
  })

  it('requests the microphone only when start is called', async () => {
    const hook = renderHook(() => useVoiceAssistant())
    await startRecording(hook)
    expect(getUserMedia).toHaveBeenCalledTimes(1)
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true })
  })

  it('reports a denied permission without offering a pointless retry', async () => {
    getUserMedia.mockRejectedValueOnce(
      Object.assign(new Error('denied'), { name: 'NotAllowedError' }),
    )
    const hook = renderHook(() => useVoiceAssistant())
    await startRecording(hook)

    expect(hook.result.current.state).toBe('failed')
    expect(hook.result.current.failure?.kind).toBe('microphone_denied')
    // Retrying cannot change a browser permission the user has to alter.
    expect(hook.result.current.failure?.retryable).toBe(false)
    expect(transcribeMock).not.toHaveBeenCalled()
  })

  it('reports a missing microphone separately from a refusal', async () => {
    getUserMedia.mockRejectedValueOnce(
      Object.assign(new Error('none'), { name: 'NotFoundError' }),
    )
    const hook = renderHook(() => useVoiceAssistant())
    await startRecording(hook)

    expect(hook.result.current.failure?.kind).toBe('microphone_unavailable')
  })
})

describe('unsupported browsers', () => {
  it('reports unsupported when MediaRecorder is absent', () => {
    vi.stubGlobal('MediaRecorder', undefined)
    const hook = renderHook(() => useVoiceAssistant())

    expect(hook.result.current.isSupported).toBe(false)
    expect(hook.result.current.state).toBe('unsupported')
  })

  it('never opens the microphone in an unsupported browser', async () => {
    vi.stubGlobal('MediaRecorder', undefined)
    const hook = renderHook(() => useVoiceAssistant())
    await startRecording(hook)

    expect(getUserMedia).not.toHaveBeenCalled()
    expect(hook.result.current.state).toBe('unsupported')
  })
})

describe('recording lifecycle', () => {
  it('enters the recording state and reports elapsed time', async () => {
    const hook = renderHook(() => useVoiceAssistant())
    await startRecording(hook)

    expect(hook.result.current.state).toBe('recording')

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(hook.result.current.elapsedMs).toBeGreaterThan(0)
  })

  it('picks the first container the browser and the server both support', async () => {
    const hook = renderHook(() => useVoiceAssistant())
    await startRecording(hook)

    expect(currentRecorder?.mimeType).toBe('audio/webm;codecs=opus')
  })

  it('falls back when the preferred container is unavailable', async () => {
    supportedTypes = ['audio/mp4']
    vi.stubGlobal('MediaRecorder', makeMediaRecorderStub())

    const hook = renderHook(() => useVoiceAssistant())
    await startRecording(hook)

    expect(currentRecorder?.mimeType).toBe('audio/mp4')
  })

  it('stops on its own at the server duration limit', async () => {
    const hook = renderHook(() => useVoiceAssistant())
    await startRecording(hook)

    await act(async () => {
      vi.advanceTimersByTime(MAX_RECORDING_MS + 10)
    })

    // Stopping here keeps what was said, rather than uploading a capture the
    // server would refuse.
    await waitFor(() => expect(transcribeMock).toHaveBeenCalled())
  })

  it('closes the microphone once recording ends', async () => {
    const hook = renderHook(() => useVoiceAssistant())
    await startRecording(hook)
    const stream = lastStream

    await act(async () => {
      hook.result.current.stop()
    })

    expect(stream?.tracks.every((track) => track.stopped)).toBe(true)
  })

  it('closes the microphone when the panel unmounts mid-recording', async () => {
    const hook = renderHook(() => useVoiceAssistant())
    await startRecording(hook)
    const stream = lastStream

    hook.unmount()

    expect(stream?.tracks.every((track) => track.stopped)).toBe(true)
  })
})

describe('cancelling', () => {
  it('discards an interrupted recording without uploading it', async () => {
    const hook = renderHook(() => useVoiceAssistant())
    await startRecording(hook)

    await act(async () => {
      hook.result.current.cancel()
    })

    expect(transcribeMock).not.toHaveBeenCalled()
    expect(hook.result.current.state).toBe('idle')
  })

  it('closes the microphone when cancelled', async () => {
    const hook = renderHook(() => useVoiceAssistant())
    await startRecording(hook)
    const stream = lastStream

    await act(async () => {
      hook.result.current.cancel()
    })

    expect(stream?.tracks.every((track) => track.stopped)).toBe(true)
  })

  it('clears any transcript already under review', async () => {
    const hook = renderHook(() => useVoiceAssistant())
    await startRecording(hook)
    await act(async () => {
      hook.result.current.stop()
    })
    await waitFor(() => expect(hook.result.current.state).toBe('review'))

    await act(async () => {
      hook.result.current.cancel()
    })

    expect(hook.result.current.transcript).toBe('')
    expect(hook.result.current.state).toBe('idle')
  })
})

describe('transcription result', () => {
  it('uploads the recording and offers the transcript for review', async () => {
    const hook = renderHook(() => useVoiceAssistant())
    await startRecording(hook)
    await act(async () => {
      hook.result.current.stop()
    })

    await waitFor(() => expect(hook.result.current.state).toBe('review'))
    expect(hook.result.current.transcript).toBe('Ninawezaje kusajili mgonjwa mpya?')
    expect(hook.result.current.detectedLanguage).toBe('swahili')
  })

  it('sends the recording as a blob carrying its own container type', async () => {
    const hook = renderHook(() => useVoiceAssistant())
    await startRecording(hook)
    await act(async () => {
      hook.result.current.stop()
    })

    await waitFor(() => expect(transcribeMock).toHaveBeenCalled())
    const [blob] = transcribeMock.mock.calls[0]
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toContain('audio/webm')
  })

  it('lets the user correct what was heard', async () => {
    const hook = renderHook(() => useVoiceAssistant())
    await startRecording(hook)
    await act(async () => {
      hook.result.current.stop()
    })
    await waitFor(() => expect(hook.result.current.state).toBe('review'))

    act(() => {
      hook.result.current.setTranscript('Corrected question')
    })

    expect(hook.result.current.transcript).toBe('Corrected question')
  })

  it('reports silence rather than inventing words', async () => {
    transcribeMock.mockResolvedValueOnce(
      transcript({ status: 'no_speech_detected', transcript: '', language: null }),
    )
    const hook = renderHook(() => useVoiceAssistant())
    await startRecording(hook)
    await act(async () => {
      hook.result.current.stop()
    })

    await waitFor(() => expect(hook.result.current.state).toBe('no_speech'))
    expect(hook.result.current.transcript).toBe('')
  })

  it('does not upload an empty recording', async () => {
    const hook = renderHook(() => useVoiceAssistant())
    await startRecording(hook)

    await act(async () => {
      currentRecorder?.emitEmptyStop()
    })

    expect(transcribeMock).not.toHaveBeenCalled()
    await waitFor(() => expect(hook.result.current.state).toBe('failed'))
  })
})

describe('server failures', () => {
  it.each([
    [415, 'UNSUPPORTED_AUDIO_FORMAT', 'unsupported_audio'],
    [400, 'AUDIO_TOO_LONG', 'audio_too_long'],
    [400, 'INVALID_AUDIO', 'invalid_audio'],
    [413, 'REQUEST_TOO_LARGE', 'too_large'],
    [504, 'PROVIDER_TIMEOUT', 'timeout'],
    [503, 'PROVIDER_UNAVAILABLE', 'provider_unavailable'],
    [403, 'PERMISSION_DENIED', 'permission_denied'],
    [404, 'CAPABILITY_DISABLED', 'capability_disabled'],
  ])('maps %i %s to %s', async (status, code, kind) => {
    transcribeMock.mockRejectedValueOnce(axiosFailure(status, code))
    const hook = renderHook(() => useVoiceAssistant())
    await startRecording(hook)
    await act(async () => {
      hook.result.current.stop()
    })

    await waitFor(() => expect(hook.result.current.state).toBe('failed'))
    expect(hook.result.current.failure?.kind).toBe(kind)
  })

  it('never shows the server message text', async () => {
    transcribeMock.mockRejectedValueOnce(
      axiosFailure(503, 'PROVIDER_UNAVAILABLE'),
    )
    const hook = renderHook(() => useVoiceAssistant())
    await startRecording(hook)
    await act(async () => {
      hook.result.current.stop()
    })

    await waitFor(() => expect(hook.result.current.failure).not.toBeNull())
    expect(hook.result.current.failure?.message).not.toContain('server text')
  })

  it('never leaves a transcript behind after a failure', async () => {
    transcribeMock.mockRejectedValueOnce(axiosFailure(503, 'PROVIDER_UNAVAILABLE'))
    const hook = renderHook(() => useVoiceAssistant())
    await startRecording(hook)
    await act(async () => {
      hook.result.current.stop()
    })

    await waitFor(() => expect(hook.result.current.state).toBe('failed'))
    expect(hook.result.current.transcript).toBe('')
  })
})

describe('nothing spoken is persisted', () => {
  it('writes no audio, transcript, or language to local storage', async () => {
    const hook = renderHook(() => useVoiceAssistant())
    await startRecording(hook)
    await act(async () => {
      hook.result.current.stop()
    })
    await waitFor(() => expect(hook.result.current.state).toBe('review'))

    const stored = JSON.stringify(localStorage)
    expect(stored).not.toContain('kusajili')
    expect(stored).not.toContain('mgonjwa')
    expect(stored.toLowerCase()).not.toContain('transcript')
    expect(stored.toLowerCase()).not.toContain('audio')
  })
})
