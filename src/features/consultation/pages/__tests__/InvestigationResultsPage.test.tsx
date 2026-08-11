import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { InvestigationResultsPage } from '../InvestigationResultsPage'
import { consultationService } from '@/api/services/consultation'

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

vi.mock('@/api/services/consultation', () => ({
  consultationService: {
    getInvestigationResults: vi.fn(),
  },
}))

const mockResultsData = [
  {
    id: 'ord-1',
    request_type: 'lab',
    patient: {
      id: 'pat-1',
      patient_number: 'PAT-001',
      full_name: 'Bob Ross',
    },
    test_name: 'Full Blood Count',
    status: 'ready',
    ordered_at: '2026-07-14T09:00:00Z',
    completed_at: '2026-07-14T10:00:00Z',
    result_values: 'WBC 11.2',
    reference_range: '4.0 - 11.0',
    visit_id: 'v-1',
  },
  {
    id: 'ord-2',
    request_type: 'radiology',
    patient: {
      id: 'pat-2',
      patient_number: 'PAT-002',
      full_name: 'Charlie Brown',
    },
    test_name: 'Chest X-Ray',
    status: 'critical',
    ordered_at: '2026-07-14T08:00:00Z',
    completed_at: '2026-07-14T08:30:00Z',
    lab_notes: 'Cardiomegaly noted',
    visit_id: 'v-2',
  },
]

describe('InvestigationResultsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(consultationService.getInvestigationResults).mockResolvedValue(mockResultsData as any)
  })

  it('fetches and displays investigation results', async () => {
    render(
      <MemoryRouter>
        <InvestigationResultsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(consultationService.getInvestigationResults).toHaveBeenCalled()
      expect(screen.getByText('Bob Ross')).toBeInTheDocument()
      expect(screen.getByText('Full Blood Count')).toBeInTheDocument()
      expect(screen.getByText('Charlie Brown')).toBeInTheDocument()
    })
  })

  it('filters results by search input query', async () => {
    render(
      <MemoryRouter>
        <InvestigationResultsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Bob Ross')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/Name, Patient # or Test/i)
    fireEvent.change(searchInput, { target: { value: 'Charlie' } })

    expect(screen.getByText('Charlie Brown')).toBeInTheDocument()
    expect(screen.queryByText('Bob Ross')).not.toBeInTheDocument()
  })
})
