import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { VisitorLogPage } from '../VisitorLogPage'
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
    listVisitors: vi.fn(),
    listAdmissions: vi.fn(),
    checkoutVisitor: vi.fn(),
    createVisitor: vi.fn(),
  },
}))

const mockVisitors = [
  {
    visitorId: 'v-1',
    admissionId: 'adm-juma',
    patientId: 'juma0000-aaaa-bbbb-cccc-000000000000',
    patientName: 'Patient juma0000',
    bedLabel: 'Bed 03',
    visitorName: 'Hamisi Juma',
    relationship: 'Sibling',
    nationalId: 'ID-99881',
    checkInAt: '2026-07-19T10:15:00Z',
    checkOutAt: null,
    approvedBy: 'Nurse Amina Masoud, RN',
    status: 'active',
    allowedDurationMinutes: 30,
  },
  {
    visitorId: 'v-2',
    admissionId: 'adm-juma',
    patientId: 'juma0000-aaaa-bbbb-cccc-000000000000',
    patientName: 'Patient juma0000',
    bedLabel: 'Bed 03',
    visitorName: 'Fatuma Hamisi',
    relationship: 'Parent',
    nationalId: 'ID-99882',
    checkInAt: '2026-07-19T09:30:00Z',
    checkOutAt: null,
    approvedBy: 'Nurse Amina Masoud, RN',
    status: 'active',
    allowedDurationMinutes: 30,
  },
]

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
]

describe('VisitorLogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(wardService.listVisitors).mockResolvedValue(mockVisitors as any)
    vi.mocked(wardService.listAdmissions).mockResolvedValue(mockAdmissions as any)
    vi.mocked(wardService.checkoutVisitor).mockResolvedValue({ visitorName: 'Hamisi Juma' } as any)
    vi.mocked(wardService.createVisitor).mockResolvedValue({} as any)
  })

  it('renders visitor ledger with rows and hours banner', async () => {
    render(
      <MemoryRouter>
        <VisitorLogPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Visitor Ledger')).toBeInTheDocument()
    expect(screen.getByText('Active Visiting Hours Enforced')).toBeInTheDocument()

    expect(await screen.findByText('Hamisi Juma')).toBeInTheDocument()
    expect(screen.getByText('Fatuma Hamisi')).toBeInTheDocument()
  })

  it('opens registration modal when log new visitor button is clicked', async () => {
    render(
      <MemoryRouter>
        <VisitorLogPage />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('Hamisi Juma')).toBeInTheDocument())

    const addBtn = screen.getByRole('button', { name: /log new visitor/i })
    fireEvent.click(addBtn)

    expect(screen.getByRole('heading', { name: /log new visitor/i })).toBeInTheDocument()
  })

  it('checks out an active visitor', async () => {
    render(
      <MemoryRouter>
        <VisitorLogPage />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getAllByRole('button', { name: /check out/i }).length).toBeGreaterThan(0))

    const checkoutButtons = screen.getAllByRole('button', { name: /check out/i })
    await act(async () => {
      fireEvent.click(checkoutButtons[0])
    })

    await waitFor(() => {
      expect(wardService.checkoutVisitor).toHaveBeenCalledWith('v-1')
    })
  })
})
