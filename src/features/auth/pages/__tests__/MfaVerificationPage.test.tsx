import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { MfaVerificationPage } from '../MfaVerificationPage'

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
    clearAuth: vi.fn(),
  }),
}))

// Mock authService
vi.mock('@/api/services/auth', () => ({
  authService: {
    setupMfa: vi.fn().mockResolvedValue({
      qr_code_url: 'data:image/png;base64,fake',
      secret: 'SECRET123',
    }),
    sendMfaEmailSetupCode: vi.fn().mockResolvedValue({}),
    verifyMfaSetup: vi.fn().mockResolvedValue({ backup_codes: [] }),
  },
}))

describe('MfaVerificationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders MFA setup with QR code and secret for authenticator method', async () => {
    render(
      <MemoryRouter initialEntries={['/mfa-verify?method=authenticator']}>
        <MfaVerificationPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Authenticator App')).toBeInTheDocument()
      expect(screen.getByText('SECRET123')).toBeInTheDocument()
    })
  })
})
