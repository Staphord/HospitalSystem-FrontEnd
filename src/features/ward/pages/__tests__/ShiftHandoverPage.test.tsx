import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ShiftHandoverPage } from '../ShiftHandoverPage'

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe('ShiftHandoverPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('hf_mock_admitted_patients', JSON.stringify([
      { id: 'p1', name: 'Juma Hamisi', bed: 'Bed 301-A', activeVisitors: 2, condition: 'Critical' },
      { id: 'p2', name: 'Zuwena Said', bed: 'Bed 301-B', activeVisitors: 1, condition: 'Critical' }
    ]))
  })

  it('renders shift handover form and previous handovers list', () => {
    render(
      <MemoryRouter>
        <ShiftHandoverPage />
      </MemoryRouter>
    )

    // Verify page header
    expect(screen.getByText('Shift Handover')).toBeInTheDocument()

    // Verify patient table list
    expect(screen.getByText('Juma Hamisi')).toBeInTheDocument()
    expect(screen.getByText('Zuwena Said')).toBeInTheDocument()
  })

  it('submits shift handover details and validates fields', () => {
    render(
      <MemoryRouter>
        <ShiftHandoverPage />
      </MemoryRouter>
    )

    // Input overall summary
    const summaryInput = screen.getByPlaceholderText(/describe general ward issues/i)
    fireEvent.change(summaryInput, { target: { value: 'Shift was calm. No major incidents.' } })

    const submitBtn = screen.getByRole('button', { name: /submit handover/i })
    fireEvent.click(submitBtn)

    // Switch to history tab and verify it's there
    const historyTabBtn = screen.getByRole('button', { name: /handover history/i })
    fireEvent.click(historyTabBtn)
    expect(screen.getByText(/Nurse Esther Komba/)).toBeInTheDocument()
  })

  it('opens read-only details modal when previous report button is clicked', () => {
    render(
      <MemoryRouter>
        <ShiftHandoverPage />
      </MemoryRouter>
    )

    // Switch to history tab
    const historyTabBtn = screen.getByRole('button', { name: /handover history/i })
    fireEvent.click(historyTabBtn)

    // Click view report
    const viewReportButtons = screen.getAllByRole('button', { name: /view report/i })
    fireEvent.click(viewReportButtons[0])

    // Verify report details modal is opened
    expect(screen.getByRole('heading', { name: 'Shift Handover Report Details' })).toBeInTheDocument()
    expect(screen.getByText(/Nurse John S./)).toBeInTheDocument()
    expect(screen.getByText(/Stable overnight, vital signs monitored hourly./i)).toBeInTheDocument()
  })
})
