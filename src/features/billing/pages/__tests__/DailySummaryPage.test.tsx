import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { DailySummaryPage } from '../DailySummaryPage'

import { billingService } from '@/api/services/billing'

vi.mock('@/api/services/billing', () => ({
  billingService: {
    listAllBills: vi.fn().mockResolvedValue([]),
  },
}))

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
    vi.mocked(billingService.listAllBills).mockResolvedValue([])
  })

  it('renders the daily summary overview cards and export actions', () => {
    render(
      <MemoryRouter>
        <DailySummaryPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Daily Summary')).toBeInTheDocument()
    expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    expect(screen.getByText('Total Transactions')).toBeInTheDocument()
    expect(screen.getByText('Cash')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /refresh data/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /select date range/i })).toBeInTheDocument()
  })
})
