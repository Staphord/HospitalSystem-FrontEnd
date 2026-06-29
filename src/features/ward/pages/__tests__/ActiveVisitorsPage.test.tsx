import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ActiveVisitorsPage } from '../ActiveVisitorsPage'

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe('ActiveVisitorsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders active visitors stats and lists current visitors with countdowns', () => {
    render(
      <MemoryRouter>
        <ActiveVisitorsPage />
      </MemoryRouter>
    )

    // Verify stats panel
    expect(screen.getByText('Total Visitors in Ward')).toBeInTheDocument()
    expect(screen.getByText('Within Time Limit')).toBeInTheDocument()
    expect(screen.getByText('Overstay Alerts')).toBeInTheDocument()

    // Verify current visitors are displayed
    expect(screen.getByText('Hamisi Juma')).toBeInTheDocument()
    expect(screen.getByText('Anna Kessy')).toBeInTheDocument()
    expect(screen.getByText('OVERSTAY EXCEEDED')).toBeInTheDocument()
  })

  it('toggles checkout inline confirmation panel on checkout button click', () => {
    render(
      <MemoryRouter>
        <ActiveVisitorsPage />
      </MemoryRouter>
    )

    // Click checkout for Hamisi Juma
    const checkoutButtons = screen.getAllByRole('button', { name: /check out/i })
    fireEvent.click(checkoutButtons[0])

    // Verify confirmation buttons appear
    expect(screen.getByText('Confirm?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument()

    // Click Yes to check out and verify the row is removed from list
    const yesBtn = screen.getByRole('button', { name: /yes/i })
    fireEvent.click(yesBtn)

    expect(screen.queryByText('Hamisi Juma')).not.toBeInTheDocument()
  })
})
