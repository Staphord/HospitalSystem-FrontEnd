import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { VisitorLogPage } from '../VisitorLogPage'

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe('VisitorLogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders visitor ledger with rows and hours banner', () => {
    render(
      <MemoryRouter>
        <VisitorLogPage />
      </MemoryRouter>
    )

    // Verify page headers
    expect(screen.getByText('Visitor Ledger')).toBeInTheDocument()
    expect(screen.getByText('Active Visiting Hours Enforced')).toBeInTheDocument()

    // Verify list rows
    expect(screen.getByText('Hamisi Juma')).toBeInTheDocument()
    expect(screen.getByText('Fatuma Hamisi')).toBeInTheDocument()
  })

  it('opens registration modal when log new visitor button is clicked', () => {
    render(
      <MemoryRouter>
        <VisitorLogPage />
      </MemoryRouter>
    )

    const addBtn = screen.getByRole('button', { name: /log new visitor/i })
    fireEvent.click(addBtn)

    // Verify modal header is rendered
    expect(screen.getByRole('heading', { name: /log new visitor/i })).toBeInTheDocument()
  })

  it('checks out an active visitor', () => {
    render(
      <MemoryRouter>
        <VisitorLogPage />
      </MemoryRouter>
    )

    // Get active check-out buttons
    const checkoutButtons = screen.getAllByRole('button', { name: /check out/i })
    fireEvent.click(checkoutButtons[0])

    // Verify status changes to departed (multiple instances including select filter option)
    expect(screen.getAllByText('Departed').length).toBeGreaterThanOrEqual(2)
  })
})
