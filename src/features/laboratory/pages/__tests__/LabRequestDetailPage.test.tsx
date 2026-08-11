import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LabRequestDetailPage } from '../LabRequestDetailPage'
import { laboratoryService } from '@/api/services/laboratory'

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

vi.mock('@/api/services/laboratory', () => ({
  laboratoryService: {
    getRequestDetail: vi.fn(),
    collectSpecimen: vi.fn(),
    createResult: vi.fn(),
    updateResult: vi.fn(),
    verifyResult: vi.fn(),
  },
}))

const mockDetailData = {
  request_id: 'REQ-100',
  visit_id: 'VIS-100',
  patient_id: 'PAT-100',
  patient_number: 'HN-1001',
  test_name: 'Full Blood Count',
  test_code: 'FBC',
  urgency: 'stat',
  status: 'pending',
  requested_by_name: 'Dr. Sarah Connor',
  requested_at: '2026-07-30T09:00:00Z',
  clinical_indication: 'Suspected severe anemia',
  patient: {
    full_name: 'Jane Doe',
    patient_number: 'HN-1001',
    gender: 'female',
    date_of_birth: '1992-05-15',
  },
  specimen: null,
  result: null,
}

describe('LabRequestDetailPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(laboratoryService.getRequestDetail).mockResolvedValue(mockDetailData as any)
  })

  it('renders lab request details and patient information', async () => {
    render(
      <MemoryRouter initialEntries={['/laboratory/requests/REQ-100']}>
        <Routes>
          <Route path="/laboratory/requests/:requestId" element={<LabRequestDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(laboratoryService.getRequestDetail).toHaveBeenCalledWith('REQ-100')
      expect(screen.getByText('Full Blood Count')).toBeInTheDocument()
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
      expect(screen.getByText('HN-1001')).toBeInTheDocument()
    })
  })

  it('opens collect specimen modal when collect specimen action is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/laboratory/requests/REQ-100']}>
        <Routes>
          <Route path="/laboratory/requests/:requestId" element={<LabRequestDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Full Blood Count')).toBeInTheDocument()
    })

    const collectBtns = screen.getAllByRole('button', { name: /collect specimen/i })
    expect(collectBtns.length).toBeGreaterThan(0)
    fireEvent.click(collectBtns[0])

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  it('allows entering and creating a new lab result draft', async () => {
    vi.mocked(laboratoryService.createResult).mockResolvedValue({} as any)

    render(
      <MemoryRouter initialEntries={['/laboratory/requests/REQ-100']}>
        <Routes>
          <Route path="/laboratory/requests/:requestId" element={<LabRequestDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Full Blood Count')).toBeInTheDocument()
    })

    const resultInput = screen.getByPlaceholderText(/e\.g\. 14\.2 or Positive/i)
    fireEvent.change(resultInput, { target: { value: '11.5' } })

    const saveBtn = screen.getByRole('button', { name: /save result draft/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(laboratoryService.createResult).toHaveBeenCalledWith('REQ-100', expect.objectContaining({
        result_value: '11.5',
      }))
    })
  })

  it('renders not found UI when API error occurs', async () => {
    vi.mocked(laboratoryService.getRequestDetail).mockRejectedValue(new Error('Not found'))

    render(
      <MemoryRouter initialEntries={['/laboratory/requests/REQ-999']}>
        <Routes>
          <Route path="/laboratory/requests/:requestId" element={<LabRequestDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/lab request not found/i)).toBeInTheDocument()
    })
  })
})
