import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ImagingRequestsPage } from '../ImagingRequestsPage'
import { radiologyService } from '@/api/services/radiology'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock radiologyService
vi.mock('@/api/services/radiology', () => ({
  radiologyService: {
    listRequests: vi.fn(),
    scheduleRequest: vi.fn().mockResolvedValue({}),
    cancelRequest: vi.fn().mockResolvedValue({}),
  },
}))

const mockRequests = [
  {
    id: 'rad-001',
    orderNumber: 'RAD-2026-001',
    patientName: 'Faraji Bakari',
    patientNumber: 'PT-3001',
    modality: 'x-ray',
    testName: 'Chest X-Ray PA View',
    priority: 'routine',
    status: 'requested',
    requestedAt: '2026-08-15 08:30',
    requestingDoctor: 'Dr. Sarah Kimaro',
    requestedBy: 'Dr. Sarah Kimaro',
    clinicalIndication: 'Chest pain',
    bodyPart: 'Chest',
  },
  {
    id: 'rad-002',
    orderNumber: 'RAD-2026-002',
    patientName: 'Neema Joseph',
    patientNumber: 'PT-3002',
    modality: 'ultrasound',
    testName: 'Abdominal Ultrasound',
    priority: 'urgent',
    status: 'in_progress',
    requestedAt: '2026-08-15 09:00',
    requestingDoctor: 'Dr. Sarah Kimaro',
    requestedBy: 'Dr. Sarah Kimaro',
    clinicalIndication: 'Abdominal pain',
    bodyPart: 'Abdomen',
  },
]

describe('ImagingRequestsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(radiologyService.listRequests).mockResolvedValue({
      requests: mockRequests,
      summary: { newRequests: 1, scheduled: 0, inProgress: 1, completedToday: 0 },
    } as any)
  })

  it('renders radiology summary cards and request table', async () => {
    render(
      <MemoryRouter>
        <ImagingRequestsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Faraji Bakari')).toBeInTheDocument()
      expect(screen.getByText('Neema Joseph')).toBeInTheDocument()
      expect(screen.getByText('PT-3001')).toBeInTheDocument()
    })
  })

  it('filters requests by modality', async () => {
    render(
      <MemoryRouter>
        <ImagingRequestsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Faraji Bakari')).toBeInTheDocument()
    })

    const modalitySelect = screen.getByLabelText(/modality/i)
    fireEvent.change(modalitySelect, { target: { value: 'ultrasound' } })

    expect(screen.getByText('Neema Joseph')).toBeInTheDocument()
    expect(screen.queryByText('Faraji Bakari')).not.toBeInTheDocument()
  })

  it('filters requests by search term', async () => {
    render(
      <MemoryRouter>
        <ImagingRequestsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Faraji Bakari')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search patients or requests...')
    fireEvent.change(searchInput, { target: { value: 'Neema' } })

    expect(screen.getByText('Neema Joseph')).toBeInTheDocument()
    expect(screen.queryByText('Faraji Bakari')).not.toBeInTheDocument()
  })
})
