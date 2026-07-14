import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { VisitQueuePage } from '../VisitQueuePage'
import { receptionService } from '@/api/services/reception'

// Mock toast notification
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock reception service
vi.mock('@/api/services/reception', () => ({
  receptionService: {
    getTriageQueue: vi.fn(),
    updateQueueStatus: vi.fn(),
    getPatientDetails: vi.fn(),
  },
}))

// Mock Date.now() to freeze time in tests
const MOCK_NOW = new Date('2026-07-14T10:45:00Z').getTime()

const mockQueueData = [
  {
    queue_id: 'q-1',
    queue_number: 'T-001',
    queue_type: 'triage',
    priority: 'non_urgent',
    status: 'waiting',
    created_at: '2026-07-14T10:30:00Z',
    patient: {
      patient_id: 'pat-1',
      patient_number: 'PT-001',
      full_name: 'Patient One',
    },
    visit: {
      visit_id: 'v-1',
      visit_number: 'VIS-001',
      payment_type: 'cash',
      status: 'registered',
      queue_number: 'T-001',
    },
  },
  {
    queue_id: 'q-2',
    queue_number: 'T-002',
    queue_type: 'triage',
    priority: 'urgent',
    status: 'completed',
    created_at: '2026-07-14T10:00:00Z',
    completed_at: '2026-07-14T10:15:00Z', // 15 mins wait time
    patient: {
      patient_id: 'pat-2',
      patient_number: 'PT-002',
      full_name: 'Patient Two',
    },
    visit: {
      visit_id: 'v-2',
      visit_number: 'VIS-002',
      payment_type: 'insurance',
      status: 'triaged',
      queue_number: 'T-002',
    },
  },
]

describe('VisitQueuePage', () => {
  let dateSpy: any

  beforeEach(() => {
    vi.clearAllMocks()
    dateSpy = vi.spyOn(Date, 'now').mockImplementation(() => MOCK_NOW)
    vi.mocked(receptionService.getTriageQueue).mockResolvedValue(mockQueueData)
  })

  afterEach(() => {
    dateSpy.mockRestore()
  })

  it('fetches and renders active queue items with correct Ticket numbers', async () => {
    render(
      <MemoryRouter>
        <VisitQueuePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      // In active view, only Patient One is shown
      expect(screen.getByText('Patient One')).toBeInTheDocument()
      expect(screen.queryByText('Patient Two')).not.toBeInTheDocument()

      // Verify Ticket column displays ticket number instead of sequential position index
      expect(screen.getByText('T-001')).toBeInTheDocument()
    })
  })

  it('filters between active queue and all history', async () => {
    render(
      <MemoryRouter>
        <VisitQueuePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Patient One')).toBeInTheDocument()
    })

    const historyBtn = screen.getByRole('button', { name: /all history/i })
    fireEvent.click(historyBtn)

    // Now both Patient One and Patient Two should be displayed
    await waitFor(() => {
      expect(screen.getByText('Patient One')).toBeInTheDocument()
      expect(screen.getByText('Patient Two')).toBeInTheDocument()
    })
  })

  it('calculates wait times dynamically or freezes them if completed/skipped', async () => {
    render(
      <MemoryRouter>
        <VisitQueuePage />
      </MemoryRouter>
    )

    // Wait for the data to finish loading
    await waitFor(() => {
      expect(screen.getByText('Patient One')).toBeInTheDocument()
    })

    // Select History view to see completed Patient Two
    const historyBtn = screen.getByRole('button', { name: /all history/i })
    fireEvent.click(historyBtn)

    await waitFor(() => {
      // Patient One wait time: 10:45 AM - 10:30 AM = 15 mins
      expect(screen.getAllByText('15 min')[0]).toBeInTheDocument()

      const waitCells = screen.getAllByText('15 min')
      expect(waitCells.length).toBe(2)
    })
  })

  it('allows changing page size pagination', async () => {
    // Generate 12 dummy patients
    const largeMockQueue = Array.from({ length: 12 }, (_, i) => ({
      ...mockQueueData[0],
      queue_id: `q-${i}`,
      queue_number: `T-00${i}`,
      patient: {
        patient_id: `pat-${i}`,
        patient_number: `PT-00${i}`,
        full_name: `Patient ${i}`,
      },
    }))
    vi.mocked(receptionService.getTriageQueue).mockResolvedValue(largeMockQueue)

    render(
      <MemoryRouter>
        <VisitQueuePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      // Default page size is 10
      expect(screen.getByText('Patient 0')).toBeInTheDocument()
      expect(screen.getByText('Patient 9')).toBeInTheDocument()
      expect(screen.queryByText('Patient 10')).not.toBeInTheDocument()
    })

    // Select page size dropdown
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: '5' } })

    // Only 5 patients should be visible now
    await waitFor(() => {
      expect(screen.getByText('Patient 0')).toBeInTheDocument()
      expect(screen.getByText('Patient 4')).toBeInTheDocument()
      expect(screen.queryByText('Patient 5')).not.toBeInTheDocument()
    })
  })

  it('allows removing a patient from queue', async () => {
    vi.mocked(receptionService.updateQueueStatus).mockResolvedValue({})

    render(
      <MemoryRouter>
        <VisitQueuePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Patient One')).toBeInTheDocument()
    })

    // Click Actions Menu button (querying by symbol text)
    const actionBtn = screen.getByText('more_vert').closest('button')
    expect(actionBtn).toBeInTheDocument()
    fireEvent.click(actionBtn!)

    // Click Remove from Queue
    const removeBtn = screen.getByRole('menuitem', { name: /remove/i })
    await act(async () => {
      fireEvent.click(removeBtn)
    })

    expect(receptionService.updateQueueStatus).toHaveBeenCalledWith('q-1', 'skipped')
  })
})
