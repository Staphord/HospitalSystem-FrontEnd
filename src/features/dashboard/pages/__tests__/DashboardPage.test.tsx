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

// Mock useDepartmentStatus
vi.mock('@/hooks/useDepartmentStatus', () => ({
  useDepartmentStatus: () => ({
    getDepartmentStatus: () => ({ isInactive: false, isUnavailable: false, isPending: false, deptName: '' }),
  }),
}))

// Mock useApp
vi.mock('@/features/admin/context/AppContext', () => ({
  useApp: () => ({
    stats: {
      totalStaff: 50,
      onlineNow: 12,
      departmentsActive: 8,
      bedsOccupied: 30,
      totalBeds: 100,
      todayPatients: 42,
      activeEncounters: 12,
      pendingLabResults: 5,
      lowStockAlerts: 2,
    },
    alerts: [],
    departments: [],
    sessions: [],
    setActiveView: vi.fn(),
  }),
}))

// Mock receptionService
vi.mock('@/api/services/reception', () => ({
  receptionService: {
    getQueue: vi.fn().mockResolvedValue({ queue: [], total: 0 }),
    getTriageQueueToday: vi.fn().mockResolvedValue([]),
    getTriageQueue: vi.fn().mockResolvedValue([]),
    searchPatients: vi.fn().mockResolvedValue({ patients: [], total: 0 }),
    getPatient: vi.fn().mockResolvedValue(null),
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
      expect(screen.getByText(/All Systems Operational/i)).toBeInTheDocument()
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
      expect(screen.getByText(/Patients Today/i)).toBeInTheDocument()
    })
  })
})
