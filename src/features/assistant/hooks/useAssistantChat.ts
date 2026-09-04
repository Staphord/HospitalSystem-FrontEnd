import { useCallback, useEffect, useRef, useState } from 'react'
import { assistantService } from '@/api/services/assistant'
import type {
  AssistantAnswerStatus,
  AssistantConversationSummary,
  AssistantFeedbackRating,
  AssistantSource,
  AssistantStoredMessage,
} from '@/api/types/assistant'
import {
  isCancellation,
  toAssistantFailure,
  type AssistantFailure,
} from '@/features/assistant/lib/assistantErrors'

export interface AssistantTurn {
  /** Local identifier. Not the server request id. */
  id: string
  question: string
  state: 'pending' | 'answered' | 'failed'
  answer?: string
  answerStatus?: AssistantAnswerStatus
  sources: AssistantSource[]
  followUps: string[]
  requestId?: string
  failure?: AssistantFailure
  /** Rating already submitted for this answer, if any. */
  rating?: AssistantFeedbackRating
}

export interface UseAssistantChat {
  turns: AssistantTurn[]
  isSending: boolean
  /** Set when the server reports the capability is off for this deployment. */
  isCapabilityDisabled: boolean
  /** Set when the server refuses this caller's role. */
  isPermissionDenied: boolean
  ask: (question: string) => Promise<void>
  cancel: () => void
  retry: () => Promise<void>
  rate: (turnId: string, rating: AssistantFeedbackRating) => Promise<void>
  reset: () => void

  // Chat history
  /** The thread the current turns belong to, once the server has stored one. */
  conversationId: string | null
  /** The user's own previous conversations, most recently used first. */
  conversations: AssistantConversationSummary[]
  /**
   * Whether history is usable at all. False when the deployment has the
   * capability switched off, so the panel offers no history controls rather
   * than offering ones that always fail.
   */
  isHistoryAvailable: boolean
  isHistoryLoading: boolean
  historyFailure?: AssistantFailure
  refreshHistory: () => Promise<void>
  openConversation: (conversationId: string) => Promise<void>
  startNewConversation: () => void
  deleteConversation: (conversationId: string) => Promise<void>
  clearHistory: () => Promise<void>
}

let turnCounter = 0
function nextTurnId(): string {
  turnCounter += 1
  return `turn-${turnCounter}`
}

/**
 * Rebuild the panel's turns from one stored conversation.
 *
 * Messages arrive oldest first, ordered by the server. A question opens a turn
 * and the answer that follows closes it. The two are paired defensively rather
 * than assumed to alternate, so a thread that ends on an unanswered question,
 * or one whose pairing is imperfect, still renders instead of throwing.
 */
export function turnsFromMessages(
  messages: AssistantStoredMessage[],
  followUps: string[] = [],
): AssistantTurn[] {
  const turns: AssistantTurn[] = []

  for (const message of messages) {
    if (message.author === 'user') {
      turns.push({
        id: message.message_id,
        question: message.body,
        // A stored question whose answer never arrived stays visible as a
        // question, not as a request that is still in flight.
        state: 'answered',
        sources: [],
        followUps: [],
      })
      continue
    }

    const open = turns[turns.length - 1]
    if (open && open.answer === undefined) {
      open.answer = message.body
      open.answerStatus = message.answer_status ?? 'supported'
      open.sources = message.sources ?? []
      open.requestId = message.request_id ?? undefined
      continue
    }

    // An answer with no question ahead of it. Shown on its own rather than
    // dropped, so nothing the user was told disappears when they reopen.
    turns.push({
      id: message.message_id,
      question: '',
      state: 'answered',
      answer: message.body,
      answerStatus: message.answer_status ?? 'supported',
      sources: message.sources ?? [],
      followUps: [],
      requestId: message.request_id ?? undefined,
    })
  }

  // The server's follow-ups belong to the answer the thread ends on, so a
  // reopened conversation offers the same next questions a live one does
  // instead of stopping dead at the last reply.
  const last = turns[turns.length - 1]
  if (last?.answer !== undefined) last.followUps = followUps

  return turns
}

/**
 * Drives one assistant conversation, and the list of the user's earlier ones.
 *
 * History lives on the server, in the hospital's own tenant database, scoped to
 * the signed-in user. Nothing about a conversation is written to local storage:
 * a shared ward workstation must not keep one member of staff's questions where
 * the next person to sign in could read them.
 */
