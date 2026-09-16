import { useCallback, useEffect, useRef, useState } from 'react'
import { assistantService } from '@/api/services/assistant'
import type { AssistantVoiceLanguage } from '@/api/types/assistant'
import {
  isCancellation,
  toAssistantFailure,
  toMicrophoneFailure,
  type AssistantFailure,
} from '@/features/assistant/lib/assistantErrors'

/**
 * Push-to-talk voice capture.
 *
 * The microphone is opened only when the user presses record, and it is closed
 * again the moment recording ends, is cancelled, or the panel unmounts, so the
 * browser's recording indicator reflects reality at all times.
 *
 * Nothing is persisted. The recording lives in memory for as long as it takes
 * to upload it and is then dropped; the transcript lives in component state
 * until the panel closes. Neither is ever written to local storage.
 *
 * The transcript is the end of this hook's job. It is handed back for the user
 * to read and correct, and only the user can submit it.
 */

/** Matches the server limit, so the browser stops before the server refuses. */
export const MAX_RECORDING_MS = 60_000

/** Matches the server limit, so an oversized capture is caught before upload. */
export const MAX_RECORDING_BYTES = 5 * 1024 * 1024

/**
 * Containers to ask MediaRecorder for, best first.
 *
 * These are the ones the server accepts. Chrome and Edge give WebM/Opus,
 * Firefox gives Ogg or WebM, Safari gives MP4.
 */
const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/mp4',
]

export type VoiceState =
  | 'unsupported'
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'uploading'
  | 'review'
  | 'no_speech'
  | 'failed'

export interface UseVoiceAssistant {
  state: VoiceState
  /** Whether this browser can record at all. */
  isSupported: boolean
  /** Milliseconds recorded so far, for the recording indicator. */
  elapsedMs: number
  /** The transcript awaiting the user's confirmation, editable. */
  transcript: string
  /** Language the server reported detecting, for display only. */
  detectedLanguage: string | null
  failure: AssistantFailure | null
  start: () => Promise<void>
  stop: () => void
  cancel: () => void
  setTranscript: (value: string) => void
  reset: () => void
}

function pickMimeType(): string | undefined {
  const recorder = typeof window === 'undefined' ? undefined : window.MediaRecorder
  if (!recorder?.isTypeSupported) return undefined
  return PREFERRED_MIME_TYPES.find((type) => recorder.isTypeSupported(type))
}

function detectSupport(): boolean {
  if (typeof window === 'undefined') return false
  if (typeof window.MediaRecorder === 'undefined') return false
  return Boolean(navigator.mediaDevices?.getUserMedia)
}

