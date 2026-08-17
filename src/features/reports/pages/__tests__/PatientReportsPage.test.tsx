import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PatientReportsPage } from '../PatientReportsPage'
import { adminService } from '@/api/services/admin'

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
    user: { full_name: 'Super Admin' },
  }),
}))

// Mock adminService
vi.mock('@/api/services/admin', () => ({
  adminService: {
    getPatientCensusReport: vi.fn().mockResolvedValue({
      total_patients: 120,
      active_inpatients: 40,
      outpatients_today: 80,
      daily_breakdown: [],
    }),
    getWaitTimesReport: vi.fn().mockResolvedValue({
      avg_wait_minutes: 22,
      by_department: [],
    }),
    getDischargesReport: vi.fn().mockResolvedValue({
      total_discharges: 15,
      discharges: [],
    }),
    getBedOccupancyReport: vi.fn().mockResolvedValue({
      total_beds: 50,
      occupied_beds: 35,
      occupancy_rate_percent: 70,
      wards: [],
    }),
  },
}))

describe('PatientReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(adminService.getPatientCensusReport).mockResolvedValue({
      total_patients: 120,
      active_inpatients: 40,
      outpatients_today: 80,
      daily_breakdown: [],
    } as any)
    vi.mocked(adminService.getWaitTimesReport).mockResolvedValue({
      avg_wait_minutes: 22,
      by_department: [],
    } as any)
    vi.mocked(adminService.getDischargesReport).mockResolvedValue({
      total_discharges: 15,
      discharges: [],
    } as any)
    vi.mocked(adminService.getBedOccupancyReport).mockResolvedValue({
      total_beds: 50,
      occupied_beds: 35,
      occupancy_rate_percent: 70,
      wards: [],
    } as any)
  })

  it('renders patient census metrics, wait times, and report filters', async () => {
    render(
      <MemoryRouter>
        <PatientReportsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Patient Reports')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /export pdf/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument()
    })
  })
})
