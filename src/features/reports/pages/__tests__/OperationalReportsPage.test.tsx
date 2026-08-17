import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { OperationalReportsPage } from '../OperationalReportsPage'
import { adminService } from '@/api/services/admin'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock adminService
vi.mock('@/api/services/admin', () => ({
  adminService: {
    getOperationalActivityReport: vi.fn().mockResolvedValue({
      staff_activities: [
        {
          user_id: 'usr-1',
          initials: 'SK',
          name: 'Dr. Sarah Kimaro',
          role: 'doctor',
          department: 'Consultation',
          actions_performed: 24,
          patients_handled: 18,
          avg_response_time: '15 min',
        },
      ],
      avg_length_of_stay_days: 3.5,
    }),
    getBedOccupancyReport: vi.fn().mockResolvedValue({
      total_beds: 50,
      occupied_beds: 35,
      occupancy_rate_percent: 70,
      wards: [],
    }),
    listUsers: vi.fn().mockResolvedValue([
      { id: 'usr-1', full_name: 'Dr. Sarah Kimaro', status: 'active', role: 'doctor' },
    ]),
  },
}))

describe('OperationalReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders operational KPIs, occupancy telemetry, and staff activity metrics', async () => {
    render(
      <MemoryRouter>
        <OperationalReportsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Operational Reports')).toBeInTheDocument()
      expect(screen.getByText('Dr. Sarah Kimaro')).toBeInTheDocument()
      expect(screen.getByText('Staff Activity Summary')).toBeInTheDocument()
    })
  })
})
