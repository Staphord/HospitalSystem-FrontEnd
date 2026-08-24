import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { StaffDetailPage } from '../StaffDetailPage'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock useApp
const mockStaffList = [
  {
    id: 'st-001',
    name: 'Dr. Sarah Kimaro',
    email: 'skimaro@hospital.org',
    role: 'doctor',
    phone: '0712345678',
    status: 'active' as const,
    landingDepartment: 'Consultation',
    specialty: 'Internal Medicine',
    createdAt: '2026-01-10',
  },
]

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    staffList: mockStaffList,
    updateStaff: vi.fn(),
    setActiveView: vi.fn(),
  }),
}))

// Mock adminService
vi.mock('@/api/services/admin', () => ({
  adminService: {
    listStaffLoginHistory: vi.fn().mockResolvedValue([]),
    listStaffActivityLogs: vi.fn().mockResolvedValue([]),
  },
}))

describe('StaffDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders staff profile summary, role, and contact details', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/staff/st-001']}>
        <Routes>
          <Route path="/admin/staff/:id" element={<StaffDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText('Dr. Sarah Kimaro')[0]).toBeInTheDocument()
      expect(screen.getByText('skimaro@hospital.org')).toBeInTheDocument()
    })
  })

  it('renders not found when staff ID is not in roster', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/staff/st-999']}>
        <Routes>
          <Route path="/admin/staff/:id" element={<StaffDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Staff member record not found.')).toBeInTheDocument()
    })
  })
})
