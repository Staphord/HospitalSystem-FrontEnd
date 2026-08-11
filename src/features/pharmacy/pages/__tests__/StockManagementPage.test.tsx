import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { StockManagementPage } from '../StockManagementPage'
import { pharmacyService } from '@/api/services/pharmacy'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/api/services/pharmacy', () => ({
  pharmacyService: {
    getInventory: vi.fn(),
    createInventoryItem: vi.fn(),
    stockInItem: vi.fn(),
    stockOutItem: vi.fn(),
  },
}))

const mockInventoryData = {
  total: 2,
  items: [
    {
      inventory_id: 'inv-1',
      drug_name: 'Amoxicillin 500mg',
      brand_name: 'Amoxil',
      category: 'Antibiotic',
      unit: 'Capsule',
      quantity_in_stock: 450,
      reorder_level: 100,
      unit_cost: 0.5,
      is_active: true,
      last_restocked_at: '2026-08-01T00:00:00Z',
    },
    {
      inventory_id: 'inv-2',
      drug_name: 'Paracetamol 500mg',
      brand_name: 'Panadol',
      category: 'Analgesic',
      unit: 'Tablet',
      quantity_in_stock: 12,
      reorder_level: 50,
      unit_cost: 0.1,
      is_active: true,
      last_restocked_at: '2026-08-01T00:00:00Z',
    },
  ],
}

describe('StockManagementPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(pharmacyService.getInventory).mockResolvedValue(mockInventoryData as any)
  })

  it('renders stock management dashboard metrics and inventory table', async () => {
    render(
      <MemoryRouter>
        <StockManagementPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(pharmacyService.getInventory).toHaveBeenCalled()
      expect(screen.getByText('Amoxicillin 500mg')).toBeInTheDocument()
      expect(screen.getByText('Paracetamol 500mg')).toBeInTheDocument()
      expect(screen.getAllByText(/low stock/i).length).toBeGreaterThan(0)
    })
  })

  it('filters stock list by status filter dropdown', async () => {
    render(
      <MemoryRouter>
        <StockManagementPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Amoxicillin 500mg')).toBeInTheDocument()
    })

    const statusSelect = screen.getByDisplayValue('Stock Status')
    fireEvent.change(statusSelect, { target: { value: 'low_stock' } })

    expect(pharmacyService.getInventory).toHaveBeenCalledWith(expect.objectContaining({
      low_stock: true,
    }))
  })

  it('opens Add Drug modal when Add New Drug button is clicked', async () => {
    render(
      <MemoryRouter>
        <StockManagementPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Amoxicillin 500mg')).toBeInTheDocument()
    })

    const addDrugBtn = screen.getByRole('button', { name: /add new drug/i })
    fireEvent.click(addDrugBtn)

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText(/add new drug \/ medication/i)).toBeInTheDocument()
    })
  })
})
