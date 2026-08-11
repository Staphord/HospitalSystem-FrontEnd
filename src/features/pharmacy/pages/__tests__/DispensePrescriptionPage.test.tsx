import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { DispensePrescriptionPage } from '../DispensePrescriptionPage'
import { pharmacyService } from '@/api/services/pharmacy'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'u-1', full_name: 'Dr. Gregory House', role: 'doctor' },
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/api/services/pharmacy', () => ({
  pharmacyService: {
    getPrescriptionDetails: vi.fn(),
    getVisitPrescriptions: vi.fn(),
    checkDrugInteractions: vi.fn(),
    getInventory: vi.fn(),
    generateLabel: vi.fn(),
    dispensePrescription: vi.fn(),
  },
}))

const mockVisitData = {
  visit_id: 'v-100',
  visit_number: 'VIS-100',
  patient: {
    patient_id: 'pat-100',
    patient_number: 'HN-1001',
    patient_name: 'Grace Hopper',
    date_of_birth: '1990-01-01',
    allergies: 'Penicillin',
  },
  final_diagnosis: 'Community Acquired Pneumonia',
  billing_cleared: true,
  prescriptions: [
    {
      prescription_id: 'rx-1',
      drug_name: 'Amoxicillin 500mg',
      dose: '500mg',
      frequency: 'TID',
      duration: '7 days',
      route: 'Oral',
      quantity_prescribed: 21,
      instructions: 'Take after meals',
      prescribed_by: 'Dr. House',
      prescribed_at: '2026-08-11T09:00:00Z',
      status: 'pending',
    },
  ],
}

describe('DispensePrescriptionPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(pharmacyService.getPrescriptionDetails).mockResolvedValue(mockVisitData as any)
    vi.mocked(pharmacyService.checkDrugInteractions).mockResolvedValue({
      visit_id: 'v-100',
      alerts: [
        {
          type: 'drug_allergy',
          severity: 'high',
          detail: 'Patient has reported allergy to Penicillin derivative',
          recommendation: 'Verify contraindication prior to dispensing',
        },
      ],
      alert_count: 1,
      checked_at: '2026-08-11T10:00:00Z',
    } as any)
    vi.mocked(pharmacyService.getInventory).mockResolvedValue({ items: [] } as any)
    vi.mocked(pharmacyService.generateLabel).mockResolvedValue({ label_text: 'Sample label' } as any)
  })

  it('renders patient clinical context and prescription details', async () => {
    render(
      <MemoryRouter initialEntries={['/pharmacy/queue/v-100/dispense']}>
        <Routes>
          <Route path="/pharmacy/queue/:prescriptionId/dispense" element={<DispensePrescriptionPage />} />
          <Route path="/pharmacy/queue" element={<div>Queue Target</div>} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(pharmacyService.getPrescriptionDetails).toHaveBeenCalledWith('v-100')
      expect(screen.getByText('Grace Hopper')).toBeInTheDocument()
      expect(screen.getAllByText('Amoxicillin 500mg').length).toBeGreaterThan(0)
      expect(screen.getByText('Dr. House')).toBeInTheDocument()
    })
  })

  it('renders safety check warning banner when drug interaction alerts exist', async () => {
    render(
      <MemoryRouter initialEntries={['/pharmacy/queue/v-100/dispense']}>
        <Routes>
          <Route path="/pharmacy/queue/:prescriptionId/dispense" element={<DispensePrescriptionPage />} />
          <Route path="/pharmacy/queue" element={<div>Queue Target</div>} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/patient has reported allergy to penicillin derivative/i)).toBeInTheDocument()
    })
  })

  it('submits dispensing action when interaction is acknowledged and confirm dispensing button is clicked', async () => {
    vi.mocked(pharmacyService.dispensePrescription).mockResolvedValue({ dispensing_id: 'disp-1' } as any)

    render(
      <MemoryRouter initialEntries={['/pharmacy/queue/v-100/dispense']}>
        <Routes>
          <Route path="/pharmacy/queue/:prescriptionId/dispense" element={<DispensePrescriptionPage />} />
          <Route path="/pharmacy/queue" element={<div>Queue Target</div>} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText('Amoxicillin 500mg').length).toBeGreaterThan(0)
    })

    // Acknowledge interaction alert checkbox
    const ackCheckbox = screen.getByRole('checkbox')
    fireEvent.click(ackCheckbox)

    const confirmBtn = screen.getByRole('button', { name: /confirm dispensing/i })
    expect(confirmBtn).not.toBeDisabled()
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(pharmacyService.dispensePrescription).toHaveBeenCalledWith(expect.objectContaining({
        prescription_id: 'rx-1',
      }))
    })
  })
})
