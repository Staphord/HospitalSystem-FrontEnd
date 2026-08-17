import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { BillsPage } from '../BillsPage'
import { billingService } from '@/api/services/billing'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock permissions hook
const mockUsePermissions = vi.fn()
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => mockUsePermissions(),
}))

// Mock billingService
vi.mock('@/api/services/billing', () => ({
  billingService: {
    listAllBills: vi.fn(),
  },
}))

const mockBills = [
  {
    bill_id: 'bill-001',
    patient_id: 'pat-12345678',
    patient_name: 'John Doe',
    patient_number: 'PT-1234',
    total_amount: '150000',
    status: 'unpaid',
    created_at: '2026-08-15T10:00:00Z',
    updated_at: '2026-08-15T10:00:00Z',
    items: [
      { description: 'Doctor Consultation', line_total: '50000' },
      { description: 'Lab Tests', line_total: '100000' },
    ],
  },
  {
    bill_id: 'bill-002',
    patient_id: 'pat-87654321',
    patient_name: 'Jane Smith',
    patient_number: 'PT-5678',
    total_amount: '200000',
    status: 'paid',
    created_at: '2026-08-16T11:00:00Z',
    updated_at: '2026-08-16T12:00:00Z',
    items: [
      { description: 'General Consultation', line_total: '50000' },
      { description: 'Medications', line_total: '150000' },
    ],
  },
]

describe('BillsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePermissions.mockReturnValue({
      roles: ['receptionist'],
      hasRole: (role: string) => role === 'receptionist',
      isHospitalAdmin: () => false,
    })
    vi.mocked(billingService.listAllBills).mockResolvedValue(mockBills as any)
  })

  it('renders insurance verifications tab by default for receptionist', () => {
    render(
      <MemoryRouter>
        <BillsPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('tab', { name: /insurance verifications/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /payment status/i })).toBeInTheDocument()
    expect(screen.getByText('Zuwena Salum')).toBeInTheDocument()
    expect(screen.getByText('Hassan Mwita')).toBeInTheDocument()
  })

  it('allows switching to Payment Status tab and renders billing KPIs and table', async () => {
    render(
      <MemoryRouter>
        <BillsPage />
      </MemoryRouter>
    )

    const paymentTab = screen.getByRole('tab', { name: /payment status/i })
    fireEvent.click(paymentTab)

    await waitFor(() => {
      expect(screen.getByText('Total Bills')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })
  })

  it('renders payment status directly for cashier-only role', async () => {
    mockUsePermissions.mockReturnValue({
      roles: ['cashier'],
      hasRole: (role: string) => role === 'cashier',
      isHospitalAdmin: () => false,
    })

    render(
      <MemoryRouter>
        <BillsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
      expect(screen.getByText('Total Bills')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })

  it('filters payment bills by search query', async () => {
    mockUsePermissions.mockReturnValue({
      roles: ['cashier'],
      hasRole: (role: string) => role === 'cashier',
      isHospitalAdmin: () => false,
    })

    render(
      <MemoryRouter>
        <BillsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search by name or id/i)
    fireEvent.change(searchInput, { target: { value: 'Jane' } })

    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
  })
})
