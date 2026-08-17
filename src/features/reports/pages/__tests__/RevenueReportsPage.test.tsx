import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { RevenueReportsPage } from '../RevenueReportsPage'
import { adminService } from '@/api/services/admin'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock adminService
vi.mock('@/api/services/admin', () => ({
  adminService: {
    getRevenueReport: vi.fn().mockResolvedValue({
      total_revenue: 15000000,
      total_cash: 9000000,
      total_insurance: 6000000,
      breakdown: [
        {
          department: 'Pharmacy',
          total_revenue: 5000000,
          cash_revenue: 3000000,
          insurance_revenue: 2000000,
          transaction_count: 120,
        },
        {
          department: 'Laboratory',
          total_revenue: 4000000,
          cash_revenue: 2500000,
          insurance_revenue: 1500000,
          transaction_count: 95,
        },
      ],
    }),
  },
}))

describe('RevenueReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(adminService.getRevenueReport).mockResolvedValue({
      total_revenue: 15000000,
      total_cash: 9000000,
      total_insurance: 6000000,
      breakdown: [
        {
          department: 'Pharmacy',
          total_revenue: 5000000,
          cash_revenue: 3000000,
          insurance_revenue: 2000000,
          transaction_count: 120,
        },
        {
          department: 'Laboratory',
          total_revenue: 4000000,
          cash_revenue: 2500000,
          insurance_revenue: 1500000,
          transaction_count: 95,
        },
      ],
    } as any)
  })

  it('renders revenue overview, collection breakdown, and financial summary cards', async () => {
    render(
      <MemoryRouter>
        <RevenueReportsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Revenue by Department')).toBeInTheDocument()
      expect(screen.getByText('Cash vs Insurance Breakdown')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /export pdf/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument()
    })
  })
})
