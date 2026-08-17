import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { DashboardPage } from '../DashboardPage'
import { receptionService } from '@/api/services/reception'

// Mock useAuth
const mockUseAuth = vi.fn()
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

// Mock useApp
vi.mock('@/features/admin/context/AppContext', () => ({
  useApp: () => ({
    stats: {
      todayPatients: 42,
      activeEncounters: 12,
      pendingLabResults: 5,
      lowStockAlerts: 2,
    },
  }),
}))

// Mock receptionService
vi.mock('@/api/services/reception', () => ({
  receptionService: {
    getQueue: vi.fn().mockResolvedValue({ queue: [], total: 0 }),
    getPatient: vi.fn(),
  },
}))

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders hospital admin dashboard overview with stats and quick links', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u-1', full_name: 'Dr. Administrator', role: 'hospital_admin' },
      roles: ['hospital_admin'],
    })

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    })
  })

  it('renders receptionist dashboard view when user is a receptionist', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u-2', full_name: 'Sarah Receptionist', role: 'receptionist' },
      roles: ['receptionist'],
    })

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/today's registrations/i)).toBeInTheDocument()
    })
  })
})
