import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { SpecimenTrackingPage } from '../SpecimenTrackingPage'
import { laboratoryService, type BackendTrackedSpecimenItem } from '@/api/services/laboratory'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/api/services/laboratory', () => ({
  laboratoryService: {
    getAllSpecimens: vi.fn(),
    updateSpecimenStatus: vi.fn(),
  },
}))

const mockSpecimens: BackendTrackedSpecimenItem[] = [
  {
    specimen_id: 'SP-1001',
    request_id: 'REQ-001',
    patient_id: 'PAT-101',
    patient_name: 'John Doe',
    patient_number: 'HN-1001',
    test_name: 'Full Blood Count',
    urgency: 'stat',
    specimen_type: 'blood',
    collected_by_name: 'Nurse Mary',
    collected_at: '2026-07-30T09:00:00Z',
    status: 'collected',
  },
  {
    specimen_id: 'SP-1002',
    request_id: 'REQ-002',
    patient_id: 'PAT-102',
    patient_name: 'Alice Smith',
    patient_number: 'HN-1002',
    test_name: 'Urinalysis',
    urgency: 'urgent',
    specimen_type: 'urine',
    collected_by_name: 'Tech Bob',
    collected_at: '2026-07-30T09:30:00Z',
    status: 'processing',
  },
]

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('SpecimenTrackingPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(laboratoryService.getAllSpecimens).mockResolvedValue(mockSpecimens)
  })

  it('renders specimen log items and summary cards', async () => {
    render(
      <MemoryRouter>
        <SpecimenTrackingPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    })

    expect(screen.getByText('Specimen Log')).toBeInTheDocument()
    expect(screen.getByText('Awaiting Collection')).toBeInTheDocument()
    expect(screen.getAllByText('Collected')[0]).toBeInTheDocument()
  })

  it('filters specimen log live as user types in search bar without errors', async () => {
    render(
      <MemoryRouter>
        <SpecimenTrackingPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search specimen, patient, test...')
    fireEvent.change(searchInput, { target: { value: 'SP-1002' } })

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    })
  })

  it('filters specimens by status dropdown option', async () => {
    render(
      <MemoryRouter>
        <SpecimenTrackingPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    const statusSelect = screen.getByDisplayValue('All Statuses')
    fireEvent.change(statusSelect, { target: { value: 'processing' } })

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    })
  })
})
