import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { BedMapPage } from '../BedMapPage'
import { wardService } from '@/api/services/ward'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('@/api/services/ward', () => ({
  wardService: {
    listBedsWithAdmissions: vi.fn(),
    createAdmission: vi.fn(),
    updateCondition: vi.fn(),
  },
}))

const mockBeds = [
  {
    bedId: 'bed-301a',
    wardName: 'General Ward',
    bedNumber: '301-A',
    bedType: 'general',
    isAvailable: false,
    isActive: true,
    admissionId: 'adm-juma',
    patientId: 'juma0000-aaaa-bbbb-cccc-000000000000',
    diagnosis: 'Severe Malaria w/ Complications',
    admittingDoctorId: 'Dr. Joseph Lema',
    admissionDate: '2026-07-15T00:00:00Z',
    condition: 'critical' as const,
  },
  {
    bedId: 'bed-302b',
    wardName: 'General Ward',
    bedNumber: '302-B',
    bedType: 'general',
    isAvailable: true,
    isActive: true,
  },
]

describe('BedMapPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(wardService.listBedsWithAdmissions).mockResolvedValue(mockBeds as any)
  })

  it('renders bed layout grid with status legend', async () => {
    render(
      <MemoryRouter>
        <BedMapPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Bed Map — General Ward')).toBeInTheDocument()
    expect(screen.getByText('Stable')).toBeInTheDocument()
    expect(screen.getByText('Critical')).toBeInTheDocument()

    expect(await screen.findByText('Bed 301-A')).toBeInTheDocument()
    expect(screen.getByText('Bed 302-B')).toBeInTheDocument()
  })

  it('displays patient information popover when occupied bed is clicked', async () => {
    render(
      <MemoryRouter>
        <BedMapPage />
      </MemoryRouter>
    )

    const occupiedBedCard = await screen.findByText('Bed 301-A')
    fireEvent.click(occupiedBedCard)

    expect(screen.getAllByText('Patient juma0000').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/juma0000/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Severe Malaria w/ Complications').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /record notes/i })).toBeInTheDocument()
  })

  it('opens assignment form when available bed is clicked', async () => {
    render(
      <MemoryRouter>
        <BedMapPage />
      </MemoryRouter>
    )

    const availableBedCard = await screen.findByText('Bed 302-B')
    fireEvent.click(availableBedCard)

    expect(screen.getByRole('heading', { name: /assign bed 302-b/i })).toBeInTheDocument()
    const [visitInput, diagnosisInput] = screen.getAllByRole('textbox')
    expect(visitInput).toBeInTheDocument()

    fireEvent.change(visitInput, { target: { value: 'visit-123' } })
    fireEvent.change(diagnosisInput, { target: { value: 'Post-op observation' } })

    vi.mocked(wardService.createAdmission).mockResolvedValue({} as any)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /confirm assignment/i }))
    })

    await waitFor(() => {
      expect(wardService.createAdmission).toHaveBeenCalledWith({
        visitId: 'visit-123',
        bedId: 'bed-302b',
        admittingDiagnosis: 'Post-op observation',
      })
    })
  })
})
