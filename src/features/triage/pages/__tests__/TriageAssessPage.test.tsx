import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { TriageAssessPage } from '../TriageAssessPage'
import { triageService } from '@/api/services/triage'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock triageService
vi.mock('@/api/services/triage', () => ({
  triageService: {
    getQueue: vi.fn(),
    callPatient: vi.fn().mockResolvedValue({}),
    saveAssessment: vi.fn().mockResolvedValue({ success: true }),
    getCategorySuggestion: vi.fn().mockResolvedValue({
      suggested_category: 'urgent',
      reason: 'Elevated blood pressure',
    }),
  },
}))

const mockQueueResponse = {
  queue: [
    {
      queue_id: 'q-101',
      queue_number: 'TR-010',
      status: 'waiting',
      priority: 'urgent',
      created_at: new Date().toISOString(),
      patient: {
        patient_id: 'pat-101',
        patient_number: 'PT-2001',
        full_name: 'Grace Mwangi',
        date_of_birth: '1992-03-10',
        gender: 'female',
      },
      visit: {
        visit_id: 'vis-101',
        payment_type: 'cash',
        visit_type: 'walk-in',
      },
    },
  ],
  total: 1,
}

describe('TriageAssessPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(triageService.getQueue).mockResolvedValue(mockQueueResponse as any)
  })

  it('resolves visit from queue and renders vital signs assessment form', async () => {
    render(
      <MemoryRouter initialEntries={['/triage/assess/vis-101']}>
        <Routes>
          <Route path="/triage/assess/:visitId" element={<TriageAssessPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Grace Mwangi')).toBeInTheDocument()
      expect(screen.getByText('PT-2001')).toBeInTheDocument()
    })

    // Check vital sign inputs
    expect(screen.getByText('BP Systolic')).toBeInTheDocument()
    expect(screen.getByText('BP Diastolic')).toBeInTheDocument()
    expect(screen.getByText('Temperature')).toBeInTheDocument()
    expect(screen.getByText('Pulse Rate')).toBeInTheDocument()
  })

  it('renders not found state when visit does not exist in queue', async () => {
    vi.mocked(triageService.getQueue).mockResolvedValue({ queue: [], total: 0 } as any)

    render(
      <MemoryRouter initialEntries={['/triage/assess/vis-999']}>
        <Routes>
          <Route path="/triage/assess/:visitId" element={<TriageAssessPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/visit not found/i)).toBeInTheDocument()
    })
  })
})