export function useVoiceAssistant(
  language?: AssistantVoiceLanguage,
): UseVoiceAssistant {
  const [isSupported] = useState(detectSupport)
  const [state, setState] = useState<VoiceState>(() =>
    detectSupport() ? 'idle' : 'unsupported',
  )
  const [elapsedMs, setElapsedMs] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null)
  const [failure, setFailure] = useState<AssistantFailure | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const controllerRef = useRef<AbortController | null>(null)
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAtRef = useRef(0)
  const discardedRef = useRef(false)
  const mountedRef = useRef(true)

  /** Close the microphone and clear every timer. Safe to call repeatedly. */
  const release = useCallback(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current)
      stopTimerRef.current = null
    }
    if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    recorderRef.current = null
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      discardedRef.current = true
      controllerRef.current?.abort()
      try {
        recorderRef.current?.stop()
      } catch {
        // Already stopped. The microphone still has to be released below.
      }
      release()
    }
  }, [release])

  const upload = useCallback(
    async (audio: Blob) => {
      if (audio.size === 0) {
        setState('failed')
        setFailure(toAssistantFailure(new Error('empty recording')))
        return
      }
      if (audio.size > MAX_RECORDING_BYTES) {
        // Caught here so the user is told immediately rather than after
        // uploading several megabytes only to be refused.
        setState('failed')
        setFailure({
          kind: 'too_large',
          message: 'That recording is too long. Keep it under a minute.',
          retryable: true,
        })
        return
      }

      const controller = new AbortController()
      controllerRef.current = controller
      setState('uploading')

      try {
        const response = await assistantService.transcribe(audio, {
          language,
          signal: controller.signal,
        })
        if (!mountedRef.current || discardedRef.current) return

        if (response.status === 'no_speech_detected') {
          setTranscript('')
          setDetectedLanguage(null)
          setState('no_speech')
          return
        }

        setTranscript(response.transcript)
        setDetectedLanguage(response.language ?? null)
        setState('review')
      } catch (error) {
        if (!mountedRef.current || discardedRef.current) return
        if (isCancellation(error)) {
          setState('idle')
          return
        }
        setFailure(toAssistantFailure(error))
        setState('failed')
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null
      }
    },
    [language],
  )

  const start = useCallback(async () => {
    if (!isSupported) {
      setState('unsupported')
      return
    }

    setFailure(null)
    setTranscript('')
    setDetectedLanguage(null)
    setElapsedMs(0)
    discardedRef.current = false
    chunksRef.current = []
    setState('requesting')

    let stream: MediaStream
    try {
      // The permission prompt appears here and nowhere else, so it can only
      // ever follow a deliberate press of the record control.
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (error) {
      if (!mountedRef.current) return
      setFailure(toMicrophoneFailure(error))
      setState('failed')
      return
    }

    if (!mountedRef.current || discardedRef.current) {
      stream.getTracks().forEach((track) => track.stop())
      return
    }

    streamRef.current = stream

    let recorder: MediaRecorder
    try {
      const mimeType = pickMimeType()
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    } catch {
      release()
      setFailure(toMicrophoneFailure({ name: 'UnsupportedError' }))
      setState('failed')
      return
    }

    recorderRef.current = recorder

    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) chunksRef.current.push(event.data)
    }

    recorder.onerror = () => {
      release()
      if (!mountedRef.current) return
      setFailure(toAssistantFailure(new Error('recording failed')))
      setState('failed')
    }

    recorder.onstop = () => {
      const type = recorder.mimeType || 'audio/webm'
      const chunks = chunksRef.current
      chunksRef.current = []
      release()

      if (discardedRef.current || !mountedRef.current) return
      void upload(new Blob(chunks, { type }))
    }

    recorder.start()
    startedAtRef.current = Date.now()
    setState('recording')

    tickRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startedAtRef.current)
    }, 200)

    // A recording that runs past the server limit would be refused after the
    // upload, so it is stopped here instead and the user keeps what they said.
    stopTimerRef.current = setTimeout(() => {
      try {
        recorderRef.current?.stop()
      } catch {
        release()
      }
    }, MAX_RECORDING_MS)
  }, [isSupported, release, upload])

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop()
        return
      } catch {
        // Fall through to releasing the microphone.
      }
    }
    release()
  }, [release])

  const cancel = useCallback(() => {
    // Everything in flight is dropped: the recording is not uploaded, and an
    // upload already under way is aborted.
    discardedRef.current = true
    chunksRef.current = []
    controllerRef.current?.abort()
    try {
      recorderRef.current?.stop()
    } catch {
      // Already stopped.
    }
    release()
    setElapsedMs(0)
    setTranscript('')
    setDetectedLanguage(null)
    setFailure(null)
    setState(isSupported ? 'idle' : 'unsupported')
  }, [isSupported, release])

  const reset = useCallback(() => {
    discardedRef.current = true
    setTranscript('')
    setDetectedLanguage(null)
    setFailure(null)
    setElapsedMs(0)
    setState(isSupported ? 'idle' : 'unsupported')
  }, [isSupported])

  return {
    state,
    isSupported,
    elapsedMs,
    transcript,
    detectedLanguage,
    failure,
    start,
    stop,
    cancel,
    setTranscript,
    reset,
  }
}
