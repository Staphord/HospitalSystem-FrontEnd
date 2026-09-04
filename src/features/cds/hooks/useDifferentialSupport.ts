import { useCallback, useEffect, useRef, useState } from 'react'
import { cdsService } from '@/api/services/cds'
import type {
  CdsDifferentialRequest,
  CdsDifferentialResponse,
  CdsFeedbackRating,
} from '@/api/types/cds'
import { isAbsent, toCdsFailure, type CdsFailure } from '../lib/cdsErrors'

export interface UseDifferentialSupportResult {
  /** The latest suggestion, or null before one has been requested. */
  suggestion: CdsDifferentialResponse | null
  loading: boolean
  /** A safe, displayable failure. Never a server payload. */
  failure: CdsFailure | null
  /**
   * True when differential support is not available to this user at all, either
   * because the deployment has it switched off or because the role may not use
   * it. The card renders nothing in that case.
   */
  absent: boolean
  /** The rating this clinician gave, once they have given one. */
  rating: CdsFeedbackRating | null
  request: (input: Omit<CdsDifferentialRequest, 'visit_id'>) => void
  sendFeedback: (rating: CdsFeedbackRating, comment?: string) => Promise<void>
  reset: () => void
}

/**
 * Drives one visit's clinical differential support.
 *
 * Nothing is requested automatically. A clinician asks for considerations
 * deliberately, because a suggestion that appeared on its own would invite
 * being read as the system's opinion of the patient rather than as a tool the
 * clinician chose to use.
 *
 * Nothing here is written to browser storage: no complaint, no symptom, no
 * consideration, and no patient data.
 */
export function useDifferentialSupport(
  visitId: string | null | undefined,
): UseDifferentialSupportResult {
  const [suggestion, setSuggestion] = useState<CdsDifferentialResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [failure, setFailure] = useState<CdsFailure | null>(null)
  const [absent, setAbsent] = useState(false)
  const [rating, setRating] = useState<CdsFeedbackRating | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const activeRef = useRef(true)

  useEffect(() => {
    activeRef.current = true
    return () => {
      activeRef.current = false
      abortRef.current?.abort()
    }
  }, [])

  // A new visit invalidates everything the previous one established.
  useEffect(() => {
    setSuggestion(null)
    setFailure(null)
    setRating(null)
  }, [visitId])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setSuggestion(null)
    setFailure(null)
    setRating(null)
  }, [])

  const request = useCallback(
    (input: Omit<CdsDifferentialRequest, 'visit_id'>) => {
      if (!visitId) return
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      setFailure(null)
      setRating(null)

      cdsService
        .differential({ ...input, visit_id: visitId }, controller.signal)
        .then((result) => {
          if (!activeRef.current) return
          setSuggestion(result)
        })
        .catch((error: unknown) => {
          if (!activeRef.current) return
          const mapped = toCdsFailure(error)
          if (isAbsent(mapped)) {
            setAbsent(true)
            return
          }
          // A failed request clears any previous suggestion. Leaving the last
          // one on screen would show considerations for inputs that have since
          // changed.
          setSuggestion(null)
          setFailure(mapped)
        })
        .finally(() => {
          if (activeRef.current) setLoading(false)
        })
    },
    [visitId],
  )

  const sendFeedback = useCallback(
    async (value: CdsFeedbackRating, comment?: string) => {
      if (!suggestion) return
      try {
        await cdsService.differentialFeedback({
          suggestion_id: suggestion.suggestion_id,
          rating: value,
          ...(comment ? { comment } : {}),
        })
        if (activeRef.current) setRating(value)
      } catch {
        // Feedback failing is not worth interrupting a clinician over, and it
        // changes nothing about the suggestion they are reading.
        if (activeRef.current) setRating(null)
      }
    },
    [suggestion],
  )

  return { suggestion, loading, failure, absent, rating, request, sendFeedback, reset }
}
