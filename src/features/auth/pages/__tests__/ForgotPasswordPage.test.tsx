import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ForgotPasswordPage } from '../ForgotPasswordPage'
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
    requestPasswordReset: vi.fn().mockResolvedValue({}),
  },
}))

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders password recovery form', () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    )

    expect(screen.getByPlaceholderText(/name@hospital.com/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument()
  })

  it('sends reset link on form submission', async () => {
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    )

    const emailInput = screen.getByPlaceholderText(/name@hospital.com/i)
    fireEvent.change(emailInput, { target: { value: 'user@hospital.com' } })

    const submitBtn = screen.getByRole('button', { name: /send reset link/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(authService.requestPasswordReset).toHaveBeenCalledWith({ email: 'user@hospital.com' })
    })
  })
})
