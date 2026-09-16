import { describe, it, expect, beforeEach } from 'vitest'
import {
  LAUNCHER_MARGIN_PX,
  LAUNCHER_POSITION_STORAGE_KEY,
  LAUNCHER_SIZE_PX,
  clampPosition,
  defaultPosition,
  loadPosition,
  parsePosition,
  savePosition,
} from '@/features/assistant/lib/launcherPosition'

const VIEWPORT = { width: 1280, height: 800 }

describe('launcher position', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('clampPosition', () => {
    it('keeps a position that is already inside the viewport', () => {
      expect(clampPosition({ x: 400, y: 300 }, VIEWPORT)).toEqual({ x: 400, y: 300 })
    })

    it('pulls a position back from beyond the right and bottom edges', () => {
      const clamped = clampPosition({ x: 5000, y: 5000 }, VIEWPORT)

      expect(clamped.x).toBe(VIEWPORT.width - LAUNCHER_SIZE_PX - LAUNCHER_MARGIN_PX)
      expect(clamped.y).toBe(VIEWPORT.height - LAUNCHER_SIZE_PX - LAUNCHER_MARGIN_PX)
    })

    it('pulls a negative position back inside the margins', () => {
      expect(clampPosition({ x: -500, y: -500 }, VIEWPORT)).toEqual({
        x: LAUNCHER_MARGIN_PX,
        y: LAUNCHER_MARGIN_PX,
      })
    })

    it('keeps the launcher reachable on a viewport smaller than the margins allow', () => {
      const clamped = clampPosition({ x: 999, y: 999 }, { width: 40, height: 40 })

      expect(clamped).toEqual({ x: LAUNCHER_MARGIN_PX, y: LAUNCHER_MARGIN_PX })
    })
  })

  describe('parsePosition', () => {
    it('accepts a pair of finite numbers', () => {
      expect(parsePosition('{"x":10,"y":20}')).toEqual({ x: 10, y: 20 })
    })

    it.each([
      ['null input', null],
      ['malformed json', '{not json'],
      ['a non-object', '"hello"'],
      ['a missing coordinate', '{"x":10}'],
      ['a string coordinate', '{"x":"10","y":20}'],
      ['NaN', '{"x":null,"y":20}'],
    ])('rejects %s', (_label, raw) => {
      expect(parsePosition(raw)).toBeNull()
    })
  })

  describe('loadPosition', () => {
    it('falls back to the default when nothing is stored', () => {
      expect(loadPosition(VIEWPORT)).toEqual(defaultPosition(VIEWPORT))
    })

    it('falls back to the default when the stored value is corrupt', () => {
      localStorage.setItem(LAUNCHER_POSITION_STORAGE_KEY, 'not-json-at-all')

      expect(loadPosition(VIEWPORT)).toEqual(defaultPosition(VIEWPORT))
    })

    it('clamps a stored position from a larger screen instead of stranding the button', () => {
      localStorage.setItem(LAUNCHER_POSITION_STORAGE_KEY, JSON.stringify({ x: 3800, y: 2000 }))

      const loaded = loadPosition(VIEWPORT)

      expect(loaded.x).toBeLessThanOrEqual(VIEWPORT.width - LAUNCHER_SIZE_PX)
      expect(loaded.y).toBeLessThanOrEqual(VIEWPORT.height - LAUNCHER_SIZE_PX)
    })

    it('survives a reload by restoring what was saved', () => {
      savePosition({ x: 120, y: 240 })

      expect(loadPosition(VIEWPORT)).toEqual({ x: 120, y: 240 })
    })
  })

  describe('savePosition', () => {
    it('stores only the two coordinates and nothing else', () => {
      savePosition({ x: 12, y: 34 })

      const raw = localStorage.getItem(LAUNCHER_POSITION_STORAGE_KEY)
      expect(raw).not.toBeNull()
      expect(Object.keys(JSON.parse(raw as string)).sort()).toEqual(['x', 'y'])
    })

    it('uses a namespaced key so it cannot collide with another feature', () => {
      expect(LAUNCHER_POSITION_STORAGE_KEY.startsWith('hf_')).toBe(true)
    })
  })
})
