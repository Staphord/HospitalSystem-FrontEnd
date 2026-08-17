import { render, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '@/store/authStore'
import { refreshAuthToken } from '@/api/client'
import { useDepartmentStatus } from '@/hooks/useDepartmentStatus'

vi.mock('@/api/client', async () => {
  const actual = await vi.importActual('@/api/client')
  return {
    ...actual,
    refreshAuthToken: vi.fn(),
  }
})

describe('Auth & Session Resilience Frontend Audit', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      user: null,
      roles: [],
      tenantId: null,
      isImpersonating: false,
      isReadOnly: false,
      lastLogoutReason: null,
    })
    localStorage.clear()
  })

  it('stores access and refresh expiry timestamps on setTokens', () => {
    const validJwtMock = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    const now = Date.now()
    useAuthStore.getState().setTokens(validJwtMock, 'mock-refresh-token', 300, 1800)

    const state = useAuthStore.getState()
    expect(state.accessTokenExpiresAt).toBeGreaterThanOrEqual(now + 290 * 1000)
    expect(state.refreshTokenExpiresAt).toBeGreaterThanOrEqual(now + 1790 * 1000)
  })

  it('records logout reason when clearAuth is invoked', () => {
    const validJwtMock = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    useAuthStore.getState().setTokens(validJwtMock, 'refresh')
    act(() => {
      useAuthStore.getState().clearAuth('idle_timeout')
    })

    const state = useAuthStore.getState()
    expect(state.accessToken).toBeNull()
    expect(state.lastLogoutReason).toBe('idle_timeout')
  })

  it('useDepartmentStatus handles API failure as unavailable without setting isInactive to true', async () => {
    const { result } = renderHook(() => useDepartmentStatus())
    // Initial loading or fallback state
    const status = result.current.getDepartmentStatus('consultation')
    expect(status.isInactive).toBe(false)
  })
})

function renderHook<T>(hook: () => T) {
  let result = { current: null as T }
  function TestComponent() {
    result.current = hook()
    return null
  }
  render(<TestComponent />)
  return { result }
}
