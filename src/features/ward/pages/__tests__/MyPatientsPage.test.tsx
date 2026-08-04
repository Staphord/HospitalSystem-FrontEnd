import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { MyPatientsPage } from '../MyPatientsPage'
import { wardService } from '@/api/services/ward'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

vi.mock('@/api/services/ward', () => ({
  wardService: {
    listAdmissions: vi.fn(),
    listActiveVisitors: vi.fn(),
  },
}))

const mockAdmissions = [
  {
    admissionId: 'adm-juma',
    visitId: 'visit-juma',
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
  {
    admissionId: 'adm-neema',
    visitId: 'visit-neema',
    patientId: 'neema000-aaaa-bbbb-cccc-000000000000',
    bedId: 'bed-5',
    admittingDoctorId: 'Dr. Amina Hassan',
    admittingDiagnosis: 'Gastritis',
    condition: 'stable' as const,
    admissionDate: '2026-07-17T00:00:00Z',
    status: 'active',
    wardName: 'General Ward',
    bedNumber: '05',
  },
]

describe('MyPatientsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(wardService.listAdmissions).mockResolvedValue(mockAdmissions as any)
    vi.mocked(wardService.listActiveVisitors).mockResolvedValue([])
  })

  it('renders admitted patients table with headers and data rows', async () => {
    render(
      <MemoryRouter>
        <MyPatientsPage />
      </MemoryRouter>
    )

    expect(await screen.findByText('My Admitted Patients')).toBeInTheDocument()

    expect(screen.getByText('Bed #')).toBeInTheDocument()
    expect(screen.getByText('Patient Name')).toBeInTheDocument()
    expect(screen.getByText('Patient No')).toBeInTheDocument()

    expect(screen.getByText('Patient juma0000')).toBeInTheDocument()
    expect(screen.getByText('Patient neema000')).toBeInTheDocument()
    expect(screen.getByText('JUMA0000')).toBeInTheDocument()
  })

  it('filters patient rows based on search input query', async () => {
    render(
      <MemoryRouter>
        <MyPatientsPage />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('Patient juma0000')).toBeInTheDocument())

    const searchInput = screen.getByPlaceholderText('Search patient, bed, or file #...')
    fireEvent.change(searchInput, { target: { value: 'juma0000' } })

    expect(screen.getByText('Patient juma0000')).toBeInTheDocument()
    expect(screen.queryByText('Patient neema000')).not.toBeInTheDocument()
  })

  it('filters patient rows based on condition dropdown selection', async () => {
    render(
      <MemoryRouter>
        <MyPatientsPage />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('Patient juma0000')).toBeInTheDocument())

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'Critical' } })

    expect(screen.getByText('Patient juma0000')).toBeInTheDocument()
    expect(screen.queryByText('Patient neema000')).not.toBeInTheDocument() // Neema is Stable
  })
})
