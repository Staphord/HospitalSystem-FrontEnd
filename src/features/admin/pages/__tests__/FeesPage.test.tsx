import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { FeesPage } from '../FeesPage'
import { adminService } from '@/api/services/admin'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock adminService
vi.mock('@/api/services/admin', () => ({
  adminService: {
    listFeeSchedules: vi.fn().mockResolvedValue([
      {
        id: 'fee-1',
        name: 'General Doctor Consultation',
        category: 'CONSULTATION',
        amount: '25000',
        currency: 'TZS',
        active: true,
        insuranceCovered: false,
      },
    ]),
  },
}))

describe('FeesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(adminService.listFeeSchedules).mockResolvedValue([
      {
        id: 'fee-1',
        name: 'General Doctor Consultation',
        category: 'CONSULTATION',
        amount: '25000',
        currency: 'TZS',
        active: true,
        insuranceCovered: false,
      },
    ] as any)
  })

  it('renders hospital service fee directory and pricing tariffs', async () => {
    render(
      <MemoryRouter>
        <FeesPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Avg Fee (TZS)')).toBeInTheDocument()
      expect(screen.getByText('General Doctor Consultation')).toBeInTheDocument()
    })
  })
})
