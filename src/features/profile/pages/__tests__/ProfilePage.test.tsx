import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ProfilePage } from '../ProfilePage'
import { usersService } from '@/api/services/users'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock useAuth
const mockSetUser = vi.fn()
const mockUser = {
  id: 'u-001',
  username: 'drjohn',
  email: 'drjohn@hospital.org',
  full_name: 'Dr. John Doe',
  role: 'doctor',
  mfa_enabled: false,
}

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    setUser: mockSetUser,
  }),
}))

// Mock usersService
vi.mock('@/api/services/users', () => ({
  usersService: {
    getMe: vi.fn().mockResolvedValue({
      id: 'u-001',
      username: 'drjohn',
      email: 'drjohn@hospital.org',
      full_name: 'Dr. John Doe',
      role: 'doctor',
      mfa_enabled: false,
    }),
    updateMe: vi.fn().mockResolvedValue({}),
    changePassword: vi.fn().mockResolvedValue({}),
  },
}))

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders user profile form with populated account values', async () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('drjohn')).toBeInTheDocument()
      expect(screen.getByDisplayValue('drjohn@hospital.org')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Dr. John Doe')).toBeInTheDocument()
    })
  })

  it('allows switching to Security / Password tab', async () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    )

    const passwordTab = screen.getByRole('button', { name: /password/i })
    fireEvent.click(passwordTab)

    await waitFor(() => {
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument()
    })
  })
})
