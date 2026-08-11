import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ConsultationQueuePage } from '../ConsultationQueuePage'
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
    getQueue: vi.fn(),
    callPatient: vi.fn(),
  },
}))

const mockQueueItems = [
  {
    visit_id: 'v-1',
    queue_id: 'q-1',
    queue_number: 'Q-101',
    full_name: 'Jane Emergency',
    patient_number: 'PAT-001',
    chief_complaint: 'Severe Chest Pain',
    triage_category: 'emergency',
    wait_time_minutes: 15,
    queue_status: 'waiting',
    visit_status: 'waiting',
  },
  {
    visit_id: 'v-2',
    queue_id: 'q-2',
    queue_number: 'Q-102',
    full_name: 'John Routine',
    patient_number: 'PAT-002',
    chief_complaint: 'Routine Checkup',
    triage_category: 'non_urgent',
    wait_time_minutes: 5,
    queue_status: 'completed',
    visit_status: 'completed',
  },
]

describe('ConsultationQueuePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(consultationService.getQueue).mockResolvedValue(mockQueueItems as any)
  })

  it('renders loading state initially and then queue data', async () => {
    render(
      <MemoryRouter>
        <ConsultationQueuePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Jane Emergency')).toBeInTheDocument()
      expect(screen.getByText('PAT-001')).toBeInTheDocument()
      expect(screen.getByText('Severe Chest Pain')).toBeInTheDocument()
    })
  })

  it('filters queue by priority and status tabs', async () => {
    render(
      <MemoryRouter>
        <ConsultationQueuePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Jane Emergency')).toBeInTheDocument()
    })

    // Active status filter by default shows active/waiting patient Jane Emergency, hiding completed John Routine
    expect(screen.queryByText('John Routine')).not.toBeInTheDocument()

    // Switch status filter tab to 'All'
    const allTab = screen.getByRole('button', { name: /^all$/i })
    fireEvent.click(allTab)

    await waitFor(() => {
      expect(screen.getByText('John Routine')).toBeInTheDocument()
    })
  })

  it('filters queue by search query', async () => {
    render(
      <MemoryRouter>
        <ConsultationQueuePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Jane Emergency')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search patient, ID, complaint/i)
    fireEvent.change(searchInput, { target: { value: 'Jane' } })

    expect(screen.getByText('Jane Emergency')).toBeInTheDocument()

    fireEvent.change(searchInput, { target: { value: 'Nonexistent' } })
    expect(screen.queryByText('Jane Emergency')).not.toBeInTheDocument()
  })

  it('navigates to encounter page when clicking open encounter button', async () => {
    render(
      <MemoryRouter>
        <ConsultationQueuePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Jane Emergency')).toBeInTheDocument()
    })

    const openBtn = screen.getByRole('button', { name: /open encounter/i })
    fireEvent.click(openBtn)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/consultation/encounter/v-1')
    })
  })
})
