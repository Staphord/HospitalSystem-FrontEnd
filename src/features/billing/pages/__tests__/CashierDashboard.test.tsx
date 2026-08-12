import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { CashierDashboard } from '../CashierDashboard'

describe('CashierDashboard', () => {
  it('renders cashier dashboard with financial stat cards and queues', () => {
    render(
      <MemoryRouter>
        <CashierDashboard />
      </MemoryRouter>
    )

    // Verify page header
    expect(screen.getByText('Cashier Portal')).toBeInTheDocument()
    expect(screen.getByText('My Dashboard')).toBeInTheDocument()

    // Verify stats cards
    expect(screen.getByText('Revenue Today')).toBeInTheDocument()
    expect(screen.getByText('Pending Bills')).toBeInTheDocument()
    expect(screen.getByText('Insurance Claims')).toBeInTheDocument()

    // Verify pending queue and completed transactions
    expect(screen.getByText('Bills Awaiting Payment')).toBeInTheDocument()
    expect(screen.getByText('Recent Transactions')).toBeInTheDocument()
  })

  it('renders revenue breakdown progress bars', () => {
    render(
      <MemoryRouter>
        <CashierDashboard />
      </MemoryRouter>
    )

    // Verify breakdown panel
    expect(screen.getByText('Revenue Breakdown')).toBeInTheDocument()
  })
})
