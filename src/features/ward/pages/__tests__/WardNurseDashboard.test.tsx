import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { WardNurseDashboard } from '../WardNurseDashboard'

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe('WardNurseDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders stats, new admission alert, and patient preview lists', () => {
    render(
      <MemoryRouter>
        <WardNurseDashboard />
      </MemoryRouter>
    )

    // Verify key section headings are rendered
    expect(screen.getByText('Critical Patients Preview')).toBeInTheDocument()
    expect(screen.getByText('Pending Inpatient Orders')).toBeInTheDocument()

    // Verify stats cards are rendered
    expect(screen.getByText('Admitted Patients')).toBeInTheDocument()
    expect(screen.getByText('Beds Occupied')).toBeInTheDocument()
    expect(screen.getByText('Critical Cases')).toBeInTheDocument()

    // Verify doctor's new admission alert banner is visible
    expect(screen.getByText('New Patient Admitted from Emergency / Outpatient')).toBeInTheDocument()
    expect(screen.getByText('Aisha Rashid')).toBeInTheDocument()

    expect(screen.getAllByText('Juma Hamisi').length).toBeGreaterThan(0)
    expect(screen.getByText('IV Artesunate 120mg')).toBeInTheDocument()
  })

  it('dismisses the new admission alert banner on click', () => {
    render(
      <MemoryRouter>
        <WardNurseDashboard />
      </MemoryRouter>
    )

    const dismissBtn = screen.getByTitle('Dismiss Alert')
    fireEvent.click(dismissBtn)

    // Verify banner is removed from view
    expect(screen.queryByText('New Patient Admitted from Emergency / Outpatient')).not.toBeInTheDocument()
  })

  it('marks a pending order as completed', () => {
    render(
      <MemoryRouter>
        <WardNurseDashboard />
      </MemoryRouter>
    )

    const doneButtons = screen.getAllByTitle('Mark as Done')
    fireEvent.click(doneButtons[0])

    // Verify order is removed from the pending list
    expect(screen.queryByText('IV Artesunate 120mg')).not.toBeInTheDocument()
  })
})
