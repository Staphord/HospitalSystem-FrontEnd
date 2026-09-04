import { useEffect, useId, useRef, useState } from 'react'
import { assistantService } from '@/api/services/assistant'
import type {
  AssistantConversationSummary,
  AssistantSuggestion,
} from '@/api/types/assistant'
import { AssistantAnswer } from '@/features/assistant/components/AssistantAnswer'
import { VoiceControls } from '@/features/assistant/components/VoiceControls'
import type { AssistantTurn, UseAssistantChat } from '@/features/assistant/hooks/useAssistantChat'

/** Matches the server-side limit, so an over-long question is caught before it is sent. */
export const MAX_QUESTION_CHARS = 2000

/**
 * Starting questions come from the server, which is the only side that knows
 * which content this user may read and which figures their roles reach.
 *
 * This list used to be three strings hardcoded here. Two of them matched no
 * content at all, so anyone who tried one was told the assistant did not have
 * that information, and the third only worked for reception - a doctor, a
 * cashier or a lab technician was being invited to ask something that could not
 * be answered for them. A suggestion that fails teaches people the assistant
 * does not work, so there is deliberately no fallback list here: when the call
 * fails the panel shows no suggestions rather than three that might not work.
 */
function useAssistantSuggestions(enabled: boolean) {
  const [suggestions, setSuggestions] = useState<AssistantSuggestion[]>([])

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    assistantService
      .getSuggestions(controller.signal)
      .then((response) => setSuggestions(response.suggestions ?? []))
      .catch(() => setSuggestions([]))
    return () => controller.abort()
  }, [enabled])

  return suggestions
}

interface AssistantPanelProps {
  chat: UseAssistantChat
  onClose: () => void
}

/*
 * There is deliberately no Sources list under an answer.
 *
 * It was noise. Retrieval cites everything that scored above zero, so a question
 * about taking a payment was footnoted "Do not share accounts or sign-in
 * details", and a reader was no better off for knowing it. Sources are still
 * recorded server-side on the stored exchange and the audit record, so any
 * answer can be traced back to the content and readings that produced it - that
 * tracing is for whoever investigates an answer, not for the person reading one.
 */

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

/**
 * What to ask next, under the answer just given.
 *
 * The same vetted questions the panel opens with, ranked by the server against
 * what was just asked. A reply used to be a dead end: the starting questions
 * disappeared with the first one asked, and from then on the staff member faced
 * an empty box and had to guess what else the assistant knew. Only the latest
 * answer carries them, because a list under every reply in a long thread is
 * clutter, and the questions offered halfway up are answers to a moment that
 * has passed.
 */
