import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ActiveVisitorsPage } from '../ActiveVisitorsPage'
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
    listActiveVisitors: vi.fn(),
    checkoutVisitor: vi.fn(),
  },
}))

const hamisi = {
  visitorId: 'v-1',
  visitorName: 'Hamisi Juma',
  patientName: 'Patient juma0000',
  bedLabel: 'Bed 03',
  relationship: 'Sibling',
  checkInAt: '2026-07-19T10:15:00Z',
  timeLeftSeconds: 600,
  allowedDurationMinutes: 30,
}

const anna = {
  visitorId: 'v-2',
  visitorName: 'Anna Kessy',
  patientName: 'Patient zuwena00',
  bedLabel: 'Bed 04',
  relationship: 'Parent',
  checkInAt: '2026-07-19T08:00:00Z',
  timeLeftSeconds: 0,
  allowedDurationMinutes: 30,
}

describe('ActiveVisitorsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.mocked(wardService.listActiveVisitors).mockResolvedValue([hamisi, anna] as any)
    vi.mocked(wardService.checkoutVisitor).mockResolvedValue({} as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders active visitors stats and lists current visitors with countdowns', async () => {
    render(
      <MemoryRouter>
        <ActiveVisitorsPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Total Visitors in Ward')).toBeInTheDocument()
    expect(screen.getByText('Within Time Limit')).toBeInTheDocument()
    expect(screen.getByText('Overstay Alerts')).toBeInTheDocument()

    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.getByText('Hamisi Juma')).toBeInTheDocument()
    expect(screen.getByText('Anna Kessy')).toBeInTheDocument()
    expect(screen.getByText('OVERSTAY EXCEEDED')).toBeInTheDocument()
  })

  it('toggles checkout inline confirmation panel on checkout button click', async () => {
    render(
      <MemoryRouter>
        <ActiveVisitorsPage />
      </MemoryRouter>
    )

    await act(async () => {
      await Promise.resolve()
    })

    const checkoutButtons = screen.getAllByRole('button', { name: /check out/i })
    fireEvent.click(checkoutButtons[0])

    expect(screen.getByText('Confirm?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument()

    vi.mocked(wardService.listActiveVisitors).mockResolvedValue([anna] as any)

    const yesBtn = screen.getByRole('button', { name: /yes/i })
    await act(async () => {
      fireEvent.click(yesBtn)
      await Promise.resolve()
    })

    expect(wardService.checkoutVisitor).toHaveBeenCalledWith('v-1')
  })
})
