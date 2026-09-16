import { useEffect, useId, useRef } from 'react'
import { useVoiceAssistant, MAX_RECORDING_MS } from '@/features/assistant/hooks/useVoiceAssistant'

/**
 * Push-to-talk control and transcript review.
 *
 * The microphone opens only when the user presses Record, recording is visibly
 * announced while it runs, and the words that come back are shown for the user
 * to read and correct. Nothing is submitted until they press Use this, so an
 * unconfirmed transcript never leaves this component.
 */

interface VoiceControlsProps {
  /** Called with the transcript the user confirmed. */
  onConfirm: (transcript: string) => void
  /** Whether the panel is busy sending a question, which blocks recording. */
  disabled?: boolean
}

function seconds(ms: number): string {
  return `${Math.floor(ms / 1000)}s`
}

export function VoiceControls({ onConfirm, disabled = false }: VoiceControlsProps) {
  const voice = useVoiceAssistant()
  const transcriptId = useId()
  const transcriptRef = useRef<HTMLTextAreaElement>(null)

  const { state, cancel, stop } = voice

  // Escape abandons a recording or a pending transcript without leaving the
  // microphone open. The panel also closes on Escape, which unmounts this
  // component and releases the microphone either way.
  useEffect(() => {
    if (state === 'idle' || state === 'unsupported') return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      cancel()
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [state, cancel])

  // Moving focus to the transcript lets a keyboard user correct it immediately
  // rather than tabbing back through the controls.
  useEffect(() => {
    if (state === 'review') transcriptRef.current?.focus()
  }, [state])

  if (!voice.isSupported) {
    return (
      <p className="mt-2 text-xs text-on-surface-variant" role="note">
        Voice input is not available in this browser. Type your question instead.
      </p>
    )
  }

  const confirm = () => {
    const text = voice.transcript.trim()
    if (!text) return
    onConfirm(text)
    voice.reset()
  }

  return (
    <div className="mt-2">
      {state === 'idle' && (
        <button
          type="button"
          onClick={() => void voice.start()}
          disabled={disabled}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-on-surface-variant hover:bg-hover-tint disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
            mic
          </span>
          Record a question
        </button>
      )}

      {state === 'requesting' && (
        <p className="text-xs text-on-surface-variant" role="status">
          Waiting for microphone permission...
        </p>
      )}

      {state === 'recording' && (
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 animate-pulse rounded-full bg-error"
            aria-hidden="true"
          />
          <span className="text-xs font-semibold text-error" role="status">
            Recording {seconds(voice.elapsedMs)} of {seconds(MAX_RECORDING_MS)}
          </span>
          <button
            type="button"
            onClick={stop}
            className="rounded bg-primary px-2 py-1 text-xs font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Stop
          </button>
          <button
            type="button"
            onClick={cancel}
            className="rounded px-2 py-1 text-xs font-semibold text-on-surface-variant hover:bg-hover-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Cancel
          </button>
        </div>
      )}

      {state === 'uploading' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-on-surface-variant" role="status">
            Transcribing...
          </span>
          <button
            type="button"
            onClick={cancel}
            className="rounded px-2 py-1 text-xs font-semibold text-on-surface-variant hover:bg-hover-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Cancel
          </button>
        </div>
      )}

      {state === 'no_speech' && (
        <div role="status">
          <p className="text-xs text-on-surface-variant">
            I did not hear anything. Try recording again.
          </p>
          <button
            type="button"
            onClick={() => void voice.start()}
            className="mt-1 rounded px-2 py-1 text-xs font-semibold text-primary hover:bg-hover-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Record again
          </button>
        </div>
      )}

      {state === 'failed' && voice.failure && (
        <div
          className="rounded border border-error-container bg-error-container px-2 py-1.5"
          role="alert"
        >
          <p className="text-xs text-on-surface">{voice.failure.message}</p>
          {voice.failure.retryable && (
            <button
              type="button"
              onClick={() => void voice.start()}
              className="mt-1 rounded px-2 py-0.5 text-xs font-semibold text-primary hover:bg-hover-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {state === 'review' && (
        <div className="rounded border border-border-subtle px-2 py-2">
          <label htmlFor={transcriptId} className="text-xs font-semibold text-on-surface">
            Check what I heard before sending
          </label>
          <textarea
            id={transcriptId}
            ref={transcriptRef}
            rows={3}
            value={voice.transcript}
            onChange={(event) => voice.setTranscript(event.target.value)}
            className="mt-1 w-full resize-none rounded border border-border-subtle bg-white px-2 py-1.5 text-sm text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <p className="mt-1 text-xs text-on-surface-variant">
            Nothing is sent until you choose Use this. The recording is not kept.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={confirm}
              disabled={!voice.transcript.trim()}
              className="rounded bg-primary px-3 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Use this
            </button>
            <button
              type="button"
              onClick={() => void voice.start()}
              className="rounded px-2 py-1 text-xs font-semibold text-on-surface-variant hover:bg-hover-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Record again
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded px-2 py-1 text-xs font-semibold text-on-surface-variant hover:bg-hover-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
