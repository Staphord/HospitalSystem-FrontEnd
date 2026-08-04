import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ShiftHandoverPage } from '../ShiftHandoverPage'
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
    listAdmissions: vi.fn(),
    listActiveVisitors: vi.fn(),
    listHandovers: vi.fn(),
    createHandover: vi.fn(),
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
    bedNumber: '301-A',
  },
  {
    admissionId: 'adm-zuwena',
    visitId: 'visit-zuwena',
    patientId: 'zuwena00-aaaa-bbbb-cccc-000000000000',
    bedId: 'bed-4',
    admittingDoctorId: 'Dr. Joseph Lema',
    admittingDiagnosis: 'Pneumonia',
    condition: 'critical' as const,
    admissionDate: '2026-07-16T00:00:00Z',
    status: 'active',
    wardName: 'General Ward',
    bedNumber: '301-B',
  },
]

const mockHistory = [
  {
    handoverId: 'h-1',
    shiftLabel: 'Night Shift',
    submittedBy: 'Nurse John S.',
    overallSummary: 'All patients stable. No major incidents during the night shift.',
    incidentsSummary: '0 Reported',
    patientCount: 2,
    patientNotes: {
      'Patient juma0000': 'Stable overnight, vital signs monitored hourly.',
    },
    wardName: 'General Ward',
    createdAt: '2026-07-18T19:30:00Z',
  },
]

describe('ShiftHandoverPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(wardService.listAdmissions).mockResolvedValue(mockAdmissions as any)
    vi.mocked(wardService.listActiveVisitors).mockResolvedValue([])
    vi.mocked(wardService.listHandovers).mockResolvedValue(mockHistory as any)
    vi.mocked(wardService.createHandover).mockResolvedValue({
      handoverId: 'h-new',
      shiftLabel: 'Day Shift',
      submittedBy: 'Nurse On Duty',
      overallSummary: 'Shift was calm. No major incidents.',
      incidentsSummary: '0 Reported',
      patientCount: 2,
      patientNotes: {},
      createdAt: '2026-07-19T10:00:00Z',
    } as any)
  })

  it('renders shift handover form and previous handovers list', async () => {
    render(
      <MemoryRouter>
        <ShiftHandoverPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Shift Handover')).toBeInTheDocument()

    expect(await screen.findByText('Patient juma0000')).toBeInTheDocument()
    expect(screen.getByText('Patient zuwena00')).toBeInTheDocument()
  })

  it('submits shift handover details and validates fields', async () => {
    render(
      <MemoryRouter>
        <ShiftHandoverPage />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('Patient juma0000')).toBeInTheDocument())

    const summaryInput = screen.getByPlaceholderText(/describe general ward issues/i)
    fireEvent.change(summaryInput, { target: { value: 'Shift was calm. No major incidents.' } })

    const submitBtn = screen.getByRole('button', { name: /submit handover/i })
    await act(async () => {
      fireEvent.click(submitBtn)
    })

    await waitFor(() => expect(wardService.createHandover).toHaveBeenCalled())

    const historyTabBtn = screen.getByRole('button', { name: /handover history/i })
    fireEvent.click(historyTabBtn)
    expect(await screen.findByText(/Nurse On Duty/)).toBeInTheDocument()
  })

  it('opens read-only details modal when previous report button is clicked', async () => {
    render(
      <MemoryRouter>
        <ShiftHandoverPage />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('Patient juma0000')).toBeInTheDocument())

    const historyTabBtn = screen.getByRole('button', { name: /handover history/i })
    fireEvent.click(historyTabBtn)

    const viewReportButtons = await screen.findAllByRole('button', { name: /view report/i })
    fireEvent.click(viewReportButtons[0])

    expect(screen.getByRole('heading', { name: 'Shift Handover Report Details' })).toBeInTheDocument()
    expect(screen.getByText(/Nurse John S./)).toBeInTheDocument()
    expect(screen.getByText(/Stable overnight, vital signs monitored hourly./i)).toBeInTheDocument()
  })
})
