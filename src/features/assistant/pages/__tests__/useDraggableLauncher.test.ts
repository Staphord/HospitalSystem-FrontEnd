import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  DRAG_THRESHOLD_PX,
  useDraggableLauncher,
} from '@/features/assistant/hooks/useDraggableLauncher'
import {
  LAUNCHER_POSITION_STORAGE_KEY,
  loadPosition,
} from '@/features/assistant/lib/launcherPosition'

/**
 * jsdom does not implement PointerEvent, so the handlers are driven with the
 * fields they actually read. That keeps the test on the drag logic rather than
 * on a polyfill.
 */
function pointerEvent(clientX: number, clientY: number, pointerId = 1, button = 0) {
  const target = {
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn(),
  }
  return {
    clientX,
    clientY,
    pointerId,
    button,
    currentTarget: target,
  } as unknown as React.PointerEvent<HTMLElement>
}

describe('useDraggableLauncher', () => {
  beforeEach(() => {
    localStorage.clear()
    window.innerWidth = 1280
    window.innerHeight = 800
  })

  it('does not treat a small movement as a drag, so a click still opens the panel', () => {
    const { result } = renderHook(() => useDraggableLauncher())
    const start = result.current.position

    act(() => {
      result.current.onPointerDown(pointerEvent(500, 500))
      result.current.onPointerMove(pointerEvent(500 + DRAG_THRESHOLD_PX - 2, 500))
      result.current.onPointerUp(pointerEvent(500 + DRAG_THRESHOLD_PX - 2, 500))
    })

    expect(result.current.position).toEqual(start)
    expect(result.current.isDragging).toBe(false)
    expect(result.current.consumeDragSuppression()).toBe(false)
  })

  it('moves the launcher once the movement passes the threshold', () => {
    const { result } = renderHook(() => useDraggableLauncher())
    const start = result.current.position

    act(() => {
      result.current.onPointerDown(pointerEvent(500, 500))
      result.current.onPointerMove(pointerEvent(400, 400))
    })

    expect(result.current.position.x).toBe(start.x - 100)
    expect(result.current.position.y).toBe(start.y - 100)
    expect(result.current.isDragging).toBe(true)
  })

  it('suppresses the click that ends a drag', () => {
    const { result } = renderHook(() => useDraggableLauncher())

    act(() => {
      result.current.onPointerDown(pointerEvent(500, 500))
      result.current.onPointerMove(pointerEvent(400, 400))
      result.current.onPointerUp(pointerEvent(400, 400))
    })

    expect(result.current.consumeDragSuppression()).toBe(true)
    // Consumed once only, so the next genuine click still opens the panel.
    expect(result.current.consumeDragSuppression()).toBe(false)
  })

  it('captures the pointer so a fast drag stays attached to the button', () => {
    const { result } = renderHook(() => useDraggableLauncher())
    const down = pointerEvent(500, 500)

    act(() => {
      result.current.onPointerDown(down)
    })

    expect(down.currentTarget.setPointerCapture).toHaveBeenCalledWith(1)
  })

  it('ignores a secondary mouse button', () => {
    const { result } = renderHook(() => useDraggableLauncher())
    const start = result.current.position

    act(() => {
      result.current.onPointerDown(pointerEvent(500, 500, 1, 2))
      result.current.onPointerMove(pointerEvent(200, 200))
    })

    expect(result.current.position).toEqual(start)
  })

  it('persists the position when a drag ends', () => {
    const { result } = renderHook(() => useDraggableLauncher())

    act(() => {
      result.current.onPointerDown(pointerEvent(500, 500))
      result.current.onPointerMove(pointerEvent(300, 300))
      result.current.onPointerUp(pointerEvent(300, 300))
    })

    expect(loadPosition({ width: 1280, height: 800 })).toEqual(result.current.position)
  })

  it('keeps the launcher on screen when the drag leaves the viewport', () => {
    const { result } = renderHook(() => useDraggableLauncher())

    act(() => {
      result.current.onPointerDown(pointerEvent(500, 500))
      result.current.onPointerMove(pointerEvent(9000, 9000))
    })

    expect(result.current.position.x).toBeLessThan(window.innerWidth)
    expect(result.current.position.y).toBeLessThan(window.innerHeight)
  })

  it('re-clamps into view after the window shrinks', () => {
    const { result } = renderHook(() => useDraggableLauncher())

    act(() => {
      window.innerWidth = 400
      window.innerHeight = 400
      window.dispatchEvent(new Event('resize'))
    })

    expect(result.current.position.x).toBeLessThan(400)
    expect(result.current.position.y).toBeLessThan(400)
  })

  it('stores only the coordinates, never conversation content', () => {
    const { result } = renderHook(() => useDraggableLauncher())

    act(() => {
      result.current.onPointerDown(pointerEvent(500, 500))
      result.current.onPointerMove(pointerEvent(300, 300))
      result.current.onPointerUp(pointerEvent(300, 300))
    })

    const raw = localStorage.getItem(LAUNCHER_POSITION_STORAGE_KEY) as string
    expect(Object.keys(JSON.parse(raw)).sort()).toEqual(['x', 'y'])
  })
})
