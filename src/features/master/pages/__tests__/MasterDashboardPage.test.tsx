import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { MasterDashboardPage } from '../MasterDashboardPage'
import { masterService } from '@/api/services/master'
import { monitoringService } from '@/api/services/monitoring'

// Mock services
vi.mock('@/api/services/master', () => ({
  masterService: {
    listTenants: vi.fn().mockResolvedValue([
      { id: 't-1', name: 'Aga Khan Hospital', status: 'active' },
      { id: 't-2', name: 'Muhimbili National Hospital', status: 'active' },
    ]),
    listInvoices: vi.fn().mockResolvedValue([]),
    listPlans: vi.fn().mockResolvedValue([]),
    getRevenueHistory: vi.fn().mockResolvedValue({ months: ['Jan', 'Feb'], revenue: [1000, 2000] }),
  },
}))

vi.mock('@/api/services/monitoring', () => ({
  monitoringService: {
    getSystemHealth: vi.fn().mockResolvedValue({
      status: 'healthy',
      cpu_percent: 18,
      memory_percent: 45,
      disk_percent: 32,
      incidents: [],
      telemetry: { active_users: 120 },
    }),
    getAuditLogs: vi.fn().mockResolvedValue([]),
    getUsageTelemetry: vi.fn().mockResolvedValue([]),
  },
}))

describe('MasterDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(masterService.listTenants).mockResolvedValue([
      { tenant_id: 't-1', hospital_name: 'Aga Khan Hospital', status: 'active' },
      { tenant_id: 't-2', hospital_name: 'Muhimbili National Hospital', status: 'active' },
    ] as any)
    vi.mocked(masterService.listInvoices).mockResolvedValue([])
    vi.mocked(masterService.listPlans).mockResolvedValue([])
    vi.mocked(masterService.getRevenueHistory).mockResolvedValue({ months: ['Jan', 'Feb'], revenue: [1000, 2000] } as any)
    vi.mocked(monitoringService.getSystemHealth).mockResolvedValue({
      status: 'healthy',
      cpu_percent: 18,
      memory_percent: 45,
      disk_percent: 32,
      incidents: [],
      telemetry: { active_users: 120 },
    } as any)
    vi.mocked(monitoringService.getAuditLogs).mockResolvedValue([])
    vi.mocked(monitoringService.getUsageTelemetry).mockResolvedValue([])
  })

  it('renders super admin platform metrics and active tenant counters', async () => {
    render(
      <MemoryRouter>
        <MasterDashboardPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Total Hospitals')).toBeInTheDocument()
      expect(screen.getByText('Active Users')).toBeInTheDocument()
      expect(screen.getByText('Aga Khan Hospital')).toBeInTheDocument()
    })
  })
})
