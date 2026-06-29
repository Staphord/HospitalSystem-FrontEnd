import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { NursingNotesPage } from '../NursingNotesPage'

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe('NursingNotesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders patient header details and previous records history', () => {
    render(
      <MemoryRouter>
        <NursingNotesPage />
      </MemoryRouter>
    )

    // Verify patient header info
    expect(screen.getByText('Juma Hamisi')).toBeInTheDocument()
    expect(screen.getByText('File: HN-9821', { exact: false })).toBeInTheDocument()

    // Verify previous note entries render in history list
    expect(screen.getByText('Nurse Amina Masoud, RN')).toBeInTheDocument()
    expect(screen.getByText('Patient remains drowsy but responsive to verbal commands. Complains of mild headache.')).toBeInTheDocument()
  })

  it('highlights vital inputs when values are out of normal range', () => {
    render(
      <MemoryRouter>
        <NursingNotesPage />
      </MemoryRouter>
    )

    // Select temperature input and input high fever value
    const tempInput = screen.getByLabelText('Temperature (°C)')
    fireEvent.change(tempInput, { target: { value: '39.5' } })

    // Verify red highlighting hint message appears
    expect(screen.getByText('Range: 36.1 - 37.2 °C')).toHaveClass('text-rose-500')
  })

  it('submits a new nursing note entry successfully', () => {
    render(
      <MemoryRouter>
        <NursingNotesPage />
      </MemoryRouter>
    )

    // Enter notes description fields
    const obsInput = screen.getByLabelText('Observation')
    const intInput = screen.getByLabelText('Intervention')
    const respInput = screen.getByLabelText('Patient Response')

    fireEvent.change(obsInput, { target: { value: 'Patient is stable.' } })
    fireEvent.change(intInput, { target: { value: 'Administered oral fluids.' } })
    fireEvent.change(respInput, { target: { value: 'No adverse reaction.' } })

    const submitBtn = screen.getByRole('button', { name: /save record notes/i })
    fireEvent.click(submitBtn)

    // Verify the new note appears in the timeline list
    expect(screen.getByText('Patient is stable.')).toBeInTheDocument()
  })
})
