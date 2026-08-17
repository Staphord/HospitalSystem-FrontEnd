import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuditLogsPage } from '../AuditLogsPage'
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
    listUsers: vi.fn().mockResolvedValue([
      { keycloak_sub: 'usr-1', full_name: 'Dr. John Doe', username: 'drjohn' },
    ]),
    listHospitalAuditLogs: vi.fn().mockResolvedValue([
      {
        id: 'log-1',
        action: 'UPDATE_PATIENT',
        department: 'Reception',
        user_id: 'usr-1',
        created_at: new Date().toISOString(),
      },
    ]),
    listHospitalAuditLogsPage: vi.fn().mockResolvedValue({
      total: 1,
      items: [
        {
          id: 'log-1',
          action: 'UPDATE_PATIENT',
          department: 'Reception',
          user_id: 'usr-1',
          user_name: 'Dr. John Doe',
          staffName: 'Dr. John Doe',
          staffRole: 'doctor',
          details: 'Updated patient demographics for PT-1001',
          created_at: new Date().toISOString(),
          timestamp: '2026-08-15 10:00:00',
        },
      ],
    }),
  },
}))

describe('AuditLogsPage (Hospital Admin)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(adminService.listUsers).mockResolvedValue([
      { keycloak_sub: 'usr-1', full_name: 'Dr. John Doe', username: 'drjohn' } as any,
    ])
    vi.mocked(adminService.listHospitalAuditLogs).mockResolvedValue([
      {
        id: 'log-1',
        action: 'UPDATE_PATIENT',
        department: 'Reception',
        user_id: 'usr-1',
        created_at: new Date().toISOString(),
      } as any,
    ])
    vi.mocked(adminService.listHospitalAuditLogsPage).mockResolvedValue({
      total: 1,
      items: [
        {
          id: 'log-1',
          action: 'UPDATE_PATIENT',
          department: 'Reception',
          user_id: 'usr-1',
          user_name: 'Dr. John Doe',
          staffName: 'Dr. John Doe',
          staffRole: 'doctor',
          details: 'Updated patient demographics for PT-1001',
          created_at: new Date().toISOString(),
          timestamp: '2026-08-15 10:00:00',
        } as any,
      ],
    })
  })

  it('renders hospital audit log entries and filter selectors', async () => {
    render(
      <MemoryRouter>
        <AuditLogsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Audit Log')).toBeInTheDocument()
      expect(screen.getAllByText('UPDATE_PATIENT')[0]).toBeInTheDocument()
    })
  })
})
