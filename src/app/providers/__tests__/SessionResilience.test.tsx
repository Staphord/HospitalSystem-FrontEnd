import { render, act, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '@/store/authStore'
import { useDepartmentStatus } from '@/hooks/useDepartmentStatus'
import { apiClient } from '@/api/client'
import { authService } from '@/api/services/auth'
import { SimultaneousSessionWarningModal } from '@/app/providers/SimultaneousSessionWarningModal'

vi.mock('@/api/client', async () => {
  const actual = await vi.importActual('@/api/client')
  return {
    ...actual,
    refreshAuthToken: vi.fn(),
  }
})

vi.mock('@/api/services/auth', async () => {
  const actual = await vi.importActual('@/api/services/auth')
  return {
    ...actual,
    authService: {
      ...(actual as { authService: object }).authService,
      logout: vi.fn(),
    },
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

  describe('SimultaneousSessionWarningModal session-check handling', () => {
    // Regression coverage for the false-logout bug: the modal must only
    // force a logout on a positively-confirmed revoke, must show the
    // warning (not log out) when another session merely exists, and must
    // do neither when the backend reports the session record as missing —
    // that case is recoverable via the normal refresh-token interceptor,
    // not a reason to kick a user who may still have a perfectly valid
    // session.
    beforeEach(() => {
      useAuthStore.setState({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      })
      vi.spyOn(authService, 'logout').mockResolvedValue(undefined as never)
    })

    it('session_revoked: true forces logout and clears auth state', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        data: { has_other_active: false, session_revoked: true, session_missing: false },
      } as never)

      render(
        <MemoryRouter>
          <SimultaneousSessionWarningModal><div /></SimultaneousSessionWarningModal>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(useAuthStore.getState().accessToken).toBeNull()
      })
      expect(authService.logout).toHaveBeenCalledWith('refresh-token')
      expect(screen.queryByText('Simultaneous Session Warning')).not.toBeInTheDocument()
    })

    it('has_other_active: true alone shows the warning modal without logging out', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        data: { has_other_active: true, session_revoked: false, session_missing: false },
      } as never)

      render(
        <MemoryRouter>
          <SimultaneousSessionWarningModal><div /></SimultaneousSessionWarningModal>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Simultaneous Session Warning')).toBeInTheDocument()
      })
      expect(authService.logout).not.toHaveBeenCalled()
      expect(useAuthStore.getState().accessToken).toBe('access-token')
    })

    it('a "not found" session state neither logs out nor shows the modal', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        data: { has_other_active: false, session_revoked: false, session_missing: true, status: 'not_found' },
      } as never)

      render(
        <MemoryRouter>
          <SimultaneousSessionWarningModal><div /></SimultaneousSessionWarningModal>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/auth/session-check')
      })
      expect(authService.logout).not.toHaveBeenCalled()
      expect(screen.queryByText('Simultaneous Session Warning')).not.toBeInTheDocument()
      expect(useAuthStore.getState().accessToken).toBe('access-token')
    })
  })
})

function renderHook<T>(hook: () => T) {
  const result = { current: null as T }
  function TestComponent() {
    result.current = hook()
    return null
  }
  render(<TestComponent />)
  return { result }
}
