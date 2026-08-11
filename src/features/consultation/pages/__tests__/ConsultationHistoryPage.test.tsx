import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ConsultationHistoryPage } from '../ConsultationHistoryPage'
import { wardService } from '@/api/services/ward'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/api/services/ward', () => ({
  wardService: {
    listPatients: vi.fn(),
    getRecentPatients: vi.fn(),
    searchPatients: vi.fn(),
  },
}))

const mockPatients = [
  {
    id: 'pat-1',
    patient_id: 'pat-1',
    patient_number: 'PAT-001',
    full_name: 'David Miller',
    dob: '1985-05-12',
    date_of_birth: '1985-05-12',
    gender: 'male',
    phone: '555-1234',
    total_visits: 4,
    last_visit_date: '2026-07-10',
  },
  {
    id: 'pat-2',
    patient_id: 'pat-2',
    patient_number: 'PAT-002',
    full_name: 'Sarah Connor',
    dob: '1990-11-23',
    date_of_birth: '1990-11-23',
    gender: 'female',
    phone: '555-5678',
    total_visits: 2,
    last_visit_date: '2026-06-15',
  },
]

describe('ConsultationHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(wardService.getRecentPatients).mockResolvedValue(mockPatients as any)
    vi.mocked(wardService.searchPatients).mockResolvedValue({ patients: mockPatients } as any)
  })

  it('fetches and renders recent patient history list', async () => {
    render(
      <MemoryRouter>
        <ConsultationHistoryPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(wardService.getRecentPatients).toHaveBeenCalled()
      expect(screen.getByText('David Miller')).toBeInTheDocument()
      expect(screen.getByText('Sarah Connor')).toBeInTheDocument()
    })
  })

  it('searches patient list via search form input', async () => {
    vi.mocked(wardService.searchPatients).mockResolvedValue({ patients: [mockPatients[1]] } as any)

    render(
      <MemoryRouter>
        <ConsultationHistoryPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('David Miller')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search patient by name/i)
    fireEvent.change(searchInput, { target: { value: 'Sarah' } })

    const searchBtn = screen.getByRole('button', { name: /search Search/i })
    fireEvent.click(searchBtn)

    await waitFor(() => {
      expect(wardService.searchPatients).toHaveBeenCalledWith('Sarah', 1, 50)
    })
  })

  it('navigates to individual patient history page on click', async () => {
    render(
      <MemoryRouter>
        <ConsultationHistoryPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('David Miller')).toBeInTheDocument()
    })

    const davidBtn = screen.getByText('David Miller').closest('button') || screen.getByText('David Miller')
    fireEvent.click(davidBtn)

    expect(mockNavigate).toHaveBeenCalledWith('/consultation/history/pat-1')
  })
})
