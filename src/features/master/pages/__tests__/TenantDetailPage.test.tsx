import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { TenantDetailPage } from '../TenantDetailPage'
import { masterService } from '@/api/services/master'
import type { Tenant, Subscription, Invoice } from '@/api/types/master'

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
    getTenant: vi.fn().mockResolvedValue({
      id: 1,
      tenant_id: 'aga-khan',
      hospital_name: 'Aga Khan Hospital',
      status: 'active',
      is_active: true,
      city: 'Nairobi',
      country: 'Kenya',
    }),
    listSubscriptions: vi.fn().mockResolvedValue([]),
    listInvoices: vi.fn().mockResolvedValue([]),
    getTenantStats: vi.fn().mockResolvedValue({ user_count: 10 }),
    updateTenant: vi.fn(),
    exportTenantData: vi.fn(),
  },
}))

// Mock monitoring service
vi.mock('@/api/services/monitoring', () => ({
  monitoringService: {
    getAuditLogs: vi.fn().mockResolvedValue([]),
    getTenantAnalytics: vi.fn().mockResolvedValue({
      uptime_trend: [],
      active_users_peak: [],
      storage_growth: [],
      module_usage: [],
      activity_logs: [],
    }),
  },
}))

describe('TenantDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.mocked(masterService.exportTenantData).mockResolvedValue({
      tenant_id: 'aga-khan',
      hospital_name: 'Aga Khan Hospital',
      exported_at: '2026-06-29T12:00:00Z',
      data: {}
    })

    // Mock URL object methods for download simulations
    global.URL.createObjectURL = vi.fn().mockReturnValue('mock-download-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  const renderComponent = (tenantId = 'aga-khan') => {
    return render(
      <MemoryRouter initialEntries={[`/master/tenants/${tenantId}`]}>
        <Routes>
          <Route path="/master/tenants/:id" element={<TenantDetailPage />} />
        </Routes>
      </MemoryRouter>
    )
  }

  it('loads and renders tenant profile information and statistics', async () => {
    renderComponent()

    // Wait for tenant data to load
    await waitFor(() => {
      expect(screen.getAllByText('Aga Khan Hospital')[0]).toBeInTheDocument()
    })

    // Verify overview details
    expect(screen.getAllByText('aga-khan')[0]).toBeInTheDocument()
    expect(screen.getByText('Nairobi, Kenya')).toBeInTheDocument()
    expect(screen.getByText('General Information')).toBeInTheDocument()

    // Verify Danger Zone card is rendered with actions
    expect(screen.getByText('Danger Zone')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /suspend/i })[0]).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /terminate/i })[0]).toBeInTheDocument()
  })

  it('switches tabs and displays read-only system configurations', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getAllByText('Aga Khan Hospital')[0]).toBeInTheDocument()
    })

    // Switch to system config tab
    const configTabBtn = screen.getByRole('button', { name: /system config/i })
    await act(async () => {
      fireEvent.click(configTabBtn)
    })

    expect(screen.getByText('Read-only System Configuration & Settings')).toBeInTheDocument()
    
    // Check that config checkboxes are disabled
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    checkboxes.forEach((cb) => {
      expect(cb).toBeDisabled()
    })
  })

  it('opens suspension modal, accepts reason, and executes API update', async () => {
    vi.mocked(masterService.updateTenant).mockResolvedValue({ tenant_id: 'aga-khan', status: 'suspended' } as unknown as Tenant)

    renderComponent()

    await waitFor(() => {
      expect(screen.getAllByText('Aga Khan Hospital')[0]).toBeInTheDocument()
    })

    // Click Suspend button from the top actions
    const suspendBtns = screen.getAllByRole('button', { name: /suspend/i })
    await act(async () => {
      fireEvent.click(suspendBtns[0])
    })

    // Assert suspend modal is open
    expect(screen.getByText('Confirm Hospital Suspension')).toBeInTheDocument()

    // Type reason in textarea
    const reasonTextarea = screen.getByPlaceholderText(/enter reason for suspending/i)
    fireEvent.change(reasonTextarea, { target: { value: 'Payment overdue' } })

    const confirmBtn = screen.getByRole('button', { name: /confirm suspend/i })
    await act(async () => {
      fireEvent.click(confirmBtn)
    })

    // Assert updateTenant was called
    await waitFor(() => {
      expect(masterService.updateTenant).toHaveBeenCalledWith(
        'aga-khan',
        expect.objectContaining({ status: 'suspended', suspension_reason: 'Payment overdue' })
      )
    })
  })

  it('navigates through the 3-step termination wizard correctly', async () => {
    vi.mocked(masterService.updateTenant).mockResolvedValue({ tenant_id: 'aga-khan', status: 'terminated' } as unknown as Tenant)

    const { container } = renderComponent()

    await waitFor(() => {
      expect(screen.getAllByText('Aga Khan Hospital')[0]).toBeInTheDocument()
    })

    // Click Terminate button to trigger the wizard
    const terminateBtns = screen.getAllByRole('button', { name: /terminate/i })
    await act(async () => {
      fireEvent.click(terminateBtns[0])
    })

    // --- STEP 1 ---
    expect(screen.getByText('Terminate Hospital Account - Step 1 of 3')).toBeInTheDocument()
    
    // Type hospital name to unlock Next
    const confirmInput = screen.getByPlaceholderText('Enter hospital name exactly...')
    fireEvent.change(confirmInput, { target: { value: 'Aga Khan Hospital' } })

    const nextBtn = screen.getByRole('button', { name: 'Next Step' })
    expect(nextBtn).not.toBeDisabled()
    
    await act(async () => {
      fireEvent.click(nextBtn)
    })

    // --- STEP 2 ---
    expect(screen.getByText('Terminate Hospital Account - Step 2 of 3')).toBeInTheDocument()
    
    // Click download button to export data
    const exportBtn = screen.getByRole('button', { name: /Generate & Download Backup Export/i })
    await act(async () => {
      fireEvent.click(exportBtn)
    })
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Export Downloaded' })).toBeInTheDocument()
    })

    // Tick the verification checkbox
    const chkVerify = container.querySelector('#chk_verify_backup')
    expect(chkVerify).not.toBeNull()
    await act(async () => {
      fireEvent.click(chkVerify!)
    })

    const nextStep2Btn = screen.getByRole('button', { name: 'Next Step' })
    expect(nextStep2Btn).not.toBeDisabled()
    await act(async () => {
      fireEvent.click(nextStep2Btn)
    })

    // --- STEP 3 ---
    expect(screen.getByText('Terminate Hospital Account - Step 3 of 3')).toBeInTheDocument()

    // Select the consent checkboxes
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    await act(async () => {
      fireEvent.click(checkboxes[0])
      fireEvent.click(checkboxes[1])
    })

    const finalTerminateBtn = screen.getByRole('button', { name: 'Terminate Hospital' })
    expect(finalTerminateBtn).not.toBeDisabled()

    await act(async () => {
      fireEvent.click(finalTerminateBtn)
    })

    // Assert updateTenant was called to terminate status
    await waitFor(() => {
      expect(masterService.updateTenant).toHaveBeenCalledWith(
        'aga-khan',
        expect.objectContaining({ status: 'terminated' })
      )
    })
  })

  it('switches to subscription and invoices tabs and displays correct cross-links', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getAllByText('Aga Khan Hospital')[0]).toBeInTheDocument()
    })

    // Click Subscription Tab
    const subTabBtn = screen.getByRole('button', { name: /subscription/i })
    await act(async () => {
      fireEvent.click(subTabBtn)
    })

    // Verify Subscription Plan Details is present
    expect(screen.getByText('Subscription Plan Details')).toBeInTheDocument()
    
    // Verify Link exists
    const subLink = screen.getByRole('link', { name: /view subscription logs/i })
    expect(subLink).toBeInTheDocument()
    expect(subLink.getAttribute('href')).toBe('/master/subscriptions?tenant_id=aga-khan')

    // Click Invoices Tab
    const invoiceTabBtn = screen.getByRole('button', { name: /invoices/i })
    await act(async () => {
      fireEvent.click(invoiceTabBtn)
    })

    // Verify Invoices and Payments is present
    expect(screen.getByText('Invoices and Payments')).toBeInTheDocument()

    // Verify Link exists
    const invoiceLink = screen.getByRole('link', { name: /view invoices ledger/i })
    expect(invoiceLink).toBeInTheDocument()
    expect(invoiceLink.getAttribute('href')).toBe('/master/invoices?tenant_id=aga-khan')
  })

  it('renders "-" when tenant fields are empty', async () => {
    vi.mocked(masterService.getTenant).mockResolvedValueOnce({
      id: 1,
      tenant_id: 'aga-khan',
      hospital_name: 'Aga Khan Hospital',
      status: 'active',
      is_active: true,
      city: '',
      country: '',
      address: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      billing_email: '',
      data_region: '',
    })
    vi.mocked(masterService.listSubscriptions).mockResolvedValueOnce([
      {
        id: 'sub-1',
        tenant_id: 'aga-khan',
        plan_name: 'Premium',
        status: 'active',
        subscription_id: 'sub-id-1',
        start_date: '',
        end_date: '',
      } as unknown as Subscription,
    ])
    vi.mocked(masterService.listInvoices).mockResolvedValueOnce([
      {
        id: 'inv-1',
        invoice_id: 'inv-num-1',
        tenant_id: 'aga-khan',
        description: 'Invoice 1',
        amount: 100,
        due_date: '',
        status: 'paid',
      } as unknown as Invoice,
    ])

    renderComponent()

    await waitFor(() => {
      expect(screen.getAllByText('Aga Khan Hospital')[0]).toBeInTheDocument()
    })

    // Validate header empty fields fallback
    expect(screen.getByText(/-, -/)).toBeInTheDocument()

    // Validate general info fields fallback
    const dashes = screen.getAllByText('-')
    expect(dashes.length).toBeGreaterThanOrEqual(5)

    // Switch to subscription tab
    const subTabBtn = screen.getByRole('button', { name: /subscription/i })
    await act(async () => {
      fireEvent.click(subTabBtn)
    })

    // Validate subscription start date fallback
    expect(screen.getByRole('cell', { name: '-' })).toBeInTheDocument()

    // Switch to invoices tab
    const invoiceTabBtn = screen.getByRole('button', { name: /invoices/i })
    await act(async () => {
      fireEvent.click(invoiceTabBtn)
    })

    // Validate invoice due date fallback
    expect(screen.getByRole('cell', { name: '-' })).toBeInTheDocument()
  })
})

