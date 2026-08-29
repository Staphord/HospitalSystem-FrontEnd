import { useEffect, useId, useRef, useState } from 'react'
import { AssistantAnswer } from '@/features/assistant/components/AssistantAnswer'
import { VoiceControls } from '@/features/assistant/components/VoiceControls'
import type { AssistantTurn, UseAssistantChat } from '@/features/assistant/hooks/useAssistantChat'

/** Matches the server-side limit, so an over-long question is caught before it is sent. */
export const MAX_QUESTION_CHARS = 2000

const SUGGESTIONS = [
  'How do I register a new patient?',
  'What reports can I run?',
  'Where do I find a patient visit history?',
]

interface AssistantPanelProps {
  chat: UseAssistantChat
  onClose: () => void
}

function SourceList({ turn }: { turn: AssistantTurn }) {
  if (turn.sources.length === 0) return null

  return (
    <div className="mt-2 border-t border-border-subtle pt-2">
      <p className="text-xs font-semibold text-on-surface-variant">Sources</p>
      <ul className="mt-1 space-y-0.5">
        {turn.sources.map((source, index) => (
          <li key={index} className="text-xs text-on-surface-variant">
            {source.label}
            {source.version ? ` (version ${source.version})` : ''}
          </li>
        ))}
      </ul>
    </div>
  )
}

function FeedbackControls({
  turn,
  onRate,
}: {
  turn: AssistantTurn
  onRate: (rating: 'helpful' | 'not_helpful') => void
}) {
  if (!turn.requestId || turn.answerStatus !== 'supported') return null

  if (turn.rating) {
    return (
      <p className="mt-2 text-xs text-on-surface-variant" role="status">
        Thanks for the feedback.
      </p>
    )
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <span className="text-xs text-on-surface-variant">Was this helpful?</span>
      <button
        type="button"
        onClick={() => onRate('helpful')}
        className="rounded px-2 py-0.5 text-xs text-on-surface-variant hover:bg-hover-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onRate('not_helpful')}
        className="rounded px-2 py-0.5 text-xs text-on-surface-variant hover:bg-hover-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        No
      </button>
    </div>
  )
}

function TurnView({
  turn,
  onRate,
  onRetry,
}: {
  turn: AssistantTurn
  onRate: (rating: 'helpful' | 'not_helpful') => void
  onRetry: () => void
}) {
  return (
    <li className="space-y-2">
      <p className="ml-auto w-fit max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-white">
        {turn.question}
      </p>

      {turn.state === 'pending' && (
        <p className="text-sm text-on-surface-variant" role="status">
          Thinking...
        </p>
      )}

      {turn.state === 'answered' && turn.answer && (
        <div className="rounded-lg bg-surface-container-high px-3 py-2">
          {turn.answerStatus !== 'supported' && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              {turn.answerStatus === 'unsupported' ? 'Outside what I can answer' : 'Unavailable'}
            </p>
          )}
          <AssistantAnswer answer={turn.answer} />
          <SourceList turn={turn} />
          <FeedbackControls turn={turn} onRate={onRate} />
        </div>
      )}

      {turn.state === 'failed' && turn.failure && (
        <div className="rounded-lg border border-error-container bg-error-container px-3 py-2" role="alert">
          <p className="text-sm text-on-surface">{turn.failure.message}</p>
          {turn.failure.retryable && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 rounded px-2 py-0.5 text-xs font-semibold text-primary hover:bg-hover-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Try again
            </button>
          )}
        </div>
      )}
    </li>
  )
}

export function AssistantPanel({ chat, onClose }: AssistantPanelProps) {
  const [question, setQuestion] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const conversationEndRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  const { turns, isSending, isPermissionDenied, ask, cancel, retry, rate } = chat

  // Opening the panel moves focus to the input so a keyboard user can type
  // immediately without tabbing through the whole shell.
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView?.({ block: 'end' })
  }, [turns])

  const tooLong = question.length > MAX_QUESTION_CHARS
  const canSend = question.trim().length > 0 && !tooLong && !isSending

  const submit = () => {
    if (!canSend) return
    const pending = question
    setQuestion('')
    void ask(pending)
  }

  if (isPermissionDenied) {
    return (
      <section
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        className="flex w-[min(24rem,calc(100vw-2rem))] flex-col rounded-xl border border-border-subtle bg-surface shadow-lg"
      >
        <header className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <h2 id={titleId} className="text-sm font-semibold text-on-surface">
            Hospital Assistant
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close assistant"
            className="rounded p-1 text-on-surface-variant hover:bg-hover-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
              close
            </span>
          </button>
        </header>
        <div className="px-4 py-6" role="alert">
          <p className="text-sm text-on-surface">Your role does not have access to the assistant.</p>
        </div>
      </section>
    )
  }

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className="flex max-h-[min(32rem,calc(100vh-8rem))] w-[min(24rem,calc(100vw-2rem))] flex-col rounded-xl border border-border-subtle bg-surface shadow-lg"
    >
      <header className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <div>
          <h2 id={titleId} className="text-sm font-semibold text-on-surface">
            Hospital Assistant
          </h2>
          <p className="text-xs text-on-surface-variant">Operational help. Read-only.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close assistant"
          className="rounded p-1 text-on-surface-variant hover:bg-hover-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
            close
          </span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {turns.length === 0 ? (
          <div>
            <p className="text-sm text-on-surface-variant">
              Ask how to use the hospital system. I can explain screens, reports, and policy.
            </p>
            <p className="mt-2 text-xs text-on-surface-variant">
              I cannot give clinical advice, and I cannot change any hospital record.
            </p>
            <ul className="mt-3 space-y-1">
              {SUGGESTIONS.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => void ask(suggestion)}
                    className="w-full rounded border border-border-subtle px-2 py-1.5 text-left text-xs text-on-surface hover:bg-hover-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ul className="space-y-4">
            {turns.map((turn) => (
              <TurnView
                key={turn.id}
                turn={turn}
                onRate={(rating) => void rate(turn.id, rating)}
                onRetry={() => void retry()}
              />
            ))}
          </ul>
        )}
        <div ref={conversationEndRef} />
      </div>

      <footer className="border-t border-border-subtle px-4 py-3">
        <label htmlFor="assistant-question" className="sr-only">
          Ask the hospital assistant a question
        </label>
        <textarea
          id="assistant-question"
          ref={inputRef}
          rows={2}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              submit()
            }
          }}
          placeholder="Ask about using the system"
          aria-invalid={tooLong}
          aria-describedby={tooLong ? 'assistant-question-error' : undefined}
          className="w-full resize-none rounded border border-border-subtle bg-white px-2 py-1.5 text-sm text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />

        {tooLong && (
          <p id="assistant-question-error" className="mt-1 text-xs text-error" role="alert">
            That question is too long. Keep it under {MAX_QUESTION_CHARS} characters.
          </p>
        )}

        {/*
          Pressing Use this in the review step is the explicit confirmation, so
          the confirmed words are asked exactly as the user approved them. A
          transcript never reaches this point on its own.
        */}
        <VoiceControls onConfirm={(text) => void ask(text)} disabled={isSending} />

        <div className="mt-2 flex items-center justify-end gap-2">
          {isSending && (
            <button
              type="button"
              onClick={cancel}
              className="rounded px-2 py-1 text-xs font-semibold text-on-surface-variant hover:bg-hover-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            className="rounded bg-primary px-3 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Send
          </button>
        </div>
      </footer>
    </section>
  )
}
