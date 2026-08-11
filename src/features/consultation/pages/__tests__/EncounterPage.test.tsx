import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { EncounterPage } from '../EncounterPage'
import { consultationService } from '@/api/services/consultation'
import { adminService } from '@/api/services/admin'

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

vi.mock('@/api/services/consultation', () => ({
  consultationService: {
    getEncounter: vi.fn(),
    updateNotes: vi.fn(),
    addDiagnosis: vi.fn(),
    deleteDiagnosis: vi.fn(),
    addInvestigation: vi.fn(),
    removeInvestigation: vi.fn(),
    addPrescription: vi.fn(),
    removePrescription: vi.fn(),
    updateDisposition: vi.fn(),
    completeConsultation: vi.fn(),
  },
}))

vi.mock('@/api/services/admin', () => ({
  adminService: {
    listDepartments: vi.fn(),
    listFeeSchedules: vi.fn(),
  },
}))

const mockEncounterData = {
  patient: {
    patient_id: 'pat-1',
    patient_number: 'PAT-001',
    full_name: 'Grace Hopper',
    age: 40,
    gender: 'female',
    payment_type: 'Cash',
  },
  visit: {
    visit_id: 'v-100',
    visit_number: 'VIS-100',
    chief_complaint: 'Persistent Cough and High Fever',
    priority: 'urgent',
  },
  vitals: {
    temperature: 38.5,
    blood_pressure: '120/80',
    pulse_rate: 82,
    respiratory_rate: 18,
    oxygen_saturation: 98,
    weight_kg: 65,
  },
  consultation: {
    id: 'c-1',
    consultation_id: 'c-1',
    consultation_status: 'in_progress',
    history_of_presenting_illness: 'Fever for 3 days',
    examination_findings: 'Chest crackles present',
    clinical_impression: 'Suspected Community Acquired Pneumonia',
    disposition: 'outpatient',
    diagnoses: [
      {
        id: 'diag-1',
        description: 'Acute Bronchitis',
        code: 'J20.9',
        diagnosis_type: 'provisional',
      },
    ],
    investigations: [],
    prescriptions: [],
  },
  diagnoses: [
    {
      id: 'diag-1',
      description: 'Acute Bronchitis',
      code: 'J20.9',
      diagnosis_type: 'provisional',
    },
  ],
  investigations: [],
  prescriptions: [],
}

describe('EncounterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(consultationService.getEncounter).mockResolvedValue(mockEncounterData as any)
    vi.mocked(adminService.listDepartments).mockResolvedValue([{ name: 'Laboratory' }] as any)
    vi.mocked(adminService.listFeeSchedules).mockResolvedValue([])
  })

  it('loads and renders patient encounter workspace', async () => {
    render(
      <MemoryRouter initialEntries={['/consultation/encounter/v-100']}>
        <Routes>
          <Route path="/consultation/encounter/:visitId" element={<EncounterPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(consultationService.getEncounter).toHaveBeenCalledWith('v-100')
      expect(screen.getByText('Grace Hopper')).toBeInTheDocument()
      expect(screen.getByText('PAT-001')).toBeInTheDocument()
    })
  })

  it('allows completing consultation when disposition is confirmed', async () => {
    vi.mocked(consultationService.completeConsultation).mockResolvedValue({} as any)

    render(
      <MemoryRouter initialEntries={['/consultation/encounter/v-100']}>
        <Routes>
          <Route path="/consultation/encounter/:visitId" element={<EncounterPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Grace Hopper')).toBeInTheDocument()
    })

    const completeBtn = screen.getByRole('button', { name: /complete encounter/i })
    expect(completeBtn).toBeInTheDocument()
    fireEvent.click(completeBtn)

    await waitFor(() => {
      expect(consultationService.completeConsultation).toHaveBeenCalledWith('c-1')
      expect(mockNavigate).toHaveBeenCalledWith('/consultation/queue')
    })
  })
})
