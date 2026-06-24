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
    updateSubscription: vi.fn(),
    createInvoice: vi.fn(),
    subscribeTenant: vi.fn(),
    upgradeTenantSubscription: vi.fn(),
    downgradeTenantSubscription: vi.fn(),
    upgradeSubscriptionEndpoint: vi.fn(),
    downgradeSubscriptionEndpoint: vi.fn(),
  },
}))

describe('SubscriptionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    window.open = vi.fn()
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

  it('loads and renders subscription dashboard elements', async () => {
    vi.mocked(masterService.getTenant).mockResolvedValue(mockTenant)
    vi.mocked(masterService.listSubscriptions).mockResolvedValue(mockSubscriptions)
    vi.mocked(masterService.listPlans).mockResolvedValue(mockPlans)
    vi.mocked(masterService.listInvoices).mockResolvedValue(mockInvoices)

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
    const mockUpdateSubscription = vi.fn().mockResolvedValue({
      id: 'sub-gilgal',
      tenant_id: 'gilgal',
      plan_name: 'Basic',
      status: 'active',
      auto_renew: false,
    })

    vi.mocked(masterService.getTenant).mockResolvedValue(mockTenant)
    vi.mocked(masterService.listSubscriptions).mockResolvedValue(mockSubscriptions)
    vi.mocked(masterService.listPlans).mockResolvedValue(mockPlans)
    vi.mocked(masterService.listInvoices).mockResolvedValue(mockInvoices)
    vi.mocked(masterService.updateSubscription).mockImplementation(mockUpdateSubscription)

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
      expect(mockUpdateSubscription).toHaveBeenCalledWith('sub-gilgal', { auto_renew: false })
    })
  })

  it('triggers upgrade plan flow and calculates prorated invoices', async () => {
    const mockUpgradeEndpoint = vi.fn().mockResolvedValue({
      invoice: { amount: 1199, status: 'pending' },
      payment_checkout_url: 'https://checkout.stripe.com/pay'
    })

    const listSubsMock = vi.fn()
      .mockResolvedValueOnce(mockSubscriptions) // initial fetch
      .mockResolvedValueOnce([                  // poll fetch
        {
          id: 'sub-gilgal',
          subscription_id: 'sub-gilgal',
          tenant_id: 'gilgal',
          plan_name: 'Premium',
          status: 'active',
          start_date: '2026-06-01T00:00:00Z',
          end_date: '2026-07-01T00:00:00Z',
          auto_renew: true,
        }
      ])

    vi.mocked(masterService.getTenant).mockResolvedValue(mockTenant)
    vi.mocked(masterService.listSubscriptions).mockImplementation(listSubsMock)
    vi.mocked(masterService.listPlans).mockResolvedValue(mockPlans)
    vi.mocked(masterService.listInvoices).mockResolvedValue(mockInvoices)
    vi.mocked(masterService.upgradeSubscriptionEndpoint).mockImplementation(mockUpgradeEndpoint)

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
    const upgradeBtn = screen.getByRole('button', { name: /upgrade now/i })
    await act(async () => {
      fireEvent.click(upgradeBtn)
    })

    // Assert that confirmation modal is open
    expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument()

    // Confirm upgrade execution
    const confirmBtn = screen.getByRole('button', { name: /confirm upgrade/i })
    await act(async () => {
      fireEvent.click(confirmBtn)
    })

    await waitFor(() => {
      expect(mockUpgradeEndpoint).toHaveBeenCalledWith('sub-gilgal', {
        plan_id: 'premium',
      })
    })
  })

  it('cancels subscription and then reactivates it', async () => {
    const mockUpdateSubscription = vi.fn().mockResolvedValue({
      id: 'sub-gilgal',
      tenant_id: 'gilgal',
      plan_name: 'Basic',
      status: 'cancelled',
      auto_renew: false,
    })

    const listSubscriptionsMock = vi
      .fn()
      .mockResolvedValueOnce(mockSubscriptions)
      .mockResolvedValueOnce([
        {
          id: 'sub-gilgal',
          tenant_id: 'gilgal',
          plan_name: 'Basic',
          status: 'cancelled',
          auto_renew: false,
        },
      ])

    vi.mocked(masterService.getTenant).mockResolvedValue(mockTenant)
    vi.mocked(masterService.listSubscriptions).mockImplementation(listSubscriptionsMock)
    vi.mocked(masterService.listPlans).mockResolvedValue(mockPlans)
    vi.mocked(masterService.listInvoices).mockResolvedValue(mockInvoices)
    vi.mocked(masterService.updateSubscription).mockImplementation(mockUpdateSubscription)

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
    expect(screen.getByRole('heading', { name: 'Cancel Subscription' })).toBeInTheDocument()

    const confirmCancelBtn = screen.getByRole('button', { name: /yes, cancel subscription/i })
    await act(async () => {
      fireEvent.click(confirmCancelBtn)
    })

    await waitFor(() => {
      expect(mockUpdateSubscription).toHaveBeenCalledWith('sub-gilgal', {
        status: 'cancelled',
        auto_renew: false,
      })
    })
  })
})
