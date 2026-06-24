import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { OverdueAccountsPage } from '../OverdueAccountsPage'
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

describe('OverdueAccountsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders overdue accounts list and verifies aging tiers', async () => {
    // Generate dates representing different delinquency periods
    const now = new Date()

    const tier1Date = new Date(now.getTime() - 1000 * 3600 * 24 * 3).toISOString().split('T')[0] // 3 days ago (Tier 1)
    const tier2Date = new Date(now.getTime() - 1000 * 3600 * 24 * 10).toISOString().split('T')[0] // 10 days ago (Tier 2)
    const tier3Date = new Date(now.getTime() - 1000 * 3600 * 24 * 20).toISOString().split('T')[0] // 20 days ago (Tier 3)
    const tier4Date = new Date(now.getTime() - 1000 * 3600 * 24 * 40).toISOString().split('T')[0] // 40 days ago (Tier 4)

    const mockInvoices = [
      {
        id: 'inv-grace',
        invoice_id: 'inv-grace',
        tenant_id: 'aga-khan',
        amount: 1000,
        amount_paid: 0,
        status: 'overdue',
        due_date: tier1Date,
      },
      {
        id: 'inv-late',
        invoice_id: 'inv-late',
        tenant_id: 'nairobi-hosp',
        amount: 1200,
        amount_paid: 0,
        status: 'overdue',
        due_date: tier2Date,
      },
      {
        id: 'inv-suspend',
        invoice_id: 'inv-suspend',
        tenant_id: 'aga-khan',
        amount: 2500,
        amount_paid: 0,
        status: 'overdue',
        due_date: tier3Date,
      },
      {
        id: 'inv-critical',
        invoice_id: 'inv-critical',
        tenant_id: 'nairobi-hosp',
        amount: 3000,
        amount_paid: 0,
        status: 'overdue',
        due_date: tier4Date,
      },
    ]

    const mockTenants = [
      {
        tenant_id: 'aga-khan',
        hospital_name: 'Aga Khan Hospital',
        status: 'active',
        grace_days: 15,
      },
      {
        tenant_id: 'nairobi-hosp',
        hospital_name: 'Nairobi Hospital',
        status: 'active',
        grace_days: 10,
      },
    ]

    vi.mocked(masterService.listInvoices).mockResolvedValue(mockInvoices)
    vi.mocked(masterService.listTenants).mockResolvedValue(mockTenants)

    render(
      <MemoryRouter>
        <OverdueAccountsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Delinquency Matrix Ledger')).toBeInTheDocument()
    })

    // Verify presence of invoices
    await waitFor(() => {
      expect(screen.getByText('#inv-grace')).toBeInTheDocument()
      expect(screen.getByText('#inv-late')).toBeInTheDocument()
      expect(screen.getByText('#inv-suspend')).toBeInTheDocument()
      expect(screen.getByText('#inv-critical')).toBeInTheDocument()
    })

    // Verify correct days overdue are displayed
    expect(screen.getByText('3 days overdue')).toBeInTheDocument()
    expect(screen.getByText('10 days overdue')).toBeInTheDocument()
    expect(screen.getByText('20 days overdue')).toBeInTheDocument()
    expect(screen.getByText('40 days overdue')).toBeInTheDocument()

    // Verify delinquency tiers match ranges
    expect(screen.getByText('1-7 days')).toBeInTheDocument()
    expect(screen.getByText('8-14 days')).toBeInTheDocument()
    expect(screen.getByText('15-30 days')).toBeInTheDocument()
    expect(screen.getByText('>30 days')).toBeInTheDocument()
  })
})
