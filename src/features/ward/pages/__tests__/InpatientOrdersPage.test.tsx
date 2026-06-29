import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { InpatientOrdersPage } from '../InpatientOrdersPage'

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe('InpatientOrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders active orders grouped by patient', () => {
    render(
      <MemoryRouter>
        <InpatientOrdersPage />
      </MemoryRouter>
    )

    // Verify page header
    expect(screen.getByText('Active Inpatient Orders')).toBeInTheDocument()

    // Verify patient groups and their orders
    expect(screen.getAllByText('Juma Hamisi').length).toBe(2)
    expect(screen.getByText('IV Artesunate 120mg stat')).toBeInTheDocument()
    expect(screen.getAllByText('Zuwena Said').length).toBe(2)
    expect(screen.getByText('Stat Blood Glucose check & electrolytes panel')).toBeInTheDocument()
  })

  it('filters orders list on order type selection change', () => {
    render(
      <MemoryRouter>
        <InpatientOrdersPage />
      </MemoryRouter>
    )

    const select = screen.getByLabelText('Order Type')
    
    // Filter by Medication
    fireEvent.change(select, { target: { value: 'Medication' } })
    expect(screen.getByText('IV Artesunate 120mg stat')).toBeInTheDocument()
    expect(screen.queryByText('Stat Blood Glucose check & electrolytes panel')).not.toBeInTheDocument() // This is Investigation
  })

  it('toggles the completion status of a pending order', () => {
    render(
      <MemoryRouter>
        <InpatientOrdersPage />
      </MemoryRouter>
    )

    // Get toggle switch checkboxes
    const toggleCheckboxes = screen.getAllByRole('checkbox')
    // Click toggle switch for first order (Juma Hamisi - IV Artesunate)
    fireEvent.click(toggleCheckboxes[0])

    // Verify success status appears (multiple Completed pills/text exist on page)
    expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(3)
  })

  it('opens the issue order modal and successfully adds a new medication order', () => {
    render(
      <MemoryRouter>
        <InpatientOrdersPage />
      </MemoryRouter>
    )

    // Click "New Order" button to open modal
    const newOrderBtn = screen.getByRole('button', { name: /new order/i })
    fireEvent.click(newOrderBtn)

    // Verify modal is open by looking for title
    expect(screen.getByText('Issue Inpatient Order')).toBeInTheDocument()

    // Select a patient
    const patientSelect = screen.getByLabelText('PATIENT SEARCH')
    fireEvent.change(patientSelect, { target: { value: 'p1' } }) // Fatuma Said (Bed 12)

    // Fill medication fields
    const drugInput = screen.getByLabelText('DRUG SEARCH')
    fireEvent.change(drugInput, { target: { value: 'Paracetamol' } })

    const doseInput = screen.getByLabelText('DOSE')
    fireEvent.change(doseInput, { target: { value: '500mg' } })

    const frequencySelect = screen.getByLabelText('FREQUENCY')
    fireEvent.change(frequencySelect, { target: { value: 'Daily' } })

    const routeSelect = screen.getByLabelText('ROUTE')
    fireEvent.change(routeSelect, { target: { value: 'PO (Oral)' } })

    // Click "Issue Order" submit button
    const issueBtn = screen.getByRole('button', { name: /issue order/i })
    fireEvent.click(issueBtn)

    // Verify modal is closed/disappeared
    expect(screen.queryByText('Issue Inpatient Order')).not.toBeInTheDocument()

    // Verify the new order appears in the document
    expect(screen.getByText('Paracetamol 500mg PO (Oral) Daily')).toBeInTheDocument()
  })
})
