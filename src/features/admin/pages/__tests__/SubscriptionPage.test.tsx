import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { SubscriptionPage } from '../SubscriptionPage'
import { masterService } from '@/api/services/master'

// Mock toast notification library
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

// Mock context hook
vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    staffList: Array.from({ length: 5 }, (_, i) => ({ id: i.toString() })),
  }),
}))

// Mock auth store hook
vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (s: any) => any) => {
    const mockState = { tenantId: 'gilgal' }
    return selector(mockState)
  },
}))

vi.mock('@/api/services/master', () => ({
  masterService: {
    getTenant: vi.fn(),
    listSubscriptions: vi.fn(),
    listPlans: vi.fn(),
    listInvoices: vi.fn(),
    getMyTenantDetails: vi.fn(),
    getMySubscription: vi.fn(),
    listMyPlans: vi.fn(),
    listMyInvoices: vi.fn(),
    getMyTenantStats: vi.fn(),
    updateSubscription: vi.fn(),
    toggleAutoRenew: vi.fn(),
    createInvoice: vi.fn(),
    subscribeTenant: vi.fn(),
    upgradeTenantSubscription: vi.fn(),
    downgradeTenantSubscription: vi.fn(),
    upgradeSubscriptionEndpoint: vi.fn(),
    downgradeSubscriptionEndpoint: vi.fn(),
    getMyRequestStatus: vi.fn(),
    requestPlanChange: vi.fn(),
    requestCancellation: vi.fn(),
    downloadInvoice: vi.fn(),
    listMySubscriptionRequests: vi.fn(),
  },
}))

