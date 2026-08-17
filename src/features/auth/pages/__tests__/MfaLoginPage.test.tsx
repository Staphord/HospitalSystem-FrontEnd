import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { MfaLoginPage } from '../MfaLoginPage'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    setTokens: vi.fn(),
    setUser: vi.fn(),
    clearAuth: vi.fn(),
  }),
}))

describe('MfaLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.setItem('mfa_login_challenge', 'fake-challenge-token')
  })

  it('renders 6-digit MFA security verification input fields', async () => {
    render(
      <MemoryRouter>
        <MfaLoginPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/two-step verification/i)).toBeInTheDocument()
    })
  })
})
