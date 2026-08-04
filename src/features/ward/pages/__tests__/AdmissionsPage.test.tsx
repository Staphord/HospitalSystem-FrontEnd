import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AdmissionsPage } from '../AdmissionsPage'
import { wardService } from '@/api/services/ward'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

vi.mock('@/api/services/ward', () => ({
  wardService: {
    listAdmissions: vi.fn(),
    listBeds: vi.fn(),
    createAdmission: vi.fn(),
    dischargeAdmission: vi.fn(),
  },
}))

const mockAdmissions = [
  {
    admissionId: 'adm-juma',
    visitId: 'visit-juma-uuid',
    patientId: 'juma0000-aaaa-bbbb-cccc-000000000000',
    bedId: 'bed-3',
    admittingDoctorId: 'Dr. Joseph Lema',
    admittingDiagnosis: 'Severe Malaria',
    condition: 'critical' as const,
    admissionDate: '2026-07-15T00:00:00Z',
    status: 'active',
    wardName: 'General Ward',
    bedNumber: '03',
  },
]

const mockAvailableBeds = [
  { bedId: 'bed-5', wardName: 'General Ward', bedNumber: '05', bedType: 'general', isAvailable: true, isActive: true },
]

describe('AdmissionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(wardService.listAdmissions).mockResolvedValue(mockAdmissions as any)
    vi.mocked(wardService.listBeds).mockResolvedValue(mockAvailableBeds as any)
    vi.mocked(wardService.createAdmission).mockResolvedValue({} as any)
    vi.mocked(wardService.dischargeAdmission).mockResolvedValue({} as any)
  })

  it('renders the admissions table with active admissions', async () => {
    render(
      <MemoryRouter>
        <AdmissionsPage />
      </MemoryRouter>
    )

    expect(await screen.findByText('Patient juma0000')).toBeInTheDocument()
    expect(screen.getByText('Severe Malaria')).toBeInTheDocument()
    expect(screen.getByText('active')).toBeInTheDocument()
  })

  it('submits a new admission via the New Admission modal', async () => {
    render(
      <MemoryRouter>
        <AdmissionsPage />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('Patient juma0000')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /new admission/i }))
    expect(screen.getByRole('heading', { name: 'New Admission' })).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('UUID of an existing visit'), {
      target: { value: 'visit-new-uuid' },
    })
    fireEvent.change(screen.getByPlaceholderText('Primary reason for admission'), {
      target: { value: 'Dehydration' },
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /admit patient/i }))
    })

    await waitFor(() => {
      expect(wardService.createAdmission).toHaveBeenCalledWith({
        visitId: 'visit-new-uuid',
        bedId: 'bed-5',
        admittingDiagnosis: 'Dehydration',
      })
    })
  })

  it('discharges an active patient via the Discharge modal', async () => {
    render(
      <MemoryRouter>
        <AdmissionsPage />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('Patient juma0000')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /discharge/i }))
    expect(screen.getByRole('heading', { name: 'Discharge Patient' })).toBeInTheDocument()

    const [diagnosisField] = screen.getAllByRole('textbox')
    fireEvent.change(diagnosisField, { target: { value: 'Recovered, resolved infection.' } })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /confirm discharge/i }))
    })

    await waitFor(() => {
      expect(wardService.dischargeAdmission).toHaveBeenCalledWith('adm-juma', {
        dischargeDiagnosis: 'Recovered, resolved infection.',
        dischargeInstructions: undefined,
      })
    })
  })
})