describe('SubscriptionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    window.open = vi.fn()
    vi.mocked(masterService.listMySubscriptionRequests).mockResolvedValue([])
  })

  const mockTenant: any = {
    tenant_id: 'gilgal',
    hospital_name: 'Gilgal Medical Center',
    currency: 'USD',
    grace_days: 7,
  }

  const mockSubscriptions = [
    {
      id: 'sub-gilgal',
      subscription_id: 'sub-gilgal',
      tenant_id: 'gilgal',
      plan_name: 'Basic',
      status: 'active',
      start_date: '2026-06-01T00:00:00Z',
      end_date: '2026-07-01T00:00:00Z',
      auto_renew: true,
      billing_cycle: 'monthly',
    },
  ]

  const mockPlans: any = [
    {
      plan_id: 'basic',
      plan_name: 'Basic',
      description: 'Essential modules',
      max_users: 10,
      max_patients: 10000,
      storage_gb: 10,
      monthly_price: 299,
      annual_price: 2990,
      uptime_sla_pct: 99.9,
      backup_frequency_hours: 24,
      modules_included: ['reception', 'triage'],
    },
    {
      plan_id: 'premium',
      plan_name: 'Premium',
      description: 'Full clinical workflow',
      max_users: 50,
      max_patients: 100000,
      storage_gb: 200,
      monthly_price: 1199,
      annual_price: 11990,
      uptime_sla_pct: 99.99,
      backup_frequency_hours: 4,
      modules_included: ['reception', 'triage', 'consultation'],
    },
  ]

  const mockInvoices = [
    {
      id: 'inv-gilgal-1',
      invoice_id: 'inv-gilgal-1',
      tenant_id: 'gilgal',
      amount: 299,
      status: 'paid',
      due_date: '2026-06-15',
      description: 'Basic Plan Monthly Subscription',
    },
  ]

  const mockStatsObj = {
    staffCount: 5,
    patientCount: 450,
    storageUsed: 2.4,
  }

  it('loads and renders subscription dashboard elements', async () => {
    vi.mocked(masterService.getMyTenantDetails).mockResolvedValue(mockTenant)
    vi.mocked(masterService.getMySubscription).mockResolvedValue(mockSubscriptions)
    vi.mocked(masterService.listMyPlans).mockResolvedValue(mockPlans)
    vi.mocked(masterService.listMyInvoices).mockResolvedValue(mockInvoices)
    vi.mocked(masterService.getMyRequestStatus).mockResolvedValue(null)
    vi.mocked(masterService.getMyTenantStats).mockResolvedValue(mockStatsObj)

    render(
      <MemoryRouter>
        <SubscriptionPage />
      </MemoryRouter>
    )

    // Wait for the components to populate
    await waitFor(() => {
      expect(screen.getByText('Basic')).toBeInTheDocument()
    })

    expect(screen.getByText('Current Plan')).toBeInTheDocument()
    expect(screen.getByText('Plan Usage')).toBeInTheDocument()
    expect(screen.getByText('Invoice History')).toBeInTheDocument()

    // Assert staff list counts (5 / 10 from mock context)
    expect(screen.getByText('5 / 10')).toBeInTheDocument()
  })

  it('toggles subscription auto-renew status switch', async () => {
    const mockToggleAutoRenew = vi.fn().mockResolvedValue({
      success: true,
    })

    vi.mocked(masterService.getMyTenantDetails).mockResolvedValue(mockTenant)
    vi.mocked(masterService.getMySubscription).mockResolvedValue(mockSubscriptions)
    vi.mocked(masterService.listMyPlans).mockResolvedValue(mockPlans)
    vi.mocked(masterService.listMyInvoices).mockResolvedValue(mockInvoices)
    vi.mocked(masterService.getMyRequestStatus).mockResolvedValue(null)
    vi.mocked(masterService.getMyTenantStats).mockResolvedValue(mockStatsObj)
    vi.mocked(masterService.toggleAutoRenew).mockImplementation(mockToggleAutoRenew)

    render(
      <MemoryRouter>
        <SubscriptionPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Basic')).toBeInTheDocument()
    })

    const toggleBtn = screen.getByRole('button', { name: /toggle auto-renewal/i })
    await act(async () => {
      fireEvent.click(toggleBtn)
    })

    await waitFor(() => {
      expect(mockToggleAutoRenew).toHaveBeenCalledWith(false)
    })
  })

  it('submits a plan change request for approval', async () => {
    const mockRequestPlanChange = vi.fn().mockResolvedValue({
      id: 'req-1',
      status: 'pending',
      message: 'Request submitted for review',
    })

    vi.mocked(masterService.getMyTenantDetails).mockResolvedValue(mockTenant)
    vi.mocked(masterService.getMySubscription).mockResolvedValue(mockSubscriptions)
    vi.mocked(masterService.listMyPlans).mockResolvedValue(mockPlans)
    vi.mocked(masterService.listMyInvoices).mockResolvedValue(mockInvoices)
    vi.mocked(masterService.getMyRequestStatus).mockResolvedValue(null)
    vi.mocked(masterService.getMyTenantStats).mockResolvedValue(mockStatsObj)
    vi.mocked(masterService.requestPlanChange).mockImplementation(mockRequestPlanChange)

    render(
      <MemoryRouter>
        <SubscriptionPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Basic')).toBeInTheDocument()
    })

    const requestChangeBtn = screen.getByRole('button', { name: /request plan change/i })
    await act(async () => {
      fireEvent.click(requestChangeBtn)
    })

    // Verify upgrade plan modal renders
    expect(screen.getByText('Select Subscription Plan')).toBeInTheDocument()

    // Select the premium upgrade plan option
    const upgradeBtn = screen.getByRole('button', { name: /select upgrade/i })
    await act(async () => {
      fireEvent.click(upgradeBtn)
    })

    // Assert that confirmation modal is open
    expect(screen.getByText('Request Upgrade to Premium')).toBeInTheDocument()

    // Submit request
    const confirmBtn = screen.getByRole('button', { name: /submit request/i })
    await act(async () => {
      fireEvent.click(confirmBtn)
    })

    await waitFor(() => {
      expect(mockRequestPlanChange).toHaveBeenCalledWith({
        plan: 'Premium',
        reason: 'Requested change to Premium (monthly, effective immediately).',
        billing_cycle: 'monthly',
        effective_at_end: false,
      })
    })
  })

  it('submits a cancellation request for super admin approval', async () => {
    const mockRequestCancellation = vi.fn().mockResolvedValue({
      id: 'cancel-req-1',
      status: 'pending',
      message: 'Cancellation request submitted for review',
    })

    vi.mocked(masterService.getMyTenantDetails).mockResolvedValue(mockTenant)
    vi.mocked(masterService.getMySubscription).mockResolvedValue(mockSubscriptions)
    vi.mocked(masterService.listMyPlans).mockResolvedValue(mockPlans)
    vi.mocked(masterService.listMyInvoices).mockResolvedValue(mockInvoices)
    vi.mocked(masterService.getMyRequestStatus).mockResolvedValue(null)
    vi.mocked(masterService.getMyTenantStats).mockResolvedValue(mockStatsObj)
    vi.mocked(masterService.requestCancellation).mockImplementation(mockRequestCancellation)

    render(
      <MemoryRouter>
        <SubscriptionPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Basic')).toBeInTheDocument()
    })

    const cancelBtn = screen.getByRole('button', { name: /cancel subscription/i })
    await act(async () => {
      fireEvent.click(cancelBtn)
    })

    // Assert confirmation modal is shown
    expect(screen.getByRole('heading', { name: 'Request Cancellation' })).toBeInTheDocument()

    // Fill in cancellation reason
    const reasonTextarea = screen.getByPlaceholderText(/reason for cancelling/i)
    await act(async () => {
      fireEvent.change(reasonTextarea, { target: { value: 'Switching to a different system' } })
    })

    const submitBtn = screen.getByRole('button', { name: /submit cancellation request/i })
    await act(async () => {
      fireEvent.click(submitBtn)
    })

    await waitFor(() => {
      expect(mockRequestCancellation).toHaveBeenCalledWith({
        reason: 'Switching to a different system',
      })
    })
  })
})
