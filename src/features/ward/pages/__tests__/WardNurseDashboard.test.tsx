import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { WardNurseDashboard } from '../WardNurseDashboard'
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
    listBeds: vi.fn(),
    listActiveOrders: vi.fn(),
    listActiveVisitors: vi.fn(),
    updateOrder: vi.fn(),
  },
}))

const mockAdmissions = [
  {
    admissionId: 'adm-1',
    visitId: 'visit-1',
    patientId: '11111111-aaaa-bbbb-cccc-111111111111',
    bedId: 'bed-1',
    admittingDoctorId: 'Dr. Sarah Mwangi',
    admittingDiagnosis: 'Acute Appendicitis (Post-Op)',
    condition: 'critical' as const,
    admissionDate: '2026-07-19T10:00:00Z',
    status: 'active',
    wardName: 'General Ward',
    bedNumber: '302-B',
  },
  {
    admissionId: 'adm-2',
    visitId: 'visit-2',
    patientId: '22222222-aaaa-bbbb-cccc-222222222222',
    bedId: 'bed-2',
    admittingDoctorId: 'Dr. Baraka',
    admittingDiagnosis: 'Malaria',
    condition: 'stable' as const,
    admissionDate: '2026-07-18T08:00:00Z',
    status: 'active',
    wardName: 'General Ward',
    bedNumber: '04',
  },
]

const mockOrders = [
  {
    orderId: 'order-1',
    admissionId: 'adm-2',
    patientId: '22222222-aaaa-bbbb-cccc-222222222222',
    orderType: 'medication',
    orderDetail: 'IV Artesunate 120mg',
    orderedBy: 'Dr. Baraka',
    status: 'active',
    orderedAt: '2026-07-19T08:00:00Z',
    patientLabel: 'Patient 22222222',
    bedLabel: 'Bed 04',
  },
]

describe('WardNurseDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(wardService.listAdmissions).mockResolvedValue(mockAdmissions as any)
    vi.mocked(wardService.listBeds).mockResolvedValue([
      { bedId: 'bed-1', wardName: 'General Ward', bedNumber: '302-B', bedType: 'general', isAvailable: false, isActive: true },
      { bedId: 'bed-2', wardName: 'General Ward', bedNumber: '04', bedType: 'general', isAvailable: false, isActive: true },
      { bedId: 'bed-3', wardName: 'General Ward', bedNumber: '05', bedType: 'general', isAvailable: true, isActive: true },
    ] as any)
    vi.mocked(wardService.listActiveOrders).mockResolvedValue(mockOrders as any)
    vi.mocked(wardService.listActiveVisitors).mockResolvedValue([])
    vi.mocked(wardService.updateOrder).mockResolvedValue({} as any)
  })

  it('renders stats, new admission alert, and patient preview lists', async () => {
    render(
      <MemoryRouter>
        <WardNurseDashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Critical Patients Preview')).toBeInTheDocument()
    })
    expect(screen.getByText('Pending Inpatient Orders')).toBeInTheDocument()

    expect(screen.getByText('Admitted Patients')).toBeInTheDocument()
    expect(screen.getByText('Beds Occupied')).toBeInTheDocument()
    expect(screen.getByText('Critical Cases')).toBeInTheDocument()

    // Newest admission (adm-1) surfaces as the alert banner
    expect(screen.getByText('New Patient Admitted from Emergency / Outpatient')).toBeInTheDocument()
    expect(screen.getAllByText('Patient 11111111').length).toBeGreaterThan(0)

    expect(screen.getAllByText('Patient 22222222').length).toBeGreaterThan(0)
    expect(screen.getByText('IV Artesunate 120mg')).toBeInTheDocument()
  })

  it('dismisses the new admission alert banner on click', async () => {
    render(
      <MemoryRouter>
        <WardNurseDashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByTitle('Dismiss Alert')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTitle('Dismiss Alert'))

    expect(screen.queryByText('New Patient Admitted from Emergency / Outpatient')).not.toBeInTheDocument()
  })

  it('marks a pending order as completed', async () => {
    render(
      <MemoryRouter>
        <WardNurseDashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByTitle('Mark as Done')).toBeInTheDocument()
    })

    await act(async () => {
      fireEvent.click(screen.getByTitle('Mark as Done'))
    })

    await waitFor(() => {
      expect(wardService.updateOrder).toHaveBeenCalledWith('adm-2', 'order-1', { status: 'completed' })
    })
  })
})
