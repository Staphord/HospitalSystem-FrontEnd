import { render, screen, fireEvent } from '@testing-library/react'
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
    expect(screen.getByText('Total Collected')).toBeInTheDocument()
    expect(screen.getByText('Pending Claims')).toBeInTheDocument()
    expect(screen.getByText('Patient Visits')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /print report/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export pdf/i })).toBeInTheDocument()
  })
})
