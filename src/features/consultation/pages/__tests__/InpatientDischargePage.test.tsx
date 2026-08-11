import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { InpatientDischargePage } from '../InpatientDischargePage'
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
    dischargePatient: vi.fn(),
  },
}))

const mockAdmissionDetails = {
  data: {
    patient: {
      admissionId: 'adm-200',
      patientId: 'pat-200',
      patientNumber: 'PAT-200',
      name: 'Charles Babbage',
      patientName: 'Charles Babbage',
      age: 50,
      gender: 'male',
      ward: 'Ward 1',
      bedNumber: 'B-01',
      bed: 'Bed B-01',
      admissionDate: '2026-07-05T10:00:00Z',
      attendingDoctor: 'Dr. House',
      diagnosis: 'Hypertension',
      primaryDiagnosis: 'Hypertension',
      status: 'stable',
    },
    summary: {
      wardService: 'Medical Ward 1',
      keyEvents: [
        { date: 'Jul 05', description: 'Admitted with high BP' },
      ],
      totalOrders: 5,
      completedOrders: 5,
    },
  },
}

describe('InpatientDischargePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(wardService.getAdmissionDetails).mockResolvedValue(mockAdmissionDetails as any)
  })

  it('renders discharge form for an eligible admitted patient', async () => {
    render(
      <MemoryRouter initialEntries={['/consultation/inpatient/adm-200/discharge']}>
        <Routes>
          <Route path="/consultation/inpatient/:admissionId/discharge" element={<InpatientDischargePage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(wardService.getAdmissionDetails).toHaveBeenCalledWith('adm-200')
      expect(screen.getByText('Charles Babbage')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /confirm discharge/i })).toBeInTheDocument()
    })
  })

  it('prevents discharge for critical status patients', async () => {
    const criticalAdmission = {
      data: {
        patient: {
          ...mockAdmissionDetails.data.patient,
          status: 'critical',
        },
        summary: mockAdmissionDetails.data.summary,
      },
    }
    vi.mocked(wardService.getAdmissionDetails).mockResolvedValue(criticalAdmission as any)

    render(
      <MemoryRouter initialEntries={['/consultation/inpatient/adm-200/discharge']}>
        <Routes>
          <Route path="/consultation/inpatient/:admissionId/discharge" element={<InpatientDischargePage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/critical/i)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /confirm discharge/i })).not.toBeInTheDocument()
    })
  })
})
