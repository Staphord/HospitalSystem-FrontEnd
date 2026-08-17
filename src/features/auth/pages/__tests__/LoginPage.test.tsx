import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from '../LoginPage'
import { authService } from '@/api/services/auth'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock useAuth
const mockSetTokens = vi.fn()
const mockSetUser = vi.fn()
const mockClearAuth = vi.fn()

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    setTokens: mockSetTokens,
    setUser: mockSetUser,
    clearAuth: mockClearAuth,
  }),
}))

// Mock authService
vi.mock('@/api/services/auth', () => ({
  authService: {
    login: vi.fn(),
  },
}))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders login form inputs and submit button', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    expect(screen.getByPlaceholderText(/username or email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('submits valid credentials and triggers login service', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      access_token: 'fake-access-token',
      refresh_token: 'fake-refresh-token',
      expires_in: 3600,
    } as any)

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByPlaceholderText(/username or email/i), {
      target: { value: 'admin@hospital.org' },
    })
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'Password123!' },
    })

    const submitBtn = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('admin@hospital.org', 'Password123!')
    })
  })
})
