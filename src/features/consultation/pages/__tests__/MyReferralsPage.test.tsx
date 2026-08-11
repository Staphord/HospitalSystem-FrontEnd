import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { MyReferralsPage } from '../MyReferralsPage'
import { consultationService } from '@/api/services/consultation'
import { wardService } from '@/api/services/ward'

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

vi.mock('@/api/services/consultation', () => ({
  consultationService: {
    getReferrals: vi.fn(),
    createReferral: vi.fn(),
    updateReferralStatus: vi.fn(),
  },
}))

vi.mock('@/api/services/ward', () => ({
  wardService: {
    searchPatients: vi.fn().mockResolvedValue({ patients: [] }),
  },
}))

const mockRawReferrals = [
  {
    id: 'ref-1',
    patient: {
      id: 'pat-1',
      full_name: 'Arthur Dent',
      patient_number: 'PAT-001',
    },
    referred_to: 'Cardiology',
    type: 'internal',
    referred_at: '2026-07-14T10:00:00Z',
    reason: 'ECG anomaly detected',
    status: 'pending',
    urgency: 'urgent',
    category: 'Consultation',
  },
  {
    id: 'ref-2',
    patient: {
      id: 'pat-2',
      full_name: 'Ford Prefect',
      patient_number: 'PAT-002',
    },
    referred_to: 'Neurology',
    type: 'external',
    referred_at: '2026-07-12T09:00:00Z',
    reason: 'Chronic headaches',
    status: 'accepted',
    urgency: 'routine',
    category: 'Transfer',
  },
]

describe('MyReferralsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(consultationService.getReferrals).mockResolvedValue(mockRawReferrals as any)
    vi.mocked(wardService.searchPatients).mockResolvedValue({ patients: [] } as any)
  })

  it('renders summary stats and referral list on load', async () => {
    render(
      <MemoryRouter>
        <MyReferralsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(consultationService.getReferrals).toHaveBeenCalled()
      expect(screen.getByText('Arthur Dent')).toBeInTheDocument()
      expect(screen.getByText('Ford Prefect')).toBeInTheDocument()
    })
  })

  it('filters referrals by status select dropdown', async () => {
    render(
      <MemoryRouter>
        <MyReferralsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Arthur Dent')).toBeInTheDocument()
    })

    const statusSelect = screen.getAllByRole('combobox')[1]
    fireEvent.change(statusSelect, { target: { value: 'pending' } })

    await waitFor(() => {
      expect(screen.getByText('Arthur Dent')).toBeInTheDocument()
      expect(screen.queryByText('Ford Prefect')).not.toBeInTheDocument()
    })
  })

  it('opens New Referral Modal when clicking New Referral button', async () => {
    render(
      <MemoryRouter>
        <MyReferralsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Arthur Dent')).toBeInTheDocument()
    })

    const newBtn = screen.getByRole('button', { name: /new referral/i })
    fireEvent.click(newBtn)

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })
})
