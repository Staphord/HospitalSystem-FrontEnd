import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { HospitalLoginPage } from '../HospitalLoginPage'
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
    clearAuth: vi.fn(),
  }),
}))

// Mock authService
vi.mock('@/api/services/auth', () => ({
  authService: {
    login: vi.fn(),
  },
}))

describe('HospitalLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders hospital portal login form and branding', () => {
    render(
      <MemoryRouter>
        <HospitalLoginPage />
      </MemoryRouter>
    )

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument()
  })

  it('handles hospital staff login action', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      access_token: 'fake-access-token',
      refresh_token: 'fake-refresh-token',
      expires_in: 3600,
    } as any)

    render(
      <MemoryRouter>
        <HospitalLoginPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'doctor@hospital.org' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'DoctorPass123!' },
    })

    const submitBtn = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        username: 'doctor@hospital.org',
        password: 'DoctorPass123!',
      })
    })
  })
})
