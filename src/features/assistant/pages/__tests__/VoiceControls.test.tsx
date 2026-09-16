import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { VoiceControls } from '@/features/assistant/components/VoiceControls'
import type { AssistantVoiceTranscriptResponse } from '@/api/types/assistant'

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

const supportedTypes = ['audio/webm']

class FakeRecorder {
  state: 'inactive' | 'recording' = 'inactive'
  mimeType = 'audio/webm'
  ondataavailable: ((event: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  onerror: (() => void) | null = null

  start() {
    this.state = 'recording'
  }

  stop() {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob(['x'.repeat(2048)], { type: 'audio/webm' }) })
    this.onstop?.()
  }
}

function makeMediaRecorderStub() {
  function Stub() {
    return new FakeRecorder()
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
      audio_retained: false,
      transcript_confirmed_by_user: false,
    },
    requires_confirmation: true,
    ...overrides,
  }
}

beforeEach(() => {
  transcribeMock.mockReset()
  transcribeMock.mockResolvedValue(transcript())
  lastStream = null

  getUserMedia = vi.fn(async () => {
    lastStream = new FakeStream()
    return lastStream
  })

  vi.stubGlobal('MediaRecorder', makeMediaRecorderStub())
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function recordAndStop(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /record a question/i }))
  await screen.findByRole('button', { name: /^stop$/i })
  await user.click(screen.getByRole('button', { name: /^stop$/i }))
}

describe('the microphone is never opened without a deliberate press', () => {
  it('renders only a record control at rest', () => {
    render(<VoiceControls onConfirm={vi.fn()} />)

    expect(screen.getByRole('button', { name: /record a question/i })).toBeInTheDocument()
    expect(getUserMedia).not.toHaveBeenCalled()
  })

  it('opens the microphone when the control is pressed', async () => {
    const user = userEvent.setup()
    render(<VoiceControls onConfirm={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /record a question/i }))

    expect(getUserMedia).toHaveBeenCalledTimes(1)
  })

  it('is reachable and operable by keyboard alone', async () => {
    const user = userEvent.setup()
    render(<VoiceControls onConfirm={vi.fn()} />)

    await user.tab()
    expect(screen.getByRole('button', { name: /record a question/i })).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(getUserMedia).toHaveBeenCalled()
  })
})

describe('recording is visibly announced', () => {
  it('shows a recording state with a stop and a cancel control', async () => {
    const user = userEvent.setup()
    render(<VoiceControls onConfirm={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /record a question/i }))

    expect(await screen.findByRole('status')).toHaveTextContent(/recording/i)
    expect(screen.getByRole('button', { name: /^stop$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument()
  })

  it('shows an uploading state while the recording is transcribed', async () => {
    const user = userEvent.setup()
    let release: (value: AssistantVoiceTranscriptResponse) => void = () => {}
    transcribeMock.mockImplementationOnce(
      () => new Promise<AssistantVoiceTranscriptResponse>((resolve) => (release = resolve)),
    )

    render(<VoiceControls onConfirm={vi.fn()} />)
    await recordAndStop(user)

    expect(await screen.findByText(/transcribing/i)).toBeInTheDocument()

    await act(async () => {
      release(transcript())
    })
    expect(
      await screen.findByRole('textbox', { name: /check what i heard/i }),
    ).toBeInTheDocument()
  })
})

describe('the transcript is reviewed before anything is sent', () => {
  it('shows what was heard and asks the user to check it', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<VoiceControls onConfirm={onConfirm} />)

    await recordAndStop(user)

    const box = await screen.findByRole('textbox', { name: /check what i heard/i })
    expect(box).toHaveValue('Ninawezaje kusajili mgonjwa mpya?')
    // Displaying a transcript is not sending it.
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('states that nothing is sent yet and that the recording is not kept', async () => {
    const user = userEvent.setup()
    render(<VoiceControls onConfirm={vi.fn()} />)

    await recordAndStop(user)

    expect(
      await screen.findByText(/nothing is sent until you choose use this/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/recording is not kept/i)).toBeInTheDocument()
  })

  it('lets the user correct the transcript before confirming', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<VoiceControls onConfirm={onConfirm} />)

    await recordAndStop(user)
    const box = await screen.findByRole('textbox', { name: /check what i heard/i })

    await user.clear(box)
    await user.type(box, 'How do I register a patient')
    await user.click(screen.getByRole('button', { name: /use this/i }))

    expect(onConfirm).toHaveBeenCalledWith('How do I register a patient')
  })

  it('sends only on explicit confirmation', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<VoiceControls onConfirm={onConfirm} />)

    await recordAndStop(user)
    await screen.findByRole('button', { name: /use this/i })
    expect(onConfirm).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /use this/i }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('discards the transcript without sending it', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<VoiceControls onConfirm={onConfirm} />)

    await recordAndStop(user)
    await user.click(await screen.findByRole('button', { name: /discard/i }))

    expect(onConfirm).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /record a question/i })).toBeInTheDocument(),
    )
  })

  it('cannot confirm an empty transcript', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<VoiceControls onConfirm={onConfirm} />)

    await recordAndStop(user)
    const box = await screen.findByRole('textbox', { name: /check what i heard/i })
    await user.clear(box)

    expect(screen.getByRole('button', { name: /use this/i })).toBeDisabled()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('moves focus to the transcript so it can be corrected by keyboard', async () => {
    const user = userEvent.setup()
    render(<VoiceControls onConfirm={vi.fn()} />)

    await recordAndStop(user)

    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: /check what i heard/i })).toHaveFocus(),
    )
  })
})

