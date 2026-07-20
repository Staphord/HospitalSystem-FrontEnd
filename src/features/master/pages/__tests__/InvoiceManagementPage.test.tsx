import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { InvoiceManagementPage } from '../InvoiceManagementPage'
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
    listInvoices: vi.fn(),
    listTenants: vi.fn(),
    listSubscriptions: vi.fn(),
    listPlans: vi.fn(),
    updateInvoice: vi.fn(),
    createInvoice: vi.fn(),
    recordPayment: vi.fn(),
  },
}))

describe('InvoiceManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const mockInvoices = [
    {
      id: 'inv-1',
      invoice_id: 'inv-1',
      tenant_id: 'aga-khan',
      amount: 1000,
      amount_paid: 200,
      status: 'unpaid',
      due_date: '2026-07-01',
    },
    {
      id: 'inv-2',
      invoice_id: 'inv-2',
      tenant_id: 'nairobi-hosp',
      amount: 1200,
      amount_paid: 1200,
      status: 'paid',
      due_date: '2026-06-15',
    },
  ]

  const mockTenants = [
    {
      tenant_id: 'aga-khan',
      hospital_name: 'Aga Khan Hospital',
      status: 'active',
    },
    {
      tenant_id: 'nairobi-hosp',
      hospital_name: 'Nairobi Hospital',
      status: 'active',
    },
  ]

  const mockSubscriptions = [
    {
      id: 'sub-1',
      subscription_id: 'sub-1',
      tenant_id: 'aga-khan',
      plan_name: 'Premium',
      status: 'active',
    },
  ]

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

  it('renders invoices list and elements', async () => {
    vi.mocked(masterService.listInvoices).mockResolvedValue(mockInvoices)
    vi.mocked(masterService.listTenants).mockResolvedValue(mockTenants)
    vi.mocked(masterService.listSubscriptions).mockResolvedValue(mockSubscriptions)
    vi.mocked(masterService.listPlans).mockResolvedValue(mockPlans)

    render(
      <MemoryRouter>
        <InvoiceManagementPage />
      </MemoryRouter>
    )

    expect(screen.getByPlaceholderText(/search by hospital name, invoice number/i)).toBeInTheDocument()

    // Wait for the invoice list to load
    await waitFor(() => {
      expect(screen.getByText('Aga Khan Hospital')).toBeInTheDocument()
      expect(screen.getByText('Nairobi Hospital')).toBeInTheDocument()
    })
  })

  it('filters invoice list by search query input', async () => {
    vi.mocked(masterService.listInvoices).mockResolvedValue(mockInvoices)
    vi.mocked(masterService.listTenants).mockResolvedValue(mockTenants)
    vi.mocked(masterService.listSubscriptions).mockResolvedValue(mockSubscriptions)
    vi.mocked(masterService.listPlans).mockResolvedValue(mockPlans)

    render(
      <MemoryRouter>
        <InvoiceManagementPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Aga Khan Hospital')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search by hospital name/i)
    fireEvent.change(searchInput, { target: { value: 'Nairobi' } })

    // Nairobi Hospital should remain, Aga Khan should be filtered out
    expect(screen.getByText('Nairobi Hospital')).toBeInTheDocument()
    expect(screen.queryByText('Aga Khan Hospital')).not.toBeInTheDocument()
  })

  it('opens record payment modal and calculates balance badges', async () => {
    const mockRecordPayment = vi.fn().mockResolvedValue({ success: true })

    vi.mocked(masterService.listInvoices).mockResolvedValue(mockInvoices)
    vi.mocked(masterService.listTenants).mockResolvedValue(mockTenants)
    vi.mocked(masterService.listSubscriptions).mockResolvedValue(mockSubscriptions)
    vi.mocked(masterService.listPlans).mockResolvedValue(mockPlans)
    vi.mocked(masterService.recordPayment).mockImplementation(mockRecordPayment)

    const { container } = render(
      <MemoryRouter>
        <InvoiceManagementPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Aga Khan Hospital')).toBeInTheDocument()
    })

    const recordPaymentBtn = screen.getByRole('button', { name: /record payment/i })
    await act(async () => {
      fireEvent.click(recordPaymentBtn)
    })

    // Assert that record payment modal has opened
    expect(screen.getByText('Record Invoice Payment')).toBeInTheDocument()

    // Assert the default remaining amount is autofilled to 800 (1000 total - 200 paid)
    const amountLabel = screen.getByText('Payment Amount ($ USD)')
    const amountInput = amountLabel.parentElement?.querySelector('input') as HTMLInputElement
    expect(amountInput.value).toBe('800')

    // Expect paid in full label since 800 matches remaining balance
    expect(screen.getByText('Paid in Full')).toBeInTheDocument()

    // Change amount to 400 to assert partial payment badge
    fireEvent.change(amountInput, { target: { value: '400' } })
    expect(screen.getByText(/partial payment: \$400.00 remaining/i)).toBeInTheDocument()

    const channelLabel = screen.getByText('Payment Channel / Method')
    const selectEl = channelLabel.parentElement?.querySelector('select') as HTMLSelectElement
    fireEvent.change(selectEl, { target: { value: 'Bank Transfer' } })

    const refLabel = screen.getByText('Reference / Transaction Number')
    const refInput = refLabel.parentElement?.querySelector('input') as HTMLInputElement
    fireEvent.change(refInput, { target: { value: 'TXN-ABC-123' } })

    // Submit form
    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement
    await act(async () => {
      fireEvent.click(submitBtn)
    })

    await waitFor(() => {
      expect(mockRecordPayment).toHaveBeenCalledWith('aga-khan', {
        invoice_id: 'inv-1',
        amount: 400,
        payment_method: 'Bank Transfer',
        reference_number: 'TXN-ABC-123',
      })
    })
  })

  it('opens generate invoice modal and autofills tenant plan defaults', async () => {
    const mockCreateInvoice = vi.fn().mockResolvedValue({ id: 'inv-new', status: 'unpaid' })

    vi.mocked(masterService.listInvoices).mockResolvedValue(mockInvoices)
    vi.mocked(masterService.listTenants).mockResolvedValue(mockTenants)
    vi.mocked(masterService.listSubscriptions).mockResolvedValue(mockSubscriptions)
    vi.mocked(masterService.listPlans).mockResolvedValue(mockPlans)
    vi.mocked(masterService.createInvoice).mockImplementation(mockCreateInvoice)

    const { container } = render(
      <MemoryRouter>
        <InvoiceManagementPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Aga Khan Hospital')).toBeInTheDocument()
    })

    const generateBtn = screen.getByRole('button', { name: /\+ generate invoice/i })
    await act(async () => {
      fireEvent.click(generateBtn)
    })

    // Assert generate invoice modal opened
    expect(screen.getByText('Generate New Invoice')).toBeInTheDocument()

    // Select Hospital dropdown
    const selectHospitalLabel = screen.getByText('Select Hospital')
    const selectHospital = selectHospitalLabel.parentElement?.querySelector('select') as HTMLSelectElement
    fireEvent.change(selectHospital, { target: { value: 'aga-khan' } })

    // Check autofilled fields based on premium plan (1199)
    const amountLabel = screen.getByText('Billing Amount ($ USD)')
    const amountInput = amountLabel.parentElement?.querySelector('input') as HTMLInputElement
    expect(amountInput.value).toBe('1199')

    const descLabel = screen.getByText('Description / Memo')
    const descInput = descLabel.parentElement?.querySelector('input') as HTMLInputElement
    expect(descInput.value).toContain('Premium Plan Monthly Subscription')

    // Submit form
    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement
    await act(async () => {
      fireEvent.click(submitBtn)
    })

    await waitFor(() => {
      expect(mockCreateInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: 'aga-khan',
          amount: 1199,
          status: 'unpaid',
        })
      )
    })
  })
})
