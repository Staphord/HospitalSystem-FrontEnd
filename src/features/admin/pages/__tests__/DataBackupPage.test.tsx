import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { DataBackupPage } from '../DataBackupPage'
import { adminService } from '@/api/services/admin'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock useApp
vi.mock('@/features/admin/context/AppContext', () => ({
  useApp: () => ({
    setActiveView: vi.fn(),
  }),
}))

// Mock adminService
vi.mock('@/api/services/admin', () => ({
  adminService: {
    listBackups: vi.fn().mockResolvedValue([
      {
        id: 'bk-1',
        filename: 'hospital_backup_20260815.sql.gz',
        size_bytes: 15482931,
        created_at: new Date().toISOString(),
        status: 'completed',
      },
    ]),
    triggerBackup: vi.fn().mockResolvedValue({}),
    downloadBackup: vi.fn().mockResolvedValue({}),
  },
}))

describe('DataBackupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(adminService.listBackups).mockResolvedValue([
      {
        id: 'bk-1',
        filename: 'hospital_backup_20260815.sql.gz',
        size_bytes: 15482931,
        created_at: new Date().toISOString(),
        status: 'completed',
      },
    ] as any)
  })

  it('renders backup status overview and previous backup snapshots', async () => {
    render(
      <MemoryRouter>
        <DataBackupPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Data Backup')).toBeInTheDocument()
      expect(screen.getByText('hospital_backup_20260815.sql.gz')).toBeInTheDocument()
    })
  })
})
