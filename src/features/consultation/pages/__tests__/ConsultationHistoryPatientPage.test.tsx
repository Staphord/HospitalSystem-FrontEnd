import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ConsultationHistoryPatientPage } from '../ConsultationHistoryPatientPage'
import { wardService } from '@/api/services/ward'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/api/services/ward', () => ({
  wardService: {
    getPatientHistory: vi.fn(),
  },
}))

const mockPatientHistory = {
  patient: {
    patient_id: 'pat-100',
    patient_number: 'PAT-100',
    full_name: 'Alice Wonder',
    date_of_birth: '1995-05-15',
    gender: 'female',
    phone: '123456789',
    blood_group: 'O+',
  },
  previous_visits: [],
}

describe('ConsultationHistoryPatientPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state then patient history content on success', async () => {
    vi.mocked(wardService.getPatientHistory).mockResolvedValue(mockPatientHistory as any)

    render(
      <MemoryRouter initialEntries={['/consultation/history/pat-100']}>
        <Routes>
          <Route path="/consultation/history/:patientId" element={<ConsultationHistoryPatientPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(wardService.getPatientHistory).toHaveBeenCalledWith('pat-100')
      expect(screen.getAllByText('Alice Wonder').length).toBeGreaterThan(0)
    })
  })

  it('renders patient not found error state when API fails', async () => {
    vi.mocked(wardService.getPatientHistory).mockRejectedValue(new Error('Patient not found in system'))

    render(
      <MemoryRouter initialEntries={['/consultation/history/pat-999']}>
        <Routes>
          <Route path="/consultation/history/:patientId" element={<ConsultationHistoryPatientPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Patient not found')).toBeInTheDocument()
      expect(screen.getByText('Patient not found in system')).toBeInTheDocument()
    })

    const backBtn = screen.getByRole('button', { name: /back to patient history/i })
    fireEvent.click(backBtn)
    expect(mockNavigate).toHaveBeenCalledWith('/consultation/history')
  })
})
