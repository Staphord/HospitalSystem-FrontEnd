import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RolesManagementPage } from '../RolesManagementPage'
import { adminService } from '@/api/services/admin'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

vi.mock('@/api/services/admin', () => ({
  adminService: {
    listRealmRoles: vi.fn(),
    createRealmRole: vi.fn(),
    updateRealmRole: vi.fn(),
    deleteRealmRole: vi.fn(),
    listTenantRoles: vi.fn(),
    createTenantRole: vi.fn(),
    updateTenantRole: vi.fn(),
    deleteTenantRole: vi.fn(),
  },
}))

const mockRealmRoles = [
  { id: 'r-1', name: 'doctor', description: null },
  { id: 'r-2', name: 'ward_supervisor', description: 'Custom realm role' },
]

const mockTenantRoles = [
  { id: 't-1', name: 'senior_nurse', description: 'Senior nursing staff', createdAt: '2026-07-01T00:00:00Z' },
]

describe('RolesManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(adminService.listRealmRoles).mockResolvedValue(mockRealmRoles as any)
    vi.mocked(adminService.listTenantRoles).mockResolvedValue(mockTenantRoles as any)
    vi.mocked(adminService.createTenantRole).mockResolvedValue({} as any)
    vi.mocked(adminService.deleteRealmRole).mockResolvedValue(undefined)
  })

  it('renders realm roles and tenant custom roles, disabling edit/delete for system roles', async () => {
    render(<RolesManagementPage />)

    expect(await screen.findByText('doctor')).toBeInTheDocument()
    expect(screen.getByText('ward_supervisor')).toBeInTheDocument()
    expect(screen.getByText('senior_nurse')).toBeInTheDocument()

    // "doctor" is a system role: its delete button should be disabled
    const deleteButtons = screen.getAllByTitle(/system roles cannot be deleted/i)
    expect(deleteButtons.length).toBeGreaterThan(0)
    expect(deleteButtons[0]).toBeDisabled()
  })

  it('deletes a non-system realm role', async () => {
    render(<RolesManagementPage />)

    await waitFor(() => expect(screen.getByText('ward_supervisor')).toBeInTheDocument())

    // First "Delete Role" button belongs to the realm-role table's non-system row (ward_supervisor)
    const deleteBtn = screen.getAllByTitle('Delete Role')[0]
    fireEvent.click(deleteBtn)

    // Material icon buttons render lowercase "delete" ligature text; the modal's confirm
    // button text is capitalized "Delete", so an exact-case match disambiguates the two.
    const confirmBtn = await screen.findByRole('button', { name: /^Delete$/ })
    await act(async () => {
      fireEvent.click(confirmBtn)
    })

    await waitFor(() => {
      expect(adminService.deleteRealmRole).toHaveBeenCalledWith('ward_supervisor')
    })
  })

  it('creates a new tenant custom role', async () => {
    render(<RolesManagementPage />)

    await waitFor(() => expect(screen.getByText('senior_nurse')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /add tenant role/i }))
    fireEvent.change(screen.getByPlaceholderText('e.g. senior_nurse'), {
      target: { value: 'triage_lead' },
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /create role/i }))
    })

    await waitFor(() => {
      expect(adminService.createTenantRole).toHaveBeenCalledWith({ name: 'triage_lead', description: '' })
    })
  })
})
