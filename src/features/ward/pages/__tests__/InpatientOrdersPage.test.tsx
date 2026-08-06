import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { InpatientOrdersPage } from '../InpatientOrdersPage'
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
    listActiveOrders: vi.fn(),
    createOrder: vi.fn(),
    updateOrder: vi.fn(),
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
    admissionId: 'adm-zuwena',
    visitId: 'visit-zuwena',
    patientId: 'zuwena00-aaaa-bbbb-cccc-000000000000',
    bedId: 'bed-4',
    admittingDoctorId: 'Dr. Joseph Lema',
    admittingDiagnosis: 'Pneumonia',
    condition: 'monitoring' as const,
    admissionDate: '2026-07-16T00:00:00Z',
    status: 'active',
    wardName: 'General Ward',
    bedNumber: '04',
  },
]

const mockOrders = [
  {
    orderId: 'order-juma',
    admissionId: 'adm-juma',
    patientId: 'juma0000-aaaa-bbbb-cccc-000000000000',
    orderType: 'medication',
    orderDetail: 'IV Artesunate 120mg stat',
    orderedBy: 'Dr. Joseph Lema',
    status: 'active',
    orderedAt: '2026-07-19T08:00:00Z',
    patientLabel: 'Patient juma0000',
    bedLabel: 'Bed 03',
  },
  {
    orderId: 'order-zuwena',
    admissionId: 'adm-zuwena',
    patientId: 'zuwena00-aaaa-bbbb-cccc-000000000000',
    orderType: 'investigation',
    orderDetail: 'Stat Blood Glucose check & electrolytes panel',
    orderedBy: 'Dr. Joseph Lema',
    status: 'active',
    orderedAt: '2026-07-19T09:30:00Z',
    patientLabel: 'Patient zuwena00',
    bedLabel: 'Bed 04',
  },
]

describe('InpatientOrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(wardService.listAdmissions).mockResolvedValue(mockAdmissions as any)
    vi.mocked(wardService.listActiveOrders).mockResolvedValue(mockOrders as any)
    vi.mocked(wardService.createOrder).mockResolvedValue({} as any)
    vi.mocked(wardService.updateOrder).mockResolvedValue({} as any)
  })

  it('renders active orders grouped by patient', async () => {
    render(
      <MemoryRouter>
        <InpatientOrdersPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Active Inpatient Orders')).toBeInTheDocument()

    expect(await screen.findByText('IV Artesunate 120mg stat')).toBeInTheDocument()
    expect(screen.getAllByText('Patient juma0000').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Patient zuwena00').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Stat Blood Glucose check & electrolytes panel')).toBeInTheDocument()
  })

  it('filters orders list on order type selection change', async () => {
    render(
      <MemoryRouter>
        <InpatientOrdersPage />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('IV Artesunate 120mg stat')).toBeInTheDocument())

    const select = screen.getByLabelText('Order Type')
    fireEvent.change(select, { target: { value: 'Medication' } })

    expect(screen.getByText('IV Artesunate 120mg stat')).toBeInTheDocument()
    expect(screen.queryByText('Stat Blood Glucose check & electrolytes panel')).not.toBeInTheDocument()
  })

  it('toggles the completion status of a pending order', async () => {
    render(
      <MemoryRouter>
        <InpatientOrdersPage />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0))

    const toggleCheckboxes = screen.getAllByRole('checkbox')
    await act(async () => {
      fireEvent.click(toggleCheckboxes[0])
    })

    await waitFor(() => {
      expect(wardService.updateOrder).toHaveBeenCalledWith('adm-juma', 'order-juma', { status: 'completed' })
    })
  })

  it('opens the issue order modal and successfully adds a new medication order', async () => {
    render(
      <MemoryRouter>
        <InpatientOrdersPage />
      </MemoryRouter>
    )

    await waitFor(() => expect(screen.getByText('IV Artesunate 120mg stat')).toBeInTheDocument())

    const newOrderBtn = screen.getByRole('button', { name: /new order/i })
    fireEvent.click(newOrderBtn)

    expect(screen.getByText('Issue Inpatient Order')).toBeInTheDocument()

    const patientSelect = screen.getByLabelText('PATIENT SEARCH')
    fireEvent.change(patientSelect, { target: { value: 'adm-juma' } })

    const drugInput = screen.getByLabelText('DRUG SEARCH')
    fireEvent.change(drugInput, { target: { value: 'Paracetamol' } })

    const doseInput = screen.getByLabelText('DOSE')
    fireEvent.change(doseInput, { target: { value: '500mg' } })

    const frequencySelect = screen.getByLabelText('FREQUENCY')
    fireEvent.change(frequencySelect, { target: { value: 'Daily' } })

    const routeSelect = screen.getByLabelText('ROUTE')
    fireEvent.change(routeSelect, { target: { value: 'PO (Oral)' } })

    const issueBtn = screen.getByRole('button', { name: /issue order/i })
    await act(async () => {
      fireEvent.click(issueBtn)
    })

    expect(screen.queryByText('Issue Inpatient Order')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(wardService.createOrder).toHaveBeenCalledWith('adm-juma', {
        orderType: 'medication',
        orderDetail: 'Paracetamol 500mg PO (Oral) Daily',
        frequency: '10:00 AM',
      })
    })
  })
})
