import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PrescriptionQueuePage } from '../PrescriptionQueuePage'
import { pharmacyService, type PharmacyQueueItem } from '@/api/services/pharmacy'

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
    getQueue: vi.fn(),
    checkDrugInteractions: vi.fn(),
  },
}))

const mockQueueData: PharmacyQueueItem[] = [
  {
    queue_id: 'q-101',
    queue_number: 'PH-101',
    priority: 'urgent',
    status: 'waiting',
    visit_id: 'v-100',
    visit_number: 'VIS-100',
    patient_id: 'pat-100',
    patient_name: 'Grace Hopper',
    payment_type: 'cash',
    billing_cleared: true,
    prescription_count: 3,
    called_at: null,
    created_at: '2026-08-11T10:00:00Z',
  },
  {
    queue_id: 'q-102',
    queue_number: 'PH-102',
    priority: 'non_urgent',
    status: 'waiting',
    visit_id: 'v-101',
    visit_number: 'VIS-101',
    patient_id: 'pat-101',
    patient_name: 'Alan Turing',
    payment_type: 'insurance',
    billing_cleared: false,
    prescription_count: 1,
    called_at: null,
    created_at: '2026-08-11T10:15:00Z',
  },
]

describe('PrescriptionQueuePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(pharmacyService.getQueue).mockResolvedValue({ date: '2026-08-11', queue: mockQueueData })
    vi.mocked(pharmacyService.checkDrugInteractions).mockResolvedValue({ alert_count: 0 } as any)
  })

  it('renders prescription queue list and summary cards', async () => {
    render(
      <MemoryRouter>
        <PrescriptionQueuePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(pharmacyService.getQueue).toHaveBeenCalledWith('waiting')
      expect(screen.getByText('Grace Hopper')).toBeInTheDocument()
      expect(screen.getByText('Alan Turing')).toBeInTheDocument()
    })
  })

  it('filters queue list by billing clearance status filter select', async () => {
    render(
      <MemoryRouter>
        <PrescriptionQueuePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Grace Hopper')).toBeInTheDocument()
    })

    const filterSelect = screen.getByDisplayValue('Billing: All')
    fireEvent.change(filterSelect, { target: { value: 'cleared' } })

    expect(screen.getByText('Grace Hopper')).toBeInTheDocument()
    expect(screen.queryByText('Alan Turing')).not.toBeInTheDocument()
  })

  it('filters queue dynamically by patient name search query', async () => {
    render(
      <MemoryRouter>
        <PrescriptionQueuePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Grace Hopper')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/patient name or visit #/i)
    fireEvent.change(searchInput, { target: { value: 'Turing' } })

    expect(screen.getByText('Alan Turing')).toBeInTheDocument()
    expect(screen.queryByText('Grace Hopper')).not.toBeInTheDocument()
  })

  it('navigates to dispense prescription page when clicking dispense action', async () => {
    render(
      <MemoryRouter>
        <PrescriptionQueuePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Grace Hopper')).toBeInTheDocument()
    })

    const dispenseBtn = screen.getByRole('button', { name: /dispense prescription/i })
    fireEvent.click(dispenseBtn)

    expect(mockNavigate).toHaveBeenCalledWith('/pharmacy/queue/v-100/dispense')
  })
})
