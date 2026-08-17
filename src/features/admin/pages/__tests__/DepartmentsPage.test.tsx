import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { DepartmentsPage } from '../DepartmentsPage'
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
    listDepartments: vi.fn().mockResolvedValue([
      {
        id: 'dept-1',
        name: 'General Consultation',
        type: 'Consultation',
        is_active: true,
        head_of_department: 'Dr. Sarah Kimaro',
      },
    ]),
    listWards: vi.fn().mockResolvedValue([
      {
        id: 'ward-1',
        name: 'Female Medical Ward',
        ward_type: 'general',
        capacity: 20,
        occupied_beds: 12,
        is_active: true,
      },
    ]),
  },
}))

describe('DepartmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(adminService.listDepartments).mockResolvedValue([
      {
        id: 'dept-1',
        name: 'General Consultation',
        type: 'Consultation',
        is_active: true,
        head_of_department: 'Dr. Sarah Kimaro',
      },
    ] as any)
    vi.mocked(adminService.listWards).mockResolvedValue([
      {
        id: 'ward-1',
        name: 'Female Medical Ward',
        ward_type: 'general',
        capacity: 20,
        occupied_beds: 12,
        is_active: true,
      },
    ] as any)
  })

  it('renders department directory and ward management section', async () => {
    render(
      <MemoryRouter>
        <DepartmentsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Departments')).toBeInTheDocument()
      expect(screen.getByText('General Consultation')).toBeInTheDocument()
      expect(screen.getByText('Female Medical Ward')).toBeInTheDocument()
    })
  })
})
