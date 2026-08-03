import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { NursingNotesPage } from '../NursingNotesPage'
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
    getAdmission: vi.fn(),
    listNursingNotes: vi.fn(),
    createNursingNote: vi.fn(),
  },
}))

const mockAdmission = {
  admissionId: 'adm-juma',
  visitId: 'visit-juma',
  patientId: 'juma0000-aaaa-bbbb-cccc-000000000000',
  bedId: 'bed-3',
  admittingDoctorId: 'Dr. Joseph Lema',
  admittingDiagnosis: 'Severe Malaria w/ Complications',
  condition: 'critical' as const,
  admissionDate: '2026-07-15T00:00:00Z',
  status: 'active',
  wardName: 'General Ward',
  bedNumber: '03',
}

const mockNotes = [
  {
    noteId: 'note-1',
    admissionId: 'adm-juma',
    patientId: 'juma0000-aaaa-bbbb-cccc-000000000000',
    noteType: 'observation',
    noteText: 'Patient remains drowsy but responsive to verbal commands. Complains of mild headache.',
    vitalsBp: '110/70',
    vitalsTemp: 36.5,
    vitalsPulse: 72,
    vitalsSpo2: 97,
    vitalsRespRate: 14,
    authoredBy: 'Nurse Amina Masoud, RN',
    authoredAt: '2026-07-19T08:15:00Z',
  },
]

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/ward/patients/adm-juma/notes']}>
      <Routes>
        <Route path="/ward/patients/:patientId/notes" element={<NursingNotesPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('NursingNotesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(wardService.getAdmission).mockResolvedValue(mockAdmission as any)
    vi.mocked(wardService.listNursingNotes).mockResolvedValue(mockNotes as any)
    vi.mocked(wardService.createNursingNote).mockResolvedValue({
      noteId: 'note-new',
      authoredBy: 'Nurse On Duty',
      authoredAt: '2026-07-19T10:00:00Z',
    } as any)
  })

  it('renders patient header details and previous records history', async () => {
    renderPage()

    expect(await screen.findByText('Patient juma0000')).toBeInTheDocument()
    expect(screen.getByText('File: JUMA0000', { exact: false })).toBeInTheDocument()

    expect(screen.getByText('Nurse Amina Masoud, RN')).toBeInTheDocument()
    expect(
      screen.getByText('Patient remains drowsy but responsive to verbal commands. Complains of mild headache.')
    ).toBeInTheDocument()
  })

  it('highlights vital inputs when values are out of normal range', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByLabelText('Temperature (°C)')).toBeInTheDocument())

    const tempInput = screen.getByLabelText('Temperature (°C)')
    fireEvent.change(tempInput, { target: { value: '39.5' } })

    expect(screen.getByText('Range: 36.1 - 37.2 °C')).toHaveClass('text-rose-500')
  })

  it('submits a new nursing note entry successfully', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByLabelText('Observation')).toBeInTheDocument())

    const obsInput = screen.getByLabelText('Observation')
    const intInput = screen.getByLabelText('Intervention')
    const respInput = screen.getByLabelText('Patient Response')

    fireEvent.change(obsInput, { target: { value: 'Patient is stable.' } })
    fireEvent.change(intInput, { target: { value: 'Administered oral fluids.' } })
    fireEvent.change(respInput, { target: { value: 'No adverse reaction.' } })

    const submitBtn = screen.getByRole('button', { name: /save record notes/i })
    await act(async () => {
      fireEvent.click(submitBtn)
    })

    await waitFor(() => {
      expect(screen.getByText('Patient is stable.')).toBeInTheDocument()
    })
    expect(wardService.createNursingNote).toHaveBeenCalledWith('adm-juma', expect.objectContaining({
      noteType: 'observation',
    }))
  })
})
