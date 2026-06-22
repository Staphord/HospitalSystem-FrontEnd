import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { SystemHealthPage } from '../SystemHealthPage'
import { monitoringService } from '@/api/services/monitoring'
import { masterService } from '@/api/services/master'

// Mock toast notification library
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock monitoring service
vi.mock('@/api/services/monitoring', () => ({
  monitoringService: {
    getSystemHealth: vi.fn(),
    getTenantAnalytics: vi.fn(),
  },
}))

// Mock master service
vi.mock('@/api/services/master', () => ({
  masterService: {
    listTenants: vi.fn(),
    listSubscriptions: vi.fn(),
  },
}))

describe('SystemHealthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockHealthData: any = {
    telemetry: {
      uptime: '99.98%',
      active_users: 145,
      cpu_usage: 25,
      ram_usage: 58,
      disk_usage: 71,
      history: {
        cpu: [20, 22, 25, 23, 24, 25],
        ram: [58, 58, 58, 58, 58, 58],
        disk: [71, 71, 71, 71, 71, 71],
        db: [30, 32, 34, 33, 35, 34],
      },
    },
    incidents: [
      {
        id: 'inc-1',
        title: 'Database Replication Lag',
        severity: 'critical',
        status: 'active',
        message: 'Active lag of 45s detected on US-East replica.',
        created_at: new Date().toISOString(),
      },
    ],
  }

  const mockTenants: any = [
    {
      tenant_id: 'aga-khan',
      hospital_name: 'Aga Khan Hospital',
      status: 'active',
      storage_gb: 200,
    },
  ]

  const mockSubscriptions: any = [
    {
      id: 'sub-1',
      tenant_id: 'aga-khan',
      plan_name: 'Premium',
      status: 'active',
    },
  ]

  const mockAnalytics: any = {
    uptime_trend: [99.9, 99.95, 99.92, 99.99, 99.98, 99.99, 100.0],
    active_users_peak: [10, 15, 22, 18, 20, 25, 30],
    storage_growth: [12, 14, 15, 17, 20, 22, 25],
    module_usage: [
      { module: 'Consultation', percentage: 40 },
      { module: 'Triage', percentage: 25 },
      { module: 'Pharmacy', percentage: 20 },
      { module: 'Laboratory', percentage: 15 },
    ],
    activity_logs: [],
  }

  it('renders system health vitals and telemetry values', async () => {
    vi.mocked(monitoringService.getSystemHealth).mockResolvedValue(mockHealthData)
    vi.mocked(monitoringService.getTenantAnalytics).mockResolvedValue(mockAnalytics)
    vi.mocked(masterService.listTenants).mockResolvedValue(mockTenants)
    vi.mocked(masterService.listSubscriptions).mockResolvedValue(mockSubscriptions)

    render(
      <MemoryRouter>
        <SystemHealthPage />
      </MemoryRouter>
    )

    // Wait for telemetry loading to complete
    await waitFor(() => {
      expect(screen.getByText('CPU Cluster Load')).toBeInTheDocument()
    })

    // Assert that metric cards are present with correct details
    expect(screen.getByText('25%')).toBeInTheDocument()

    expect(screen.getByText('RAM Utilization')).toBeInTheDocument()
    expect(screen.getByText('58%')).toBeInTheDocument()

    expect(screen.getByText('NAS Disk Storage')).toBeInTheDocument()
    expect(screen.getByText('71%')).toBeInTheDocument()

    // Assert that active incident is displayed
    expect(screen.getByText('Database Replication Lag')).toBeInTheDocument()
    expect(screen.getByText('critical')).toBeInTheDocument()
  })

  it('navigates to tenant usage analytics tab and loads single tenant usage details', async () => {
    vi.mocked(monitoringService.getSystemHealth).mockResolvedValue(mockHealthData)
    vi.mocked(monitoringService.getTenantAnalytics).mockResolvedValue(mockAnalytics)
    vi.mocked(masterService.listTenants).mockResolvedValue(mockTenants)
    vi.mocked(masterService.listSubscriptions).mockResolvedValue(mockSubscriptions)

    render(
      <MemoryRouter>
        <SystemHealthPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('CPU Cluster Load')).toBeInTheDocument()
    })

    // Switch to usage tab
    const usageTabBtn = screen.getByRole('button', { name: /tenant usage analytics/i })
    await act(async () => {
      fireEvent.click(usageTabBtn)
    })

    // Assert aggregate charts load
    expect(screen.getByText('Aggregate Disk Storage')).toBeInTheDocument()
    expect(screen.getByText('Tenant Capacity & Usage Metrics')).toBeInTheDocument()

    // Click on Aga Khan Hospital row to display single tenant usage details
    const rowBtn = screen.getByText('Aga Khan Hospital')
    await act(async () => {
      fireEvent.click(rowBtn)
    })

    // Wait for analytics data to display
    await waitFor(() => {
      expect(screen.getByText(/Aga Khan Hospital\s+Usage Details/i)).toBeInTheDocument()
    })

    // Assert charts render module segments
    expect(screen.getByText('Consultation (40%)')).toBeInTheDocument()
    expect(screen.getByText('Triage (25%)')).toBeInTheDocument()
  })
})