function FollowUps({
  followUps,
  onAsk,
}: {
  followUps: string[]
  onAsk: (question: string) => void
}) {
  if (followUps.length === 0) return null

  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-on-surface-variant">Ask next</p>
      <ul className="mt-1 space-y-1">
        {followUps.map((question) => (
          <li key={question}>
            <button
              type="button"
              onClick={() => onAsk(question)}
              className="w-full rounded border border-border-subtle px-2 py-1.5 text-left text-xs text-on-surface hover:bg-hover-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {question}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function TurnView({
  turn,
  isLatest,
  onAsk,
  onRate,
  onRetry,
}: {
  turn: AssistantTurn
  /** Only the newest answer offers follow-ups. */
  isLatest: boolean
  onAsk: (question: string) => void
  onRate: (rating: 'helpful' | 'not_helpful') => void
  onRetry: () => void
}) {
  return (
    <li className="space-y-2">
      {turn.question && (
        <p className="ml-auto w-fit max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-white">
          {turn.question}
        </p>
      )}

      {turn.state === 'pending' && (
        <p className="text-sm text-on-surface-variant" role="status">
          Thinking...
        </p>
      )}

      {turn.state === 'answered' && turn.answer && (
        <div className="rounded-lg bg-surface-container-high px-3 py-2">
          {/*
            No "Outside what I can answer" banner. A refusal now opens with "I
            can't help with that" and goes straight on to a numbered list of what
            this user can ask instead, so the heading only said the same thing
            twice, and more coldly. "Unavailable" stays: that is a different
            state - the assistant broke rather than declined.
          */}
          {turn.answerStatus === 'unavailable' && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Unavailable
            </p>
          )}
          <AssistantAnswer answer={turn.answer} />
          <FeedbackControls turn={turn} onRate={onRate} />
          {isLatest && <FollowUps followUps={turn.followUps} onAsk={onAsk} />}
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

/**
 * When a conversation was last used, in the words staff actually use.
 *
 * Times are shown in the browser's own locale and zone: a ward in Dar es Salaam
 * should not read a timestamp from the server's zone.
 */
export function formatLastUsed(iso: string, now: Date = new Date()): string {
  const when = new Date(iso)
  if (Number.isNaN(when.getTime())) return ''

  const sameDay = when.toDateString() === now.toDateString()
  if (sameDay) {
    return when.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (when.toDateString() === yesterday.toDateString()) return 'Yesterday'

  return when.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

function HistoryView({
  conversations,
  isLoading,
  activeId,
  onOpen,
  onDelete,
  onClearAll,
}: {
  conversations: AssistantConversationSummary[]
  isLoading: boolean
  activeId: string | null
  onOpen: (conversationId: string) => void
  onDelete: (conversationId: string) => void
  onClearAll: () => void
}) {
  // Clearing everything is confirmed in place rather than through a browser
  // dialog, so the panel keeps focus and the wording is the hospital's own.
  const [isConfirmingClear, setIsConfirmingClear] = useState(false)

  if (isLoading && conversations.length === 0) {
    return (
      <p className="text-sm text-on-surface-variant" role="status">
        Loading your previous chats...
      </p>
    )
  }

  if (conversations.length === 0) {
    return (
      <p className="text-sm text-on-surface-variant">
        You have no previous chats yet. Ask a question and it will be saved here.
      </p>
    )
  }

  return (
    <div>
      <ul className="space-y-1">
        {conversations.map((conversation) => (
          <li key={conversation.conversation_id} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onOpen(conversation.conversation_id)}
              aria-current={
                conversation.conversation_id === activeId ? 'true' : undefined
              }
              className="flex-1 rounded px-2 py-1.5 text-left hover:bg-hover-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-primary aria-[current]:bg-hover-tint"
            >
              <span className="block truncate text-sm text-on-surface">
                {conversation.title}
              </span>
              <span className="block text-xs text-on-surface-variant">
                {formatLastUsed(conversation.last_message_at)}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(conversation.conversation_id)}
              aria-label={`Delete chat: ${conversation.title}`}
              className="rounded p-1 text-on-surface-variant hover:bg-hover-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                delete
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-3 border-t border-border-subtle pt-2">
        {isConfirmingClear ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant">Delete all your chats?</span>
            <button
              type="button"
              onClick={() => {
                setIsConfirmingClear(false)
                onClearAll()
              }}
              className="rounded px-2 py-0.5 text-xs font-semibold text-error hover:bg-hover-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Delete all
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmingClear(false)}
              className="rounded px-2 py-0.5 text-xs text-on-surface-variant hover:bg-hover-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Keep them
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsConfirmingClear(true)}
            className="rounded px-2 py-0.5 text-xs text-on-surface-variant hover:bg-hover-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Delete all chats
          </button>
        )}
      </div>
    </div>
  )
}


export function AssistantPanel({ chat, onClose }: AssistantPanelProps) {
  const [question, setQuestion] = useState('')
  // The panel shows either the current conversation or the list of earlier
  // ones. One at a time, so a small floating panel is never two things at once.
  const [isBrowsingHistory, setIsBrowsingHistory] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const conversationEndRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  const {
    turns,
    isSending,
    isPermissionDenied,
    ask,
    cancel,
    retry,
    rate,
    conversationId,
    conversations,
    isHistoryAvailable,
    isHistoryLoading,
    historyFailure,
    refreshHistory,
    openConversation,
    startNewConversation,
    deleteConversation,
    clearHistory,
  } = chat

  // Fetched once, and only while there is an empty conversation to put them in.
  // A user who is denied the assistant outright is never shown a starting
  // question, because the request that would fetch one is refused too.
  const suggestions = useAssistantSuggestions(!isPermissionDenied)

  // Whether this caller can ask about medicines, taken from what the server
  // offered rather than from any role check here. A medicine suggestion is only
  // ever returned to somebody who passes the medication capability's own gate,
  // so this cannot promise an answer the server would then refuse - and the
  // panel does not gain a second copy of a permission rule to keep in step.
  const offersMedicines = suggestions.some(
    (suggestion) => suggestion.kind === 'medicine',
  )

  // Opening the panel moves focus to the input so a keyboard user can type
  // immediately without tabbing through the whole shell.
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // The list is fetched once when the panel opens. A deployment with history
  // switched off answers 404, the hook withdraws the controls, and nothing here
  // asks again.
  useEffect(() => {
    void refreshHistory()
  }, [refreshHistory])

  useEffect(() => {
    if (!isBrowsingHistory) conversationEndRef.current?.scrollIntoView?.({ block: 'end' })
  }, [turns, isBrowsingHistory])

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
        <div className="flex items-center gap-1">
          {isHistoryAvailable && (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsBrowsingHistory(false)
                  startNewConversation()
                  inputRef.current?.focus()
                }}
                aria-label="Start a new chat"
                title="New chat"
                className="rounded p-1 text-on-surface-variant hover:bg-hover-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                  add_comment
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = !isBrowsingHistory
                  setIsBrowsingHistory(next)
                  if (next) void refreshHistory()
                }}
                aria-label={isBrowsingHistory ? 'Back to this chat' : 'Previous chats'}
                aria-pressed={isBrowsingHistory}
                title={isBrowsingHistory ? 'Back to this chat' : 'Previous chats'}
                className="rounded p-1 text-on-surface-variant hover:bg-hover-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-primary aria-pressed:bg-hover-tint"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                  {isBrowsingHistory ? 'arrow_back' : 'history'}
                </span>
              </button>
            </>
          )}
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
        </div>
      </header>

      {historyFailure && (
        <p className="border-b border-border-subtle px-4 py-2 text-xs text-on-surface-variant" role="status">
          {historyFailure.message}
        </p>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {isBrowsingHistory ? (
          <HistoryView
            conversations={conversations}
            isLoading={isHistoryLoading}
            activeId={conversationId}
            onOpen={(id) => {
              void openConversation(id)
              setIsBrowsingHistory(false)
            }}
            onDelete={(id) => void deleteConversation(id)}
            onClearAll={() => void clearHistory()}
          />
        ) : turns.length === 0 ? (
          <div>
            <p className="text-sm text-on-surface-variant">
              {offersMedicines
                ? 'Ask how to use the hospital system, or ask about a medicine. I can explain screens, reports, and policy, and answer from the hospital medicines reference.'
                : 'Ask how to use the hospital system. I can explain screens, reports, and policy.'}
            </p>
            <p className="mt-2 text-xs text-on-surface-variant">
              {offersMedicines
                ? 'Medicine answers are decision support from the hospital reference, not a prescription. I cannot change any hospital record.'
                : 'I cannot give clinical advice, and I cannot change any hospital record.'}
            </p>
            {suggestions.length > 0 && (
              <>
                <p className="mt-3 text-xs font-semibold text-on-surface-variant">
                  Try asking
                </p>
                <ul className="mt-1 space-y-1">
                  {suggestions.map((suggestion) => (
                    <li key={suggestion.question}>
                      <button
                        type="button"
                        onClick={() => void ask(suggestion.question)}
                        className="w-full rounded border border-border-subtle px-2 py-1.5 text-left text-xs text-on-surface hover:bg-hover-tint focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        {suggestion.question}
                        {suggestion.kind === 'live_metric' && (
                          <span className="ml-1 text-on-surface-variant">
                            &middot; live figure
                          </span>
                        )}
                        {suggestion.kind === 'medicine' && (
                          <span className="ml-1 text-on-surface-variant">
                            &middot; medicines reference
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ) : (
          <ul className="space-y-4">
            {turns.map((turn, index) => (
              <TurnView
                key={turn.id}
                turn={turn}
                isLatest={index === turns.length - 1 && !isSending}
                onAsk={(followUp) => void ask(followUp)}
                onRate={(rating) => void rate(turn.id, rating)}
                onRetry={() => void retry()}
              />
            ))}
          </ul>
        )}
        <div ref={conversationEndRef} />
      </div>

      <footer
        className="border-t border-border-subtle px-4 py-3"
        hidden={isBrowsingHistory}
      >
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
