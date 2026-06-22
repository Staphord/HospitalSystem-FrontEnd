import '@testing-library/jest-dom/vitest'
import { beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest'
import { server } from './src/tests/mocks/server'
import { initLocalStorage } from './src/api/client'

// Start MSW mock API server
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
beforeEach(() => {
  localStorage.clear()
  initLocalStorage()
})
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Mock browser globals not implemented in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

window.scrollTo = vi.fn()
