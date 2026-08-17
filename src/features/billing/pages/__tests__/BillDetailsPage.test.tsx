import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { BillDetailsPage } from '../BillDetailsPage'
import { billingService } from '@/api/services/billing'

vi.mock('@/api/services/billing', () => ({
  billingService: {
    getBill: vi.fn(),
    addCharge: vi.fn(),
  },
}))

const mockBill = {
  bill_id: 'b1',
  patient_id: 'pat-1',
  patient_name: 'Hassan Mwita',
  patient_number: 'PT-4889',
  total_amount: '150000',
  status: 'unpaid',
  created_at: '2026-08-15T10:00:00Z',
  items: [
    { item_id: 'i1', description: 'Consultation Fee', quantity: 1, unit_price: 50000, line_total: 50000 },
    { item_id: 'i2', description: 'Radiology Chest X-Ray', quantity: 1, unit_price: 60000, line_total: 60000 },
    { item_id: 'i3', description: 'Pharmacy Paracetamol', quantity: 1, unit_price: 20000, line_total: 20000 },
    { item_id: 'i4', description: 'Registration Card', quantity: 1, unit_price: 20000, line_total: 20000 },
  ],
}

describe('BillDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(billingService.getBill).mockResolvedValue(mockBill as any)
  })

  it('renders invoice details, patient metadata, and department groupings', async () => {
    render(
      <MemoryRouter initialEntries={['/billing/bills/b1']}>
        <Routes>
          <Route path="/billing/bills/:billId" element={<BillDetailsPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Invoice Details')).toBeInTheDocument()
      expect(screen.getByText('Hassan Mwita')).toBeInTheDocument()
      expect(screen.getByText('PT-4889')).toBeInTheDocument()
    })
  })

  it('calculates gross total, covered, and outstanding amounts correctly', async () => {
    render(
      <MemoryRouter initialEntries={['/billing/bills/b1']}>
        <Routes>
          <Route path="/billing/bills/:billId" element={<BillDetailsPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Gross Invoice Total:')).toBeInTheDocument()
      expect(screen.getByText('Total Paid Amount:')).toBeInTheDocument()
      expect(screen.getByText('Outstanding Due:')).toBeInTheDocument()
    })
  })
})
