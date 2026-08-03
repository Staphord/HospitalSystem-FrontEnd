import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PermissionsMatrixPage } from '../PermissionsMatrixPage'
import { adminService } from '@/api/services/admin'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

vi.mock('@/api/services/admin', () => ({
  adminService: {
    listPermissions: vi.fn(),
    updatePermissions: vi.fn(),
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
    vi.mocked(adminService.updatePermissions).mockResolvedValue({
      roleName: 'doctor',
      modules: ['consultation', 'ward', 'laboratory'],
      actions: ['create', 'read', 'update'],
      updatedAt: '2026-07-19T00:00:00Z',
    } as any)
  })

  it('renders role permission cards with module/action checkboxes checked from data', async () => {
    render(<PermissionsMatrixPage />)

    expect(await screen.findByText('doctor')).toBeInTheDocument()
    expect(screen.getByText('consultation')).toBeInTheDocument()
    expect(screen.getByText('laboratory')).toBeInTheDocument()

    // Save button starts disabled (no unsaved changes)
    expect(screen.getByRole('button', { name: /saved/i })).toBeDisabled()
  })

  it('enables save and persists changes when a module checkbox is toggled', async () => {
    render(<PermissionsMatrixPage />)

    await waitFor(() => expect(screen.getByText('laboratory')).toBeInTheDocument())

    fireEvent.click(screen.getByText('laboratory'))

    const saveBtn = screen.getByRole('button', { name: /save changes/i })
    expect(saveBtn).not.toBeDisabled()

    await act(async () => {
      fireEvent.click(saveBtn)
    })

    await waitFor(() => {
      expect(adminService.updatePermissions).toHaveBeenCalledWith('doctor', {
        modules: ['consultation', 'ward', 'laboratory'],
        actions: ['create', 'read', 'update'],
      })
    })
  })
})
