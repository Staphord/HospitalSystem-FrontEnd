import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AnswerSpeech } from '@/features/assistant/components/AnswerSpeech'

/**
 * Playback uses the browser's own speech synthesiser, so no answer text is sent
 * to a speech vendor and the hospital system generates, stores, and serves no
 * audio at all. jsdom implements none of this API, so it is stood up here.
 */

class FakeUtterance {
  text: string
  lang = ''
  onend: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor(text: string) {
    this.text = text
  }
}

let spoken: FakeUtterance[] = []
let cancelCalls = 0

const synthesis = {
  speak: vi.fn((utterance: FakeUtterance) => {
    spoken.push(utterance)
  }),
  cancel: vi.fn(() => {
    cancelCalls += 1
  }),
}

const ANSWER = 'Fungua Reception, kisha bonyeza Register patient.'

beforeEach(() => {
  spoken = []
  cancelCalls = 0
  synthesis.speak.mockClear()
  synthesis.cancel.mockClear()

  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    writable: true,
    value: synthesis,
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('the synthetic voice is disclosed', () => {
  it('labels the voice as AI-generated in visible text', () => {
    render(<AnswerSpeech answer={ANSWER} />)

    expect(screen.getByText(/ai-generated voice/i)).toBeInTheDocument()
  })

  it('labels the control as an AI-generated voice for screen readers', () => {
    render(<AnswerSpeech answer={ANSWER} />)

    expect(
      screen.getByRole('button', { name: /ai-generated voice/i }),
    ).toBeInTheDocument()
  })
})

describe('only a server answer is ever spoken', () => {
  it('speaks exactly the answer it was given', async () => {
    const user = userEvent.setup()
    render(<AnswerSpeech answer={ANSWER} />)

    await user.click(screen.getByRole('button', { name: /listen/i }))

    expect(synthesis.speak).toHaveBeenCalledTimes(1)
    expect(spoken[0].text).toBe(ANSWER)
  })

  it('renders nothing when there is no answer to speak', () => {
    const { container } = render(<AnswerSpeech answer="   " />)

    expect(container).toBeEmptyDOMElement()
  })

  it('applies a language hint so a Swahili answer is not read as English', async () => {
    const user = userEvent.setup()
    render(<AnswerSpeech answer={ANSWER} lang="sw-KE" />)

    await user.click(screen.getByRole('button', { name: /listen/i }))

    expect(spoken[0].lang).toBe('sw-KE')
  })
})

describe('playback can always be stopped', () => {
  it('offers a stop control while speaking', async () => {
    const user = userEvent.setup()
    render(<AnswerSpeech answer={ANSWER} />)

    await user.click(screen.getByRole('button', { name: /listen/i }))

    expect(
      await screen.findByRole('button', { name: /stop the ai-generated voice/i }),
    ).toBeInTheDocument()
  })

  it('stops when the control is pressed again', async () => {
    const user = userEvent.setup()
    render(<AnswerSpeech answer={ANSWER} />)

    await user.click(screen.getByRole('button', { name: /listen/i }))
    await user.click(screen.getByRole('button', { name: /stop/i }))

    expect(synthesis.cancel).toHaveBeenCalled()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /listen/i })).toBeInTheDocument(),
    )
  })

  it('stops when the panel closes and the component unmounts', async () => {
    const user = userEvent.setup()
    const view = render(<AnswerSpeech answer={ANSWER} />)

    await user.click(screen.getByRole('button', { name: /listen/i }))
    const before = cancelCalls

    view.unmount()

    // Closing the panel must not leave a voice talking over an empty screen.
    expect(cancelCalls).toBeGreaterThan(before)
  })

  it('returns to the listen state when speech finishes on its own', async () => {
    const user = userEvent.setup()
    render(<AnswerSpeech answer={ANSWER} />)

    await user.click(screen.getByRole('button', { name: /listen/i }))
    spoken[0].onend?.()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /listen/i })).toBeInTheDocument(),
    )
  })
})

describe('browsers without speech synthesis', () => {
  it('offers no control rather than a dead button', () => {
    // @ts-expect-error deliberately removing the API to model an old browser
    delete window.speechSynthesis
    const { container } = render(<AnswerSpeech answer={ANSWER} />)

    expect(container).toBeEmptyDOMElement()
  })
})
