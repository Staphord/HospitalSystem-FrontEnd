import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { FirstLoginChangePasswordPage } from '../FirstLoginChangePasswordPage'
import { usersService } from '@/api/services/users'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock usersService
vi.mock('@/api/services/users', () => ({
  usersService: {
    changePassword: vi.fn().mockResolvedValue({}),
  },
}))

describe('FirstLoginChangePasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders mandatory initial password change form', () => {
    render(
      <MemoryRouter>
        <FirstLoginChangePasswordPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Change Password Required')).toBeInTheDocument()
    expect(screen.getByLabelText(/current temporary password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument()
  })

  it('submits password change request when fields match', async () => {
    render(
      <MemoryRouter>
        <FirstLoginChangePasswordPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/current temporary password/i), {
      target: { value: 'Temp123456!' },
    })
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: 'NewSecurePass123!' },
    })
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'NewSecurePass123!' },
    })

    const submitBtn = screen.getByRole('button', { name: /update password/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(usersService.changePassword).toHaveBeenCalledWith({
        current_password: 'Temp123456!',
        new_password: 'NewSecurePass123!',
      })
    })
  })
})