export function useAssistantChat(): UseAssistantChat {
  const [turns, setTurns] = useState<AssistantTurn[]>([])
  const [isSending, setIsSending] = useState(false)
  const [isCapabilityDisabled, setIsCapabilityDisabled] = useState(false)
  const [isPermissionDenied, setIsPermissionDenied] = useState(false)

  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<AssistantConversationSummary[]>([])
  const [isHistoryAvailable, setIsHistoryAvailable] = useState(true)
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [historyFailure, setHistoryFailure] = useState<AssistantFailure | undefined>()

  const controllerRef = useRef<AbortController | null>(null)
  const historyControllerRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  // Read inside callbacks that must not be rebuilt every time the thread
  // changes, so sending a question does not recreate the panel's handlers.
  const conversationIdRef = useRef<string | null>(null)

  // Whether the panel has already settled on a thread for this session, either
  // by reopening the last one or because the user chose otherwise. It is a ref
  // rather than state because it must never cause a render, and it is set
  // before the reopen is awaited so a second history refresh cannot start one.
  const hasResumedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      controllerRef.current?.abort()
      historyControllerRef.current?.abort()
    }
  }, [])

  /**
   * Move to a thread. The ref is what the send path reads, and the state is
   * what the panel renders, so both are set here and nowhere else.
   */
  const setActiveConversation = useCallback((id: string | null) => {
    conversationIdRef.current = id
    setConversationId(id)
  }, [])

  const updateTurn = useCallback((turnId: string, patch: Partial<AssistantTurn>) => {
    setTurns((current) =>
      current.map((turn) => (turn.id === turnId ? { ...turn, ...patch } : turn)),
    )
  }, [])

  /**
   * Note a history failure without turning it into an error the user must deal
   * with. A capability that is switched off is not a failure at all: the
   * controls are simply withdrawn.
   */
  const noteHistoryFailure = useCallback((error: unknown) => {
    if (isCancellation(error)) return

    const failure = toAssistantFailure(error)
    if (failure.kind === 'capability_disabled') {
      setIsHistoryAvailable(false)
      setHistoryFailure(undefined)
      return
    }
    if (failure.kind === 'permission_denied') {
      setIsHistoryAvailable(false)
      setHistoryFailure(undefined)
      return
    }
    setHistoryFailure(failure)
  }, [])

  const refreshHistory = useCallback(async () => {
    historyControllerRef.current?.abort()
    const controller = new AbortController()
    historyControllerRef.current = controller

    setIsHistoryLoading(true)
    try {
      const response = await assistantService.listConversations(controller.signal)
      if (!mountedRef.current) return

      setConversations(response.conversations ?? [])
      setIsHistoryAvailable(true)
      setHistoryFailure(undefined)
    } catch (error) {
      if (!mountedRef.current) return
      noteHistoryFailure(error)
    } finally {
      if (historyControllerRef.current === controller) historyControllerRef.current = null
      if (mountedRef.current) setIsHistoryLoading(false)
    }
  }, [noteHistoryFailure])

  const runQuestion = useCallback(
    async (turnId: string, question: string) => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      setIsSending(true)
      try {
        const response = await assistantService.chat(
          {
            question,
            // Continues the open thread. Omitted on a fresh one, and the server
            // ignores an id that is not the caller's own.
            conversation_id: conversationIdRef.current ?? undefined,
          },
          controller.signal,
        )
        if (!mountedRef.current) return

        updateTurn(turnId, {
          state: 'answered',
          answer: response.answer,
          answerStatus: response.status,
          sources: response.sources ?? [],
          followUps: response.follow_ups ?? [],
          requestId: response.request_id,
          failure: undefined,
        })

        if (response.conversation_id) {
          setActiveConversation(response.conversation_id)
          // The list has a new entry, or a new position for an existing one.
          void refreshHistory()
        }
      } catch (error) {
        if (!mountedRef.current) return

        if (isCancellation(error)) {
          // The user withdrew the question; drop the pending turn entirely.
          setTurns((current) => current.filter((turn) => turn.id !== turnId))
          return
        }

        const failure = toAssistantFailure(error)
        if (failure.kind === 'capability_disabled') setIsCapabilityDisabled(true)
        if (failure.kind === 'permission_denied') setIsPermissionDenied(true)

        updateTurn(turnId, { state: 'failed', failure, requestId: failure.requestId })
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null
        if (mountedRef.current) setIsSending(false)
      }
    },
    [refreshHistory, setActiveConversation, updateTurn],
  )

  const ask = useCallback(
    async (question: string) => {
      const trimmed = question.trim()
      if (!trimmed) return

      const turnId = nextTurnId()
      setTurns((current) => [
        ...current,
        { id: turnId, question: trimmed, state: 'pending', sources: [], followUps: [] },
      ])

      await runQuestion(turnId, trimmed)
    },
    [runQuestion],
  )

  const cancel = useCallback(() => {
    controllerRef.current?.abort()
  }, [])

  const retry = useCallback(async () => {
    const lastFailed = [...turns].reverse().find((turn) => turn.state === 'failed')
    if (!lastFailed) return

    updateTurn(lastFailed.id, { state: 'pending', failure: undefined })
    await runQuestion(lastFailed.id, lastFailed.question)
  }, [runQuestion, turns, updateTurn])

  const rate = useCallback(
    async (turnId: string, rating: AssistantFeedbackRating) => {
      const turn = turns.find((candidate) => candidate.id === turnId)
      if (!turn?.requestId || turn.rating) return

      // Shown immediately: feedback is a courtesy, and a failed submission must
      // not turn into an error the user has to deal with.
      updateTurn(turnId, { rating })

      try {
        await assistantService.sendFeedback({ request_id: turn.requestId, rating })
      } catch {
        // Deliberately swallowed. Nothing about a rating is worth interrupting
        // the user for, and the error carries nothing safe to display.
      }
    },
    [turns, updateTurn],
  )

  const startNewConversation = useCallback(() => {
    controllerRef.current?.abort()
    setTurns([])
    setActiveConversation(null)
    // An empty thread the user asked for. Reopening the last one over the top of
    // it would undo the button they just pressed.
    hasResumedRef.current = true
  }, [setActiveConversation])

  const openConversation = useCallback(
    async (id: string) => {
      hasResumedRef.current = true
      controllerRef.current?.abort()
      historyControllerRef.current?.abort()
      const controller = new AbortController()
      historyControllerRef.current = controller

      setIsHistoryLoading(true)
      try {
        const response = await assistantService.getConversation(id, controller.signal)
        if (!mountedRef.current) return

        setTurns(turnsFromMessages(response.messages ?? [], response.follow_ups ?? []))
        setActiveConversation(response.conversation_id)
        setHistoryFailure(undefined)
      } catch (error) {
        if (!mountedRef.current) return
        noteHistoryFailure(error)
      } finally {
        if (historyControllerRef.current === controller) historyControllerRef.current = null
        if (mountedRef.current) setIsHistoryLoading(false)
      }
    },
    [noteHistoryFailure, setActiveConversation],
  )

  /**
   * Carry on where the user left off.
   *
   * A conversation used to end at the edge of the panel: closing it, moving to
   * another screen, or reloading left the next question starting from nothing,
   * even though every exchange was already stored server-side. Staff read that
   * as the assistant forgetting, and reasonably so - the history list was the
   * only way back, and only if they knew to look for it.
   *
   * So the most recent thread is reopened once per session, and only while
   * there is nothing to lose by it: no thread already active, nothing on
   * screen, and no question in flight. Pressing New chat, or opening a
   * different conversation, settles the question for the rest of the session.
   */
  useEffect(() => {
    if (hasResumedRef.current) return
    if (!isHistoryAvailable || isSending) return
    if (conversationId !== null || turns.length > 0) return

    const [mostRecent] = conversations
    if (!mostRecent) return

    hasResumedRef.current = true
    void openConversation(mostRecent.conversation_id)
  }, [
    conversationId,
    conversations,
    isHistoryAvailable,
    isSending,
    openConversation,
    turns.length,
  ])

  const deleteConversation = useCallback(
    async (id: string) => {
      try {
        await assistantService.deleteConversation(id)
      } catch (error) {
        noteHistoryFailure(error)
        return
      }
      if (!mountedRef.current) return

      setConversations((current) =>
        current.filter((conversation) => conversation.conversation_id !== id),
      )
      // Deleting the thread on screen leaves the panel on a fresh one, rather
      // than showing messages that no longer exist anywhere.
      if (conversationIdRef.current === id) startNewConversation()
    },
    [noteHistoryFailure, startNewConversation],
  )

  const clearHistory = useCallback(async () => {
    try {
      await assistantService.clearConversations()
    } catch (error) {
      noteHistoryFailure(error)
      return
    }
    if (!mountedRef.current) return

    setConversations([])
    startNewConversation()
  }, [noteHistoryFailure, startNewConversation])

  const reset = useCallback(() => {
    controllerRef.current?.abort()
    setTurns([])
    setActiveConversation(null)
    hasResumedRef.current = true
  }, [setActiveConversation])

  return {
    turns,
    isSending,
    isCapabilityDisabled,
    isPermissionDenied,
    ask,
    cancel,
    retry,
    rate,
    reset,
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
  }
}
