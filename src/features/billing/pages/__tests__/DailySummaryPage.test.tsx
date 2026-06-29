import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { DailySummaryPage } from '../DailySummaryPage'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}))

describe('DailySummaryPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders the open daily summary shell', () => {
    render(
      <MemoryRouter>
        <DailySummaryPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Daily Summary')).toBeInTheDocument()
    expect(screen.getByText('Today — 09 June 2026')).toBeInTheDocument()
    expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    expect(screen.getByText('Cash Reconciliation')).toBeInTheDocument()
    expect(screen.getByText('All Transactions Today')).toBeInTheDocument()
    expect(screen.getByText('Amani Khatibu')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit end-of-day report/i })).toBeInTheDocument()
  })

  it('switches to the submitted report state after submission', () => {
    render(
      <MemoryRouter>
        <DailySummaryPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: /submit end-of-day report/i }))

    expect(screen.getByText(/Report submitted — 17:32/i)).toBeInTheDocument()
    expect(screen.getByText('Finalized')).toBeInTheDocument()
    expect(screen.getByText('Reconciliation Locked')).toBeInTheDocument()
    expect(screen.getByText('End-of-Day Ledger')).toBeInTheDocument()
  })
})
