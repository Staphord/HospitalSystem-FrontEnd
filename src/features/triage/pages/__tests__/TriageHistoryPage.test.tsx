import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { TriageHistoryPage } from '../TriageHistoryPage'
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
    searchHistory: vi.fn(),
  },
}))

const mockHistoryResponse = {
  patients: [
    {
      id: 'pat-001',
      name: 'Amina Juma',
      patientNumber: 'PT-1001',
      gender: 'Female',
      age: 34,
      lastTriageCategory: 'Urgent',
      lastAssessedAt: '2026-08-15 10:30',
      assessmentCount: 3,
    },
    {
      id: 'pat-002',
      name: 'David Mollel',
      patientNumber: 'PT-1002',
      gender: 'Male',
      age: 41,
      lastTriageCategory: 'Emergency',
      lastAssessedAt: '2026-08-14 09:15',
      assessmentCount: 1,
    },
  ],
  total: 2,
}

describe('TriageHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(triageService.searchHistory).mockResolvedValue(mockHistoryResponse as any)
  })

  it('renders triage history search page and recent patient list', async () => {
    render(
      <MemoryRouter>
        <TriageHistoryPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Amina Juma')).toBeInTheDocument()
      expect(screen.getByText('David Mollel')).toBeInTheDocument()
    })
  })

  it('searches for patient triage history records', async () => {
    vi.mocked(triageService.searchHistory).mockImplementation(async (query?: string) => {
      if (query === 'Amina') {
        return {
          patients: [mockHistoryResponse.patients[0]],
          total: 1,
        } as any
      }
      return mockHistoryResponse as any
    })

    render(
      <MemoryRouter>
        <TriageHistoryPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Amina Juma')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search patient by name or patient number/i)
    fireEvent.change(searchInput, { target: { value: 'Amina' } })

    await waitFor(() => {
      expect(screen.getByText('Search Results')).toBeInTheDocument()
    })
  })
})
