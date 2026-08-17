import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuditLogsPage } from '../AuditLogsPage'
import { monitoringService } from '@/api/services/monitoring'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock monitoringService
vi.mock('@/api/services/monitoring', () => ({
  monitoringService: {
    getAuditLogs: vi.fn().mockResolvedValue([
      {
        id: 'log-1',
        actor: 'admin@platform.com',
        actor_name: 'Platform Admin',
        action: 'tenant_created',
        details: 'Created new hospital tenant Aga Khan',
        ip_address: '192.168.1.1',
        timestamp: new Date().toISOString(),
      },
    ]),
  },
}))

describe('AuditLogsPage (Master)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(monitoringService.getAuditLogs).mockResolvedValue([
      {
        id: 'log-1',
        actor: 'admin@platform.com',
        actor_name: 'Platform Admin',
        action: 'tenant_created',
        details: 'Created new hospital tenant Aga Khan',
        ip_address: '192.168.1.1',
        timestamp: new Date().toISOString(),
      },
    ] as any)
  })

  it('renders global platform audit log trail and export button', async () => {
    render(
      <MemoryRouter>
        <AuditLogsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Export Log Data/i)).toBeInTheDocument()
      expect(screen.getByText('admin@platform.com')).toBeInTheDocument()
      expect(screen.getAllByText('tenant_created').length).toBeGreaterThan(0)
    })
  })
})
