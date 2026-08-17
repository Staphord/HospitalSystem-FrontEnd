import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { TriageHistoryPatientPage } from '../TriageHistoryPatientPage'
import { receptionService } from '@/api/services/reception'
import { triageService } from '@/api/services/triage'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock services
vi.mock('@/api/services/reception', () => ({
  receptionService: {
    getPatient: vi.fn(),
  },
}))

vi.mock('@/api/services/triage', () => ({
  triageService: {
    getPatientAssessments: vi.fn(),
  },
}))

const mockPatient = {
  id: 'pat-101',
  full_name: 'Grace Mwangi',
  patient_number: 'PT-2001',
  date_of_birth: '1992-03-10',
  gender: 'female',
  phone_primary: '0712345678',
}

const mockHistoryVisits = [
  {
    visit_id: 'vis-101',
    assessed_at: '2026-08-10T09:00:00Z',
    created_at: '2026-08-10T09:00:00Z',
    triage_category: 'Urgent',
    chief_complaint: 'Severe abdominal pain',
    visit_status: 'completed',
    triage_notes: 'Patient administered analgesics',
    vitals: {
      blood_pressure_systolic: '130',
      blood_pressure_diastolic: '85',
      temperature: '37.8',
      pulse_rate: '88',
      oxygen_saturation: '98',
      respiratory_rate: '18',
      weight_kg: '65',
    },
  },
]

describe('TriageHistoryPatientPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(receptionService.getPatient).mockResolvedValue(mockPatient as any)
    vi.mocked(triageService.getPatientAssessments).mockResolvedValue(mockHistoryVisits as any)
  })

  it('renders patient demographics and triage history timeline', async () => {
    render(
      <MemoryRouter initialEntries={['/triage/history/pat-101']}>
        <Routes>
          <Route path="/triage/history/:patientId" element={<TriageHistoryPatientPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getAllByText('Grace Mwangi').length).toBeGreaterThan(0)
      expect(screen.getByText('PT-2001')).toBeInTheDocument()
      expect(screen.getByText('Severe abdominal pain')).toBeInTheDocument()
    })
  })

  it('renders not found when patient does not exist', async () => {
    vi.mocked(receptionService.getPatient).mockRejectedValue(new Error('Not found'))

    render(
      <MemoryRouter initialEntries={['/triage/history/pat-999']}>
        <Routes>
          <Route path="/triage/history/:patientId" element={<TriageHistoryPatientPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/visit not found/i)).toBeInTheDocument()
    })
  })
})
