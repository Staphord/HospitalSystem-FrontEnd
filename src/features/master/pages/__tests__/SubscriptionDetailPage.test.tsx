import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { SubscriptionDetailPage } from '../SubscriptionDetailPage'
import { masterService } from '@/api/services/master'

// Mock toast notification library
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock master service
vi.mock('@/api/services/master', () => ({
  masterService: {
    listSubscriptions: vi.fn(),
    getTenant: vi.fn(),
    listPlans: vi.fn(),
    updateSubscription: vi.fn(),
    subscribeTenant: vi.fn(),
    upgradeTenantSubscription: vi.fn(),
    downgradeTenantSubscription: vi.fn(),
    upgradeSubscriptionEndpoint: vi.fn(),
    downgradeSubscriptionEndpoint: vi.fn(),
    createInvoice: vi.fn(),
    listInvoices: vi.fn(),
    listSubscriptionAuditLogs: vi.fn(),
  },
}))

describe('SubscriptionDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(masterService.listInvoices).mockResolvedValue([])
    vi.mocked(masterService.listSubscriptionAuditLogs).mockResolvedValue([])
  })

  const renderComponent = (subId = 'sub-1') => {
    return render(
      <MemoryRouter initialEntries={[`/master/subscriptions/${subId}`]}>
        <Routes>
          <Route path="/master/subscriptions/:id" element={<SubscriptionDetailPage />} />
        </Routes>
      </MemoryRouter>
    )
  }

  it('renders loading state initially', () => {
    vi.mocked(masterService.listSubscriptions).mockImplementation(() => new Promise(() => {}))
    vi.mocked(masterService.getTenant).mockImplementation(() => new Promise(() => {}))
    vi.mocked(masterService.listPlans).mockImplementation(() => new Promise(() => {}))
    vi.mocked(masterService.listInvoices).mockImplementation(() => new Promise(() => {}))
    vi.mocked(masterService.listSubscriptionAuditLogs).mockImplementation(() => new Promise(() => {}))

    renderComponent()
    expect(screen.getByText(/loading subscription details/i)).toBeInTheDocument()
  })

  it('loads and displays subscription details and plan information', async () => {
    const mockSubscription = {
      id: 'sub-1',
      subscription_id: 'sub-1',
      tenant_id: 'aga-khan',
      plan_name: 'Premium',
      status: 'active',
      start_date: '2026-06-01T00:00:00Z',
      end_date: '2026-07-01T00:00:00Z',
      auto_renew: true,
    }

    const mockTenant = {
      tenant_id: 'aga-khan',
      hospital_name: 'Aga Khan Hospital',
      status: 'active',
    }

    const mockPlans: any = [
      {
        plan_id: 'premium',
        plan_name: 'Premium',
        description: 'Full clinical workflow',
        max_users: 50,
        max_patients: 100000,
        storage_gb: 200,
        monthly_price: 1199,
        uptime_sla_pct: 99.99,
        modules_included: ['reception', 'triage', 'consultation'],
      },
    ]

    vi.mocked(masterService.listSubscriptions).mockResolvedValue([mockSubscription])
    vi.mocked(masterService.getTenant).mockResolvedValue(mockTenant)
    vi.mocked(masterService.listPlans).mockResolvedValue(mockPlans)

    renderComponent()

    // Wait for the elements to render
    await waitFor(() => {
      expect(screen.getByText(/Aga Khan Hospital/i)).toBeInTheDocument()
    })

    expect(screen.getByText('Premium')).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('100,000')).toBeInTheDocument()
    expect(screen.getByText('200 GB')).toBeInTheDocument()
  })

  it('toggles subscription auto-renew checkbox', async () => {
    const mockSubscription = {
      id: 'sub-1',
      subscription_id: 'sub-1',
      tenant_id: 'aga-khan',
      plan_name: 'Premium',
      status: 'active',
      start_date: '2026-06-01T00:00:00Z',
      end_date: '2026-07-01T00:00:00Z',
      auto_renew: true,
    }

    const mockTenant = {
      tenant_id: 'aga-khan',
      hospital_name: 'Aga Khan Hospital',
      status: 'active',
    }

    const mockPlans: any = [
      {
        plan_id: 'premium',
        plan_name: 'Premium',
        max_users: 50,
        max_patients: 100000,
        storage_gb: 200,
        monthly_price: 1199,
        uptime_sla_pct: 99.99,
        modules_included: [],
      },
    ]

    vi.mocked(masterService.listSubscriptions).mockResolvedValue([mockSubscription])
    vi.mocked(masterService.getTenant).mockResolvedValue(mockTenant)
    vi.mocked(masterService.listPlans).mockResolvedValue(mockPlans)
    vi.mocked(masterService.updateSubscription).mockResolvedValue({ ...mockSubscription, auto_renew: false })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/Aga Khan Hospital/i)).toBeInTheDocument()
    })

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()

    // Trigger checkbox toggle
    await act(async () => {
      fireEvent.click(checkbox)
    })

    await waitFor(() => {
      expect(masterService.updateSubscription).toHaveBeenCalledWith('sub-1', { auto_renew: false })
    })
  })

  it('changes subscription plan via modal selection', async () => {
    const mockSubscription = {
      id: 'sub-1',
      subscription_id: 'sub-1',
      tenant_id: 'aga-khan',
      plan_name: 'Basic',
      status: 'active',
      start_date: '2026-06-01T00:00:00Z',
      end_date: '2026-07-01T00:00:00Z',
      auto_renew: true,
    }

    const mockTenant = {
      tenant_id: 'aga-khan',
      hospital_name: 'Aga Khan Hospital',
      status: 'active',
    }

    const mockPlans: any = [
      {
        plan_id: 'basic',
        plan_name: 'Basic',
        monthly_price: 299,
        max_users: 10,
        max_patients: 10000,
        storage_gb: 10,
        uptime_sla_pct: 99.9,
        modules_included: [],
      },
      {
        plan_id: 'premium',
        plan_name: 'Premium',
        monthly_price: 1199,
        max_users: 50,
        max_patients: 100000,
        storage_gb: 200,
        uptime_sla_pct: 99.99,
        modules_included: [],
      },
    ]

    vi.mocked(masterService.listSubscriptions).mockResolvedValue([mockSubscription])
    vi.mocked(masterService.getTenant).mockResolvedValue(mockTenant)
    vi.mocked(masterService.listPlans).mockResolvedValue(mockPlans)
    const mockUpgrade = vi.fn().mockResolvedValue({
      id: 'sub-1',
      subscription_id: 'sub-1',
      tenant_id: 'aga-khan',
      plan_name: 'Premium',
      status: 'active',
      start_date: '2026-06-01T00:00:00Z',
      end_date: '2026-07-01T00:00:00Z',
      auto_renew: true,
    })
    vi.mocked(masterService.upgradeSubscriptionEndpoint).mockImplementation(mockUpgrade)
    vi.mocked(masterService.createInvoice).mockResolvedValue({
      id: 'inv-adj',
      invoice_id: 'inv-adj',
      tenant_id: 'aga-khan',
      amount: 0,
      status: 'paid'
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/Aga Khan Hospital/i)).toBeInTheDocument()
    })

    const changePlanBtn = screen.getByRole('button', { name: /change plan tiers/i })
    await act(async () => {
      fireEvent.click(changePlanBtn)
    })

    // Verify modal is open
    expect(screen.getByText('Change Subscription Plan')).toBeInTheDocument()

    // Select the premium upgrade button
    const upgradeBtns = screen.getAllByRole('button', { name: /upgrade/i })
    await act(async () => {
      fireEvent.click(upgradeBtns[0])
    })

    // Verify upgrade plan call is made
    await waitFor(() => {
      expect(mockUpgrade).toHaveBeenCalledWith('aga-khan', {
        plan_id: 'premium',
        effective_at_end: false,
      })
    })
  })

  it('renders invoices and plan history log tabs correctly', async () => {
    const mockSubscription = {
      id: 'sub-1',
      subscription_id: 'sub-1',
      tenant_id: 'aga-khan',
      plan_name: 'Premium',
      status: 'active',
      start_date: '2026-06-01T00:00:00Z',
      end_date: '2026-07-01T00:00:00Z',
      auto_renew: true,
    }

    const mockTenant = {
      tenant_id: 'aga-khan',
      hospital_name: 'Aga Khan Hospital',
      status: 'active',
    }

    const mockPlans: any = [
      {
        plan_id: 'premium',
        plan_name: 'Premium',
        monthly_price: 1199,
        max_users: 50,
        max_patients: 100000,
        storage_gb: 200,
        uptime_sla_pct: 99.99,
        modules_included: [],
      },
    ]

    const mockInvoices: any = [
      {
        invoice_id: 'inv-1',
        invoice_number: 'INV-2026-0001',
        billing_period_start: '2026-06-01',
        billing_period_end: '2026-07-01',
        plan_name: 'Premium',
        amount: 1199,
        status: 'paid',
      },
    ]

    const mockAuditLogs: any = [
      {
        log_id: 'log-1',
        event_type: 'plan_created',
        reason: 'Initial standard subscription',
        created_at: '2026-06-01T00:00:00Z',
      },
    ]

    vi.mocked(masterService.listSubscriptions).mockResolvedValue([mockSubscription])
    vi.mocked(masterService.getTenant).mockResolvedValue(mockTenant)
    vi.mocked(masterService.listPlans).mockResolvedValue(mockPlans)
    vi.mocked(masterService.listInvoices).mockResolvedValue(mockInvoices)
    vi.mocked(masterService.listSubscriptionAuditLogs).mockResolvedValue(mockAuditLogs)

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/Aga Khan Hospital/i)).toBeInTheDocument()
    })

    // Expect the history ledger header to be rendered
    expect(screen.getByText('Subscription & Billing History')).toBeInTheDocument()

    // Expect mock invoice details to be rendered
    expect(screen.getByText('INV-2026-0001')).toBeInTheDocument()
    expect(screen.getByText('$1199.00')).toBeInTheDocument()

    // Switch to Plan Change Log tab
    const planChangeTabBtn = screen.getByRole('button', { name: /Plan Change Log/i })
    await act(async () => {
      fireEvent.click(planChangeTabBtn)
    })

    // Expect mock audit logs to be rendered
    expect(screen.getByText('Initial standard subscription')).toBeInTheDocument()
  })
})
