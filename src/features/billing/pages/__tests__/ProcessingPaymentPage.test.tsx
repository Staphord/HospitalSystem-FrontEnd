import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ProcessingPaymentPage } from '../ProcessingPaymentPage'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe('ProcessingPaymentPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders the insurance payment layout by default', () => {
    render(
      <MemoryRouter>
        <ProcessingPaymentPage />
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
      <MemoryRouter>
        <ProcessingPaymentPage />
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

  it('issues a receipt after a successful cash payment', () => {
    render(
      <MemoryRouter>
        <ProcessingPaymentPage />
      </MemoryRouter>
    )

    const select = screen.getByLabelText('Payment Method')
    fireEvent.change(select, { target: { value: 'cash' } })

    fireEvent.change(screen.getByPlaceholderText('Enter cash received'), { target: { value: '150000' } })
    fireEvent.click(screen.getByRole('button', { name: /issue receipt/i }))

    expect(screen.getByText('OFFICIAL PAYMENT RECEIPT')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument()
  })
})
