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
    resetPassword: vi.fn().mockResolvedValue({}),
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

    expect(screen.getByText('Reset Your Password')).toBeInTheDocument()
    expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument()
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
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'StrongPass123!' },
    })

    const submitBtn = screen.getByRole('button', { name: /reset password/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith('fake-token', 'StrongPass123!')
    })
  })
})
