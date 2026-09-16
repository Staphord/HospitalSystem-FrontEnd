/**
 * Launcher position: clamping, validation, and persistence.
 *
 * Only a non-sensitive UI preference is stored — two numbers describing where
 * the user parked the launcher button. Patient data, questions, answers,
 * sources, transcripts, and audio are never written to local storage.
 */

export interface LauncherPosition {
  x: number
  y: number
}

/** Namespaced so it cannot collide with another feature's stored preference. */
export const LAUNCHER_POSITION_STORAGE_KEY = 'hf_assistant_launcher_position'

/** Keeps the launcher clear of the viewport edges and mobile navigation bars. */
export const LAUNCHER_SIZE_PX = 56
export const LAUNCHER_MARGIN_PX = 16
export const LAUNCHER_BOTTOM_SAFE_AREA_PX = 80

export interface Viewport {
  width: number
  height: number
}

export function readViewport(): Viewport {
  return {
    width: typeof window === 'undefined' ? 0 : window.innerWidth,
    height: typeof window === 'undefined' ? 0 : window.innerHeight,
  }
}

/**
 * The default resting place: bottom right, above the mobile navigation strip.
 * Used for a first visit, and whenever a stored value cannot be trusted.
 */
export function defaultPosition(viewport: Viewport = readViewport()): LauncherPosition {
  return clampPosition(
    {
      x: viewport.width - LAUNCHER_SIZE_PX - LAUNCHER_MARGIN_PX,
      y: viewport.height - LAUNCHER_SIZE_PX - LAUNCHER_BOTTOM_SAFE_AREA_PX,
    },
    viewport,
  )
}

/**
 * Confine a position to the visible viewport.
 *
 * This is what stops the launcher stranding itself off-screen after a window
 * resize, an orientation change, or a stored value from a much larger monitor.
 * When the viewport is smaller than the margins allow, the lower bound wins, so
 * the button stays reachable rather than being clamped out of existence.
 */
export function clampPosition(
  position: LauncherPosition,
  viewport: Viewport = readViewport(),
): LauncherPosition {
  const maxX = Math.max(
    LAUNCHER_MARGIN_PX,
    viewport.width - LAUNCHER_SIZE_PX - LAUNCHER_MARGIN_PX,
  )
  const maxY = Math.max(
    LAUNCHER_MARGIN_PX,
    viewport.height - LAUNCHER_SIZE_PX - LAUNCHER_MARGIN_PX,
  )

  return {
    x: Math.min(Math.max(position.x, LAUNCHER_MARGIN_PX), maxX),
    y: Math.min(Math.max(position.y, LAUNCHER_MARGIN_PX), maxY),
  }
}

/** Accept only a pair of finite numbers. Anything else is treated as absent. */
export function parsePosition(raw: string | null): LauncherPosition | null {
  if (!raw) return null

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null

    const { x, y } = parsed as Record<string, unknown>
    if (typeof x !== 'number' || typeof y !== 'number') return null
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null

    return { x, y }
  } catch {
    return null
  }
}

/**
 * Load the stored position, or fall back to the default.
 *
 * A corrupt, hand-edited, or stale value never throws and never strands the
 * button: it is discarded and the default is used instead.
 */
export function loadPosition(viewport: Viewport = readViewport()): LauncherPosition {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(LAUNCHER_POSITION_STORAGE_KEY)
  } catch {
    return defaultPosition(viewport)
  }

  const parsed = parsePosition(raw)
  if (!parsed) return defaultPosition(viewport)

  return clampPosition(parsed, viewport)
}

/** Persist the position. A storage failure is never allowed to break the UI. */
export function savePosition(position: LauncherPosition): void {
  try {
    window.localStorage.setItem(
      LAUNCHER_POSITION_STORAGE_KEY,
      JSON.stringify({ x: position.x, y: position.y }),
    )
  } catch {
    // Private browsing or a full quota. The launcher still works this session.
  }
}
