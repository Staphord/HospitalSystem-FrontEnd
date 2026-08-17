import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ResetPasswordPage } from '../ResetPasswordPage'
import { authService } from '@/api/services/auth'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock authService
vi.mock('@/api/services/auth', () => ({
  authService: {
    confirmPasswordReset: vi.fn().mockResolvedValue({}),
  },
}))

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders reset password form with password strength indicator', () => {
    render(
      <MemoryRouter initialEntries={['/reset-password?token=fake-token']}>
        <ResetPasswordPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Set a new password')).toBeInTheDocument()
    expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^confirm password/i)).toBeInTheDocument()
  })

  it('submits new password when token is present and passwords match', async () => {
    render(
      <MemoryRouter initialEntries={['/reset-password?token=fake-token']}>
        <ResetPasswordPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: 'StrongPass123!' },
    })
    fireEvent.change(screen.getByLabelText(/^confirm password/i), {
      target: { value: 'StrongPass123!' },
    })

    const submitBtn = screen.getByRole('button', { name: /confirm reset password/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(authService.confirmPasswordReset).toHaveBeenCalledWith({
        token: 'fake-token',
        new_password: 'StrongPass123!',
      })
    })
  })
})
