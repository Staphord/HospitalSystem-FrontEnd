import { useEffect, useRef, useState } from 'react'
import { assistantService } from '@/api/services/assistant'
import type { AssistantStatusResponse } from '@/api/types/assistant'

export interface AssistantStatus {
  /** True only once the server has said the assistant is available here. */
  isEnabled: boolean
  /** True until the first answer arrives, so nothing is drawn on a guess. */
  isLoading: boolean
  capabilities: string[]
  /** The deployment is on, but no model credential has been set yet. */
  isProviderMissing: boolean
}

const UNAVAILABLE: AssistantStatus = {
  isEnabled: false,
  isLoading: false,
  capabilities: [],
  isProviderMissing: false,
}

/**
 * Ask the server whether this user has an assistant, once per session.
 *
 * The launcher used to be rendered for everyone whose role matched a list kept
 * in the browser, and only withdrawn after a question came back 404. That put a
 * floating button on the screen of every hospital running with the assistant
 * switched off, and the only way to find out was to press it.
 *
 * The answer is deliberately treated as absent until it arrives: `isLoading`
 * starts true and the launcher renders nothing while it is, so the button never
 * flickers into view and then disappears.
 *
 * Any failure - offline, a gateway error, a refused token - resolves to "no
 * assistant". Fail-closed matches the server, where every one of those states
 * would refuse the question anyway.
 *
 * @param enabled pass false to skip the request entirely, for a session that
 *   could not use the assistant regardless of what the server says.
 */
export function useAssistantStatus(enabled: boolean = true): AssistantStatus {
  const [status, setStatus] = useState<AssistantStatus>({
    ...UNAVAILABLE,
    isLoading: enabled,
  })

  // Guards against a state update after unmount, and against the answer to a
  // superseded request landing last.
  const requestRef = useRef(0)

  useEffect(() => {
    if (!enabled) {
      setStatus(UNAVAILABLE)
      return
    }

    const controller = new AbortController()
    const request = ++requestRef.current
    let active = true

    setStatus((current) => ({ ...current, isLoading: true }))

    assistantService
      .getStatus(controller.signal)
      .then((response: AssistantStatusResponse) => {
        if (!active || request !== requestRef.current) return
        setStatus({
          isEnabled: Boolean(response.enabled),
          isLoading: false,
          capabilities: response.capabilities ?? [],
          isProviderMissing:
            Boolean(response.enabled) && !response.provider_configured,
        })
      })
      .catch(() => {
        if (!active || request !== requestRef.current) return
        setStatus(UNAVAILABLE)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [enabled])

  return status
}
