import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockNavigate } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LabRequestsPage } from '../LabRequestsPage'
import { laboratoryService, type BackendLabRequestItem } from '@/api/services/laboratory'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/api/services/laboratory', () => ({
  laboratoryService: {
    getRequests: vi.fn(),
    collectSpecimen: vi.fn(),
  },
}))

const mockRequests: BackendLabRequestItem[] = [
  {
    request_id: 'REQ-001',
    visit_id: 'VIS-101',
    patient_id: 'PAT-101',
    patient_name: 'John Doe',
    patient_number: 'HN-1001',
    test_name: 'Full Blood Count',
    test_code: 'FBC',
    urgency: 'stat',
    status: 'pending',
    requested_by_name: 'Dr. Sarah Connor',
    requested_at: '2026-07-30T09:00:00Z',
  },
  {
    request_id: 'REQ-002',
    visit_id: 'VIS-102',
    patient_id: 'PAT-102',
    patient_name: 'Alice Smith',
    patient_number: 'HN-1002',
    test_name: 'Urinalysis',
    test_code: 'UA',
    urgency: 'urgent',
    status: 'in_progress',
    requested_by_name: 'Dr. Gregory House',
    requested_at: '2026-07-30T09:30:00Z',
  },
  {
    request_id: 'REQ-003',
    visit_id: 'VIS-103',
    patient_id: 'PAT-103',
    patient_name: 'Bob Johnson',
    patient_number: 'HN-1003',
    test_name: 'Lipid Panel',
    test_code: 'LIP',
    urgency: 'routine',
    status: 'completed',
    requested_by_name: 'Dr. Sarah Connor',
    requested_at: '2026-07-30T08:00:00Z',
  },
]

describe('LabRequestsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(laboratoryService.getRequests).mockResolvedValue(mockRequests)
  })

  it('renders test requests and summary card metrics accurately', async () => {
    render(
      <MemoryRouter>
        <LabRequestsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    })

    expect(screen.getAllByText('Urgent')[0]).toBeInTheDocument()
    expect(screen.getAllByText('In Progress')[0]).toBeInTheDocument()
  })

  it('filters requests dynamically as user types in live search bar', async () => {
    render(
      <MemoryRouter>
        <LabRequestsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search patient, test, doctor...')
    fireEvent.change(searchInput, { target: { value: 'Urinalysis' } })

    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument()
  })

  it('filters by status dropdown selection', async () => {
    render(
      <MemoryRouter>
        <LabRequestsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    const statusSelect = screen.getByDisplayValue('Active Orders (Default)')
    fireEvent.change(statusSelect, { target: { value: 'pending' } })

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument()
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument()
  })

  it('navigates to request details page when table row is clicked', async () => {
    render(
      <MemoryRouter>
        <LabRequestsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('John Doe'))

    expect(mockNavigate).toHaveBeenCalledWith('/laboratory/requests/REQ-001')
  })
})