describe('escape abandons voice input', () => {
  it('stops a recording in progress and closes the microphone', async () => {
    const user = userEvent.setup()
    render(<VoiceControls onConfirm={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /record a question/i }))
    await screen.findByRole('button', { name: /^stop$/i })
    const stream = lastStream

    await user.keyboard('{Escape}')

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /record a question/i })).toBeInTheDocument(),
    )
    expect(stream?.tracks.every((track) => track.stopped)).toBe(true)
    expect(transcribeMock).not.toHaveBeenCalled()
  })

  it('discards a transcript awaiting confirmation', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<VoiceControls onConfirm={onConfirm} />)

    await recordAndStop(user)
    await screen.findByRole('textbox', { name: /check what i heard/i })

    await user.keyboard('{Escape}')

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /record a question/i })).toBeInTheDocument(),
    )
    expect(onConfirm).not.toHaveBeenCalled()
  })
})

describe('failure and unsupported states', () => {
  it('explains a blocked microphone without offering a retry', async () => {
    getUserMedia.mockRejectedValueOnce(
      Object.assign(new Error('denied'), { name: 'NotAllowedError' }),
    )
    const user = userEvent.setup()
    render(<VoiceControls onConfirm={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /record a question/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/microphone access was blocked/i)
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
  })

  it('offers a retry for a transient server failure', async () => {
    const { AxiosError, AxiosHeaders } = await import('axios')
    transcribeMock.mockRejectedValueOnce(
      new AxiosError('boom', 'ERR_BAD_RESPONSE', undefined, undefined, {
        status: 503,
        statusText: '',
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
        data: { request_id: 'r', code: 'PROVIDER_UNAVAILABLE', message: 'internal detail' },
      }),
    )
    const user = userEvent.setup()
    render(<VoiceControls onConfirm={vi.fn()} />)

    await recordAndStop(user)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/temporarily unavailable/i)
    expect(alert).not.toHaveTextContent(/internal detail/i)
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('reports silence rather than pretending to have heard something', async () => {
    transcribeMock.mockResolvedValueOnce(
      transcript({ status: 'no_speech_detected', transcript: '', language: null }),
    )
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<VoiceControls onConfirm={onConfirm} />)

    await recordAndStop(user)

    expect(await screen.findByText(/did not hear anything/i)).toBeInTheDocument()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('tells the user to type instead when the browser cannot record', () => {
    vi.stubGlobal('MediaRecorder', undefined)
    render(<VoiceControls onConfirm={vi.fn()} />)

    expect(screen.getByRole('note')).toHaveTextContent(/not available in this browser/i)
    // No dead button is offered.
    expect(
      screen.queryByRole('button', { name: /record a question/i }),
    ).not.toBeInTheDocument()
  })

  it('cannot start a recording while a question is already being sent', async () => {
    render(<VoiceControls onConfirm={vi.fn()} disabled />)

    expect(screen.getByRole('button', { name: /record a question/i })).toBeDisabled()
  })
})
