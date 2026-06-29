import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { BedMapPage } from '../BedMapPage'

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe('BedMapPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders bed layout grid with status legend', () => {
    render(
      <MemoryRouter>
        <BedMapPage />
      </MemoryRouter>
    )

    // Verify page heading and legend are visible
    expect(screen.getByText('Bed Map — General Ward')).toBeInTheDocument()
    expect(screen.getByText('Stable')).toBeInTheDocument()
    expect(screen.getByText('Critical')).toBeInTheDocument()

    // Verify critical and available beds are visible
    expect(screen.getByText('Bed 301-A')).toBeInTheDocument()
    expect(screen.getByText('Bed 302-B')).toBeInTheDocument()
  })

  it('displays patient information popover when occupied bed is clicked', async () => {
    render(
      <MemoryRouter>
        <BedMapPage />
      </MemoryRouter>
    )

    // Click on Bed 301-A which is occupied by Juma Hamisi
    const occupiedBedCard = screen.getByText('Bed 301-A')
    fireEvent.click(occupiedBedCard)

    // Verify popover details appear
    expect(screen.getAllByText('Juma Hamisi').length).toBe(2)
    expect(screen.getByText(/HN-9821/)).toBeInTheDocument()
    expect(screen.getAllByText('Severe Malaria w/ Complications').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /record notes/i })).toBeInTheDocument()
  })

  it('opens assignment search popover when available bed is clicked', () => {
    render(
      <MemoryRouter>
        <BedMapPage />
      </MemoryRouter>
    )

    // Click on Bed 302-B which is available
    const availableBedCard = screen.getByText('Bed 302-B')
    fireEvent.click(availableBedCard)

    // Verify assignment panel is visible
    expect(screen.getByRole('heading', { name: /assign bed/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search patient name...')).toBeInTheDocument()

    // Search and select a patient to assign
    const searchInput = screen.getByPlaceholderText('Search patient name...')
    fireEvent.change(searchInput, { target: { value: 'Aisha' } })

    const patientRow = screen.getByText('Aisha Rashid')
    fireEvent.click(patientRow)

    // Verify bed status changes and patient name is rendered on the bed
    expect(screen.getByText('Aisha Rashid')).toBeInTheDocument()
  })
})
