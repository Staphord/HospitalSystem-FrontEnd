import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { InpatientOrdersPage } from '../InpatientOrdersPage'
import { wardService } from '@/api/services/ward'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/api/services/ward', () => ({
  wardService: {
    getAdmissionDetails: vi.fn(),
    getInpatientOrders: vi.fn(),
    createInpatientOrder: vi.fn(),
    discontinueInpatientOrder: vi.fn(),
  },
}))

const mockAdmissionDetails = {
  data: {
    patient: {
      admissionId: 'adm-100',
      patientId: 'pat-100',
      patientNumber: 'PAT-100',
      name: 'Ada Lovelace',
      patientName: 'Ada Lovelace',
      initials: 'AL',
      age: 36,
      gender: 'female',
      ward: 'Ward 3',
      bedNumber: 'B-04',
      bed: 'Bed B-04',
      admissionDate: '2026-07-11T12:00:00Z',
      attendingDoctor: 'Dr. House',
      diagnosis: 'Severe Fever',
      primaryDiagnosis: 'Severe Fever',
      status: 'stable',
    },
  },
}

const mockOrders = {
  data: [
    {
      id: 'ord-1',
      admissionId: 'adm-100',
      type: 'medication',
      description: 'Paracetamol 1g PO Daily',
      status: 'pending',
      issuedAt: 'Jul 14, 10:00 AM',
    },
  ],
}

describe('InpatientOrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(wardService.getAdmissionDetails).mockResolvedValue(mockAdmissionDetails as any)
    vi.mocked(wardService.getInpatientOrders).mockResolvedValue(mockOrders as any)
  })

  it('renders admission header and active order list', async () => {
    render(
      <MemoryRouter initialEntries={['/consultation/inpatient/adm-100/orders']}>
        <Routes>
          <Route path="/consultation/inpatient/:admissionId/orders" element={<InpatientOrdersPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(wardService.getAdmissionDetails).toHaveBeenCalledWith('adm-100')
      expect(screen.getAllByText('Ada Lovelace').length).toBeGreaterThan(0)
      expect(screen.getByText('Paracetamol 1g PO Daily')).toBeInTheDocument()
    })
  })

  it('opens issue order modal when New Order button is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/consultation/inpatient/adm-100/orders']}>
        <Routes>
          <Route path="/consultation/inpatient/:admissionId/orders" element={<InpatientOrdersPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText('Ada Lovelace').length).toBeGreaterThan(0)
    })

    const newOrderBtn = screen.getByRole('button', { name: /issue new order/i })
    fireEvent.click(newOrderBtn)

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Issue Inpatient Order')).toBeInTheDocument()
    })
  })
})
