import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProcessingPaymentPage } from '../ProcessingPaymentPage'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('@/api/services/billing', () => ({
  billingService: {
    getBill: vi.fn().mockResolvedValue(null),
    recordPayment: vi.fn().mockResolvedValue({}),
  },
}))

const mockPaymentRow = [
  {
    id: 'b1',
    patientName: 'Hassan Mwita',
    patientNumber: 'PT-4889',
    visitDate: '2026-08-15',
    paymentMethod: 'Insurance',
    insurer: 'Jubilee Insurance',
    paid: 0,
    lineItems: [
      { label: 'General Consultation', amount: 50000 },
    ],
  },
]

describe('ProcessingPaymentPage', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('hf_mock_payment_rows', JSON.stringify(mockPaymentRow))
    vi.clearAllMocks()
  })

  it('renders the insurance payment layout by default', () => {
    render(
      <MemoryRouter initialEntries={['/billing/process/b1']}>
        <Routes>
          <Route path="/billing/process/:billId" element={<ProcessingPaymentPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText(/Hassan Mwita/)).toBeInTheDocument()
    expect(screen.getByText('Itemized Bill')).toBeInTheDocument()
    expect(screen.getByText('Collect Payment')).toBeInTheDocument()
    expect(screen.getByText('Insurer')).toBeInTheDocument()
    expect(screen.getByText(/Claim #/)).toBeInTheDocument()
  })

  it('switches to cash and mobile money variants', () => {
    render(
      <MemoryRouter initialEntries={['/billing/process/b1']}>
        <Routes>
          <Route path="/billing/process/:billId" element={<ProcessingPaymentPage />} />
        </Routes>
      </MemoryRouter>
    )

    const select = screen.getByLabelText('Payment Method')

    fireEvent.change(select, { target: { value: 'cash' } })
    expect(screen.getByText('Amount Tendered')).toBeInTheDocument()
    expect(screen.getByText('Internal Notes (Optional)')).toBeInTheDocument()

    fireEvent.change(select, { target: { value: 'mobile_money' } })
    expect(screen.getByText('M-Pesa Details')).toBeInTheDocument()
    expect(screen.getByText('Transaction ID (Required)')).toBeInTheDocument()
  })

  it('issues a receipt after a successful cash payment', async () => {
    render(
      <MemoryRouter initialEntries={['/billing/process/b1']}>
        <Routes>
          <Route path="/billing/process/:billId" element={<ProcessingPaymentPage />} />
        </Routes>
      </MemoryRouter>
    )

    const select = screen.getByLabelText('Payment Method')
    fireEvent.change(select, { target: { value: 'cash' } })

    fireEvent.change(screen.getByPlaceholderText('Enter cash received'), { target: { value: '150000' } })
    fireEvent.click(screen.getByRole('button', { name: /issue receipt/i }))

    await waitFor(() => {
      expect(screen.getByText('OFFICIAL PAYMENT RECEIPT')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument()
    })
  })
})
