import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { UserManagementPage } from '../UserManagementPage'

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
  {
    id: 'st-002',
    name: 'Nurse Mary Temu',
    email: 'mtemu@hospital.org',
    role: 'nurse',
    phone: '0787654321',
    status: 'active' as const,
    landingDepartment: 'Triage',
    specialty: 'Emergency Nursing',
    createdAt: '2026-02-15',
  },
]

const mockDeleteStaff = vi.fn()
const mockSetActiveView = vi.fn()

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    staffList: mockStaffList,
    deleteStaff: mockDeleteStaff,
    setActiveView: mockSetActiveView,
    sessions: [],
  }),
}))

describe('UserManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders staff roster list and key personnel metrics', () => {
    render(
      <MemoryRouter>
        <UserManagementPage />
      </MemoryRouter>
    )

    expect(screen.getByText('User & Staff Directory')).toBeInTheDocument()
    expect(screen.getByText('Dr. Sarah Kimaro')).toBeInTheDocument()
    expect(screen.getByText('Nurse Mary Temu')).toBeInTheDocument()
  })

  it('filters staff by search keyword', () => {
    render(
      <MemoryRouter>
        <UserManagementPage />
      </MemoryRouter>
    )

    const searchInput = screen.getByPlaceholderText('Search by name, ID or role')
    fireEvent.change(searchInput, { target: { value: 'Sarah' } })

    expect(screen.getByText('Dr. Sarah Kimaro')).toBeInTheDocument()
    expect(screen.queryByText('Nurse Mary Temu')).not.toBeInTheDocument()
  })
})
