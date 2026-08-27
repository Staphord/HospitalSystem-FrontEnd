import { useCallback, useEffect, useRef, useState } from 'react'
import { assistantService } from '@/api/services/assistant'
import type {
  AssistantAnswerStatus,
  AssistantFeedbackRating,
  AssistantSource,
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
}

let turnCounter = 0
function nextTurnId(): string {
  turnCounter += 1
  return `turn-${turnCounter}`
}

/**
 * Drives one assistant conversation.
 *
 * Nothing here is persisted. Questions, answers, and sources live in component
 * state for the lifetime of the panel and are never written to local storage.
 */
export function useAssistantChat(): UseAssistantChat {
  const [turns, setTurns] = useState<AssistantTurn[]>([])
  const [isSending, setIsSending] = useState(false)
  const [isCapabilityDisabled, setIsCapabilityDisabled] = useState(false)
  const [isPermissionDenied, setIsPermissionDenied] = useState(false)

  const controllerRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      controllerRef.current?.abort()
    }
  }, [])

  const updateTurn = useCallback((turnId: string, patch: Partial<AssistantTurn>) => {
    setTurns((current) =>
      current.map((turn) => (turn.id === turnId ? { ...turn, ...patch } : turn)),
    )
  }, [])

  const runQuestion = useCallback(
    async (turnId: string, question: string) => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      setIsSending(true)
      try {
        const response = await assistantService.chat({ question }, controller.signal)
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
    [updateTurn],
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

  const reset = useCallback(() => {
    controllerRef.current?.abort()
    setTurns([])
  }, [])

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
  }
}
