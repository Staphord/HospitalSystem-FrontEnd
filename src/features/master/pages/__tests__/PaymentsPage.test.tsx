import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PaymentsPage } from '../PaymentsPage'
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
  },
}))

describe('PaymentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const mockInvoices = [
    {
      id: 'inv-1',
      tenant_id: 'aga-khan',
      amount: 1000,
      amount_paid: 200,
      status: 'partially_paid',
      due_date: '2026-07-01',
      payment_date: '2026-06-10T00:00:00Z',
      payment_method: 'Bank Transfer',
      reference_number: 'REF-BANK-001',
    },
    {
      id: 'inv-2',
      tenant_id: 'nairobi-hosp',
      amount: 1200,
      amount_paid: 1200,
      status: 'paid',
      due_date: '2026-06-15',
      payment_date: '2026-06-12T00:00:00Z',
      payment_method: 'Credit Card',
      reference_number: 'REF-CARD-002',
    },
    {
      id: 'inv-3',
      tenant_id: 'aga-khan',
      amount: 500,
      status: 'unpaid',
      due_date: '2026-07-15',
    },
  ]

  const mockTenants = [
    {
      tenant_id: 'aga-khan',
      hospital_name: 'Aga Khan Hospital',
      status: 'active',
      currency: 'USD',
    },
    {
      tenant_id: 'nairobi-hosp',
      hospital_name: 'Nairobi Hospital',
      status: 'active',
      currency: 'KES',
    },
  ]

  it('renders payments page and lists processed payments only', async () => {
    vi.mocked(masterService.listInvoices).mockResolvedValue(mockInvoices as any)
    vi.mocked(masterService.listTenants).mockResolvedValue(mockTenants as any)

    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>
    )

    // Wait for data fetching to complete
    await waitFor(() => {
      expect(screen.getAllByText('Aga Khan Hospital').length).toBeGreaterThan(0)
    })

    // Check header description
    expect(screen.getByText(/Monitor subscription renewals ledger/i)).toBeInTheDocument()

    // Assert only paid/partially paid invoices are displayed in the payments list
    expect(screen.getByText('#REF-BANK-001')).toBeInTheDocument()
    expect(screen.getByText('#REF-CARD-002')).toBeInTheDocument()
    expect(screen.queryByText('#inv-3')).not.toBeInTheDocument()

    // Check that currency symbols and amount values are shown correctly
    expect(screen.getByText(/USD 200.00/i)).toBeInTheDocument()
    expect(screen.getByText(/KES 1,200.00/i)).toBeInTheDocument()
  })

  it('renders payment method icons correctly', async () => {
    vi.mocked(masterService.listInvoices).mockResolvedValue([
      {
        id: 'inv-1',
        tenant_id: 'aga-khan',
        amount: 1000,
        amount_paid: 200,
        status: 'partially_paid',
        payment_method: 'Bank Transfer',
      },
      {
        id: 'inv-2',
        tenant_id: 'nairobi-hosp',
        amount: 1200,
        amount_paid: 1200,
        status: 'paid',
        payment_method: 'Credit Card',
      },
      {
        id: 'inv-4',
        tenant_id: 'aga-khan',
        amount: 300,
        amount_paid: 300,
        status: 'paid',
        payment_method: 'Mobile Money',
      },
      {
        id: 'inv-5',
        tenant_id: 'aga-khan',
        amount: 150,
        amount_paid: 150,
        status: 'paid',
        payment_method: 'Cash',
      },
    ] as any)
    vi.mocked(masterService.listTenants).mockResolvedValue(mockTenants as any)

    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Bank Transfer')).toBeInTheDocument()
    })

    // Verify material icons rendered based on payment methods
    expect(screen.getByText('account_balance')).toBeInTheDocument()
    expect(screen.getByText('credit_card')).toBeInTheDocument()
    expect(screen.getByText('phone_iphone')).toBeInTheDocument()
    expect(screen.getByText('payments')).toBeInTheDocument()
  })

  it('renders revenue chart and metric values', async () => {
    vi.mocked(masterService.listInvoices).mockResolvedValue(mockInvoices as any)
    vi.mocked(masterService.listTenants).mockResolvedValue(mockTenants as any)

    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Monthly Revenue Growth Performance')).toBeInTheDocument()
    })

    // Assert that metric labels are visible
    expect(screen.getByText('Month to Date Revenue')).toBeInTheDocument()
    expect(screen.getByText('Year to Date Revenue')).toBeInTheDocument()
    expect(screen.getByText('Outstanding Overdue Balance')).toBeInTheDocument()
  })

  it('filters payments lists by search query', async () => {
    vi.mocked(masterService.listInvoices).mockResolvedValue(mockInvoices as any)
    vi.mocked(masterService.listTenants).mockResolvedValue(mockTenants as any)

    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText('Aga Khan Hospital').length).toBeGreaterThan(0)
    })

    const searchInput = screen.getByPlaceholderText(/Search by Hospital, Invoice ID, Reference/i)
    
    // Filter by reference code
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'BANK' } })
    })

    expect(screen.getByText('#REF-BANK-001')).toBeInTheDocument()
    expect(screen.queryByText('#REF-CARD-002')).not.toBeInTheDocument()
  })

  it('filters payments list by dropdowns', async () => {
    vi.mocked(masterService.listInvoices).mockResolvedValue(mockInvoices as any)
    vi.mocked(masterService.listTenants).mockResolvedValue(mockTenants as any)

    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText('Aga Khan Hospital').length).toBeGreaterThan(0)
    })

    // Filter by hospital dropdown
    const selectElements = screen.getAllByRole('combobox')
    const selectHospital = selectElements[0]
    const selectMethod = selectElements[1]

    await act(async () => {
      fireEvent.change(selectHospital, { target: { value: 'nairobi-hosp' } })
    })

    expect(screen.getByText('#REF-CARD-002')).toBeInTheDocument()
    expect(screen.queryByText('#REF-BANK-001')).not.toBeInTheDocument()

    // Reset hospital filter
    await act(async () => {
      fireEvent.change(selectHospital, { target: { value: '' } })
    })

    // Filter by method
    await act(async () => {
      fireEvent.change(selectMethod, { target: { value: 'Mobile Money' } })
    })
    expect(screen.getByText('No recorded payments matching your filters.')).toBeInTheDocument()
  })

  it('downloads audit ledger when clicking export button', async () => {
    vi.mocked(masterService.listInvoices).mockResolvedValue(mockInvoices as any)
    vi.mocked(masterService.listTenants).mockResolvedValue(mockTenants as any)

    const appendChildSpy = vi.spyOn(document.body, 'appendChild')
    const removeChildSpy = vi.spyOn(document.body, 'removeChild')

    render(
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Export Audit Ledger')).toBeInTheDocument()
    })

    const exportBtn = screen.getByRole('button', { name: /Export Audit Ledger/i })
    await act(async () => {
      fireEvent.click(exportBtn)
    })

    expect(appendChildSpy).toHaveBeenCalled()
    
    // Find the specific call appending the anchor element
    const anchorCall = appendChildSpy.mock.calls.find(
      ([node]) => node instanceof HTMLElement && node.tagName === 'A'
    )
    expect(anchorCall).toBeDefined()
    const appendedEl = anchorCall![0] as HTMLAnchorElement
    
    expect(appendedEl.tagName).toBe('A')
    expect(appendedEl.getAttribute('href')).toContain('data:text/csv')
    expect(appendedEl.getAttribute('download')).toContain('platform_payments_')
    expect(removeChildSpy).toHaveBeenCalledWith(appendedEl)

    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })
})
