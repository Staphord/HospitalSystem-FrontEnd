import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ImagingSchedulePage } from '../ImagingSchedulePage'
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
  },
}))

const mockScheduledRequests = [
  {
    id: 'rad-sched-001',
    orderNumber: 'RAD-2026-003',
    patientName: 'Baraka Ali',
    patientNumber: 'PT-3003',
    modality: 'mri',
    testName: 'Brain MRI with Contrast',
    priority: 'routine',
    status: 'scheduled',
    requestedAt: '2026-08-15 08:30',
    scheduledAt: new Date().toISOString(),
    requestingDoctor: 'Dr. Sarah Kimaro',
    bodyPart: 'Head/Brain',
  },
]

describe('ImagingSchedulePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(radiologyService.listRequests).mockResolvedValue({
      requests: mockScheduledRequests,
    } as any)
  })

  it('renders equipment schedule navigation, modality legend and appointments', async () => {
    render(
      <MemoryRouter>
        <ImagingSchedulePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/today/i)).toBeInTheDocument()
      expect(screen.getByText('MRI')).toBeInTheDocument()
      expect(screen.getByText('X-Ray')).toBeInTheDocument()
      expect(screen.getByText('CT Scan')).toBeInTheDocument()
    })
  })

  it('toggles between calendar and list view modes', async () => {
    render(
      <MemoryRouter>
        <ImagingSchedulePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/today/i)).toBeInTheDocument()
    })

    const listViewBtn = screen.getByRole('button', { name: /list/i })
    fireEvent.click(listViewBtn)

    await waitFor(() => {
      expect(screen.getByText('Baraka Ali')).toBeInTheDocument()
    })
  })
})
