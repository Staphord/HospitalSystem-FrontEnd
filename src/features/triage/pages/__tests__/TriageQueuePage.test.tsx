import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { TriageQueuePage } from '../TriageQueuePage'
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
  },
}))

const mockQueueResponse = {
  queue: [
    {
      queue_id: 'q-1',
      queue_number: 'TR-001',
      status: 'waiting',
      priority: 'emergency',
      created_at: new Date().toISOString(),
      patient: {
        patient_id: 'pat-001',
        patient_number: 'PT-1001',
        full_name: 'Amina Juma',
        date_of_birth: '1990-01-01',
        gender: 'female',
      },
      visit: {
        visit_id: 'vis-001',
        payment_type: 'cash',
        visit_type: 'walk-in',
      },
    },
    {
      queue_id: 'q-2',
      queue_number: 'TR-002',
      status: 'waiting',
      priority: 'routine',
      created_at: new Date().toISOString(),
      patient: {
        patient_id: 'pat-002',
        patient_number: 'PT-1002',
        full_name: 'David Mollel',
        date_of_birth: '1985-05-15',
        gender: 'male',
      },
      visit: {
        visit_id: 'vis-002',
        payment_type: 'insurance',
        visit_type: 'referral',
      },
    },
  ],
  total: 2,
}

describe('TriageQueuePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(triageService.getQueue).mockResolvedValue(mockQueueResponse as any)
  })

  it('renders triage queue summary metrics and patient list', async () => {
    render(
      <MemoryRouter>
        <TriageQueuePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Amina Juma')).toBeInTheDocument()
      expect(screen.getByText('David Mollel')).toBeInTheDocument()
      expect(screen.getByText('TR-001')).toBeInTheDocument()
      expect(screen.getByText('TR-002')).toBeInTheDocument()
    })
  })

  it('filters queue items by priority level', async () => {
    render(
      <MemoryRouter>
        <TriageQueuePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Amina Juma')).toBeInTheDocument()
      expect(screen.getByText('David Mollel')).toBeInTheDocument()
    })

    const emergencyFilter = screen.getByRole('button', { name: /emergency/i })
    fireEvent.click(emergencyFilter)

    expect(screen.getByText('Amina Juma')).toBeInTheDocument()
    expect(screen.queryByText('David Mollel')).not.toBeInTheDocument()
  })

  it('filters queue items by search input', async () => {
    render(
      <MemoryRouter>
        <TriageQueuePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Amina Juma')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search patient, ticket or ID...')
    fireEvent.change(searchInput, { target: { value: 'David' } })

    expect(screen.getByText('David Mollel')).toBeInTheDocument()
    expect(screen.queryByText('Amina Juma')).not.toBeInTheDocument()
  })
})
