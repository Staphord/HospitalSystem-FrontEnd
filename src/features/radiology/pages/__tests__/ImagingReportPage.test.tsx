import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ImagingReportPage } from '../ImagingReportPage'
import { radiologyService } from '@/api/services/radiology'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock radiologyService
vi.mock('@/api/services/radiology', () => ({
  radiologyService: {
    getRequest: vi.fn(),
    scheduleRequest: vi.fn().mockResolvedValue({}),
    performRequest: vi.fn().mockResolvedValue({}),
    saveReportDraft: vi.fn().mockResolvedValue({}),
    signReport: vi.fn().mockResolvedValue({}),
  },
}))

const mockReportRequest = {
  id: 'rad-rep-001',
  orderNumber: 'RAD-2026-005',
  patientName: 'Khadija Said',
  patientNumber: 'PT-3005',
  gender: 'female',
  age: '28 yrs',
  modality: 'xray',
  testName: 'Chest X-Ray PA View',
  priority: 'routine',
  status: 'in_progress',
  requestedAt: '2026-08-15 08:30',
  requestingDoctor: 'Dr. Sarah Kimaro',
  clinicalNotes: 'Persistent cough for 3 weeks',
  bodyPart: 'Chest',
  findings: 'Clear lung fields bilaterally.',
  impression: 'Normal chest radiograph.',
}

describe('ImagingReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(radiologyService.getRequest).mockResolvedValue(mockReportRequest as any)
  })

  it('renders radiology reporting interface with patient info and text editors', async () => {
    render(
      <MemoryRouter initialEntries={['/radiology/requests/rad-rep-001/report']}>
        <Routes>
          <Route path="/radiology/requests/:requestId/report" element={<ImagingReportPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Khadija Said')).toBeInTheDocument()
      expect(screen.getByText('PT-3005')).toBeInTheDocument()
      expect(screen.getByLabelText(/findings/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/impression/i)).toBeInTheDocument()
    })
  })

  it('renders not found when radiology request does not exist', async () => {
    vi.mocked(radiologyService.getRequest).mockRejectedValue(new Error('Not found'))

    render(
      <MemoryRouter initialEntries={['/radiology/requests/rad-none/report']}>
        <Routes>
          <Route path="/radiology/requests/:requestId/report" element={<ImagingReportPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/request not found/i)).toBeInTheDocument()
    })
  })
})
