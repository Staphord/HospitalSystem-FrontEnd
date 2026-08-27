import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Reads an assistant answer aloud.
 *
 * Two deliberate constraints. First, the only text this will ever speak is an
 * answer the server returned and the panel is already displaying: it is handed
 * the rendered answer, never a field the user typed and never text from
 * anywhere else. Second, the speech is produced by the browser's own
 * synthesiser, so no answer text is sent to a speech vendor and no audio is
 * generated, stored, or served by the hospital system.
 *
 * The voice is synthetic and is labelled as such wherever it can be heard or
 * seen, so nobody mistakes it for a person.
 */

interface AnswerSpeechProps {
  /** The server-returned answer to speak. Never user input. */
  answer: string
  /** BCP-47 hint so a Swahili answer is not read with an English voice. */
  lang?: string
}

function isSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function AnswerSpeech({ answer, lang }: AnswerSpeechProps) {
  const [speaking, setSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const stop = useCallback(() => {
    if (!isSupported()) return
    window.speechSynthesis.cancel()
    utteranceRef.current = null
    setSpeaking(false)
  }, [])

  // Closing the panel, pressing Escape, or navigating away all unmount this
  // component, and the voice must stop with it rather than carry on talking
  // over an empty screen.
  useEffect(() => stop, [stop])

  if (!isSupported() || !answer.trim()) return null

  const speak = () => {
    if (speaking) {
      stop()
      return
    }

    // Cancel anything already queued, so pressing Listen on a second answer
    // replaces the first rather than talking over it.
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(answer)
    if (lang) utterance.lang = lang
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    utteranceRef.current = utterance
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        type="button"
        onClick={speak}
        aria-label={
          speaking ? 'Stop the AI-generated voice' : 'Listen to this answer in an AI-generated voice'
        }
        className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-on-surface-variant hover:bg-hover-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
          {speaking ? 'stop_circle' : 'volume_up'}
        </span>
        {speaking ? 'Stop' : 'Listen'}
      </button>
      <span className="text-xs text-on-surface-variant">AI-generated voice</span>
    </div>
  )
}
