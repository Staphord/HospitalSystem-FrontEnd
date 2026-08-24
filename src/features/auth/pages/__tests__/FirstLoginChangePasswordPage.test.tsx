import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { FirstLoginChangePasswordPage } from '../FirstLoginChangePasswordPage'
import { authService } from '@/api/services/auth'

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
  }),
}))

// Mock authService
vi.mock('@/api/services/auth', () => ({
  authService: {
    firstLoginChangePassword: vi.fn().mockResolvedValue({
      access_token: 'fake-access-token',
      refresh_token: 'fake-refresh-token',
      expires_in: 3600,
    }),
  },
}))

// Mock usersService
vi.mock('@/api/services/users', () => ({
  usersService: {
    getMe: vi.fn().mockResolvedValue({ id: 'usr-1', username: 'admin' }),
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

    expect(screen.getByText('Update Password')).toBeInTheDocument()
    expect(screen.getByLabelText(/temporary password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument()
  })

  it('submits password change request when fields match', async () => {
    render(
      <MemoryRouter>
        <FirstLoginChangePasswordPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'admin' },
    })
    fireEvent.change(screen.getByLabelText(/temporary password/i), {
      target: { value: 'Temp123456!' },
    })
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: 'NewSecurePass123!' },
    })
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'NewSecurePass123!' },
    })

    const submitBtn = screen.getByRole('button', { name: /establish secure password/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(authService.firstLoginChangePassword).toHaveBeenCalledWith({
        username: 'admin',
        temp_password: 'Temp123456!',
        new_password: 'NewSecurePass123!',
      })
    })
  })
})
