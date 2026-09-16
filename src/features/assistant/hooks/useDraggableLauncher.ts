import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clampPosition,
  loadPosition,
  readViewport,
  savePosition,
  type LauncherPosition,
} from '@/features/assistant/lib/launcherPosition'

/**
 * Distance the pointer must travel before a press becomes a drag.
 *
 * Without it, the small pointer movement inside an ordinary click would start a
 * drag and the launcher would never open.
 */
export const DRAG_THRESHOLD_PX = 5

export interface DraggableLauncher {
  position: LauncherPosition
  isDragging: boolean
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void
  onPointerMove: (event: React.PointerEvent<HTMLElement>) => void
  onPointerUp: (event: React.PointerEvent<HTMLElement>) => void
  /** True when the press that just ended was a drag, so the click is ignored. */
  consumeDragSuppression: () => boolean
}

/**
 * Pointer Events dragging for the launcher button.
 *
 * Pointer capture keeps the drag attached to the button when the pointer
 * outruns it, which is what makes fast drags feel solid rather than sticky.
 * Every committed position is clamped to the viewport before it is stored.
 */
export function useDraggableLauncher(): DraggableLauncher {
  const [position, setPosition] = useState<LauncherPosition>(() => loadPosition())
  const [isDragging, setIsDragging] = useState(false)

  const pointerIdRef = useRef<number | null>(null)
  const originRef = useRef<{ pointerX: number; pointerY: number } | null>(null)
  const startPositionRef = useRef<LauncherPosition>(position)
  const draggedRef = useRef(false)
  const suppressClickRef = useRef(false)

  // A resize or orientation change can leave a stored position off-screen.
  // Re-clamping on every resize keeps the button reachable.
  useEffect(() => {
    const handleResize = () => {
      setPosition((current) => {
        const next = clampPosition(current, readViewport())
        if (next.x === current.x && next.y === current.y) return current
        savePosition(next)
        return next
      })
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      // Ignore secondary buttons so a right-click never starts a drag.
      if (event.button !== 0) return

      pointerIdRef.current = event.pointerId
      originRef.current = { pointerX: event.clientX, pointerY: event.clientY }
      startPositionRef.current = position
      draggedRef.current = false

      event.currentTarget.setPointerCapture?.(event.pointerId)
    },
    [position],
  )

  const onPointerMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const origin = originRef.current
    if (origin === null || pointerIdRef.current !== event.pointerId) return

    const deltaX = event.clientX - origin.pointerX
    const deltaY = event.clientY - origin.pointerY

    if (!draggedRef.current) {
      if (Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD_PX) return
      draggedRef.current = true
      setIsDragging(true)
    }

    setPosition(
      clampPosition(
        {
          x: startPositionRef.current.x + deltaX,
          y: startPositionRef.current.y + deltaY,
        },
        readViewport(),
      ),
    )
  }, [])

  const onPointerUp = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (pointerIdRef.current !== event.pointerId) return

    event.currentTarget.releasePointerCapture?.(event.pointerId)
    pointerIdRef.current = null
    originRef.current = null

    if (draggedRef.current) {
      suppressClickRef.current = true
      setIsDragging(false)
      setPosition((current) => {
        savePosition(current)
        return current
      })
    }

    draggedRef.current = false
  }, [])

  const consumeDragSuppression = useCallback(() => {
    const suppressed = suppressClickRef.current
    suppressClickRef.current = false
    return suppressed
  }, [])

  return {
    position,
    isDragging,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    consumeDragSuppression,
  }
}
