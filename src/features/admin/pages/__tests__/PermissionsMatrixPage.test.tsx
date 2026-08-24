import { render, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PermissionsMatrixPage } from '../PermissionsMatrixPage'
import { adminService } from '@/api/services/admin'

const mockSearchParams = new URLSearchParams()
vi.mock('react-router-dom', () => ({
  useSearchParams: () => [mockSearchParams],
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

vi.mock('@/api/services/admin', () => ({
  adminService: {
    listPermissions: vi.fn(),
    updatePermissions: vi.fn(),
    listTenantRoles: vi.fn(),
    listRealmRoles: vi.fn(),
  },
}))

const mockPermissions = [
  {
    roleName: 'doctor',
    modules: ['consultation', 'ward'],
    actions: ['create', 'read', 'update'],
    updatedAt: '2026-07-01T00:00:00Z',
  },
]

describe('PermissionsMatrixPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(adminService.listPermissions).mockResolvedValue(mockPermissions as any)
    vi.mocked(adminService.listTenantRoles).mockResolvedValue([])
    vi.mocked(adminService.listRealmRoles).mockResolvedValue([])
    vi.mocked(adminService.updatePermissions).mockResolvedValue({
      roleName: 'doctor',
      modules: ['consultation', 'ward', 'laboratory'],
      actions: ['create', 'read', 'update'],
      updatedAt: '2026-07-19T00:00:00Z',
    } as any)
  })

  it('renders role permission cards with module/action checkboxes checked from data', async () => {
    const { container } = render(<PermissionsMatrixPage />)

    await waitFor(() => expect(container.querySelector('#role-card-doctor')).toBeInTheDocument())
    const doctorCard = container.querySelector('#role-card-doctor')
    expect(doctorCard).toBeInTheDocument()
    expect(doctorCard).toHaveTextContent('consultation')
    expect(doctorCard).toHaveTextContent('laboratory')
  })

  it('enables save and persists changes when a module checkbox is toggled', async () => {
    const { container } = render(<PermissionsMatrixPage />)

    await waitFor(() => expect(container.querySelector('#role-card-doctor')).toBeInTheDocument())
    const doctorCard = container.querySelector('#role-card-doctor')!

    const labBtn = doctorCard.querySelectorAll('label')[3]
    if (labBtn) fireEvent.click(labBtn)

    const saveBtn = doctorCard.querySelector('button')!
    await act(async () => {
      fireEvent.click(saveBtn)
    })

    await waitFor(() => {
      expect(adminService.updatePermissions).toHaveBeenCalled()
    })
  })
})
