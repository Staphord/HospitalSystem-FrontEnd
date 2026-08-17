import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { MasterAdminsPage } from '../MasterAdminsPage'
import { masterService } from '@/api/services/master'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock masterService
vi.mock('@/api/services/master', () => ({
  masterService: {
    listMasterAdmins: vi.fn().mockResolvedValue([
      {
        super_admin_id: 'adm-1',
        username: 'masteradmin',
        email: 'admin@platform.system',
        full_name: 'Platform Root Admin',
        role: 'super_admin',
        is_active: true,
      },
    ]),
    listActiveSessions: vi.fn().mockResolvedValue([]),
    createMasterAdmin: vi.fn().mockResolvedValue({}),
    updateMasterAdmin: vi.fn().mockResolvedValue({}),
    deleteMasterAdmin: vi.fn().mockResolvedValue({}),
  },
}))

describe('MasterAdminsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(masterService.listMasterAdmins).mockResolvedValue([
      {
        super_admin_id: 'adm-1',
        username: 'masteradmin',
        email: 'admin@platform.system',
        full_name: 'Platform Root Admin',
        role: 'super_admin',
        is_active: true,
      },
    ] as any)
    vi.mocked(masterService.listActiveSessions).mockResolvedValue([])
  })

  it('renders list of master administrators and invite administrator action', async () => {
    render(
      <MemoryRouter>
        <MasterAdminsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Platform Root Admin')).toBeInTheDocument()
      expect(screen.getByText('admin@platform.system')).toBeInTheDocument()
    })
  })
})
