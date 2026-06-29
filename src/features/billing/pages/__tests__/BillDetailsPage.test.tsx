import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { BillDetailsPage } from '../BillDetailsPage'

describe('BillDetailsPage', () => {
  it('renders invoice details, patient metadata, and department groupings', () => {
    render(
      <MemoryRouter>
        <BillDetailsPage />
      </MemoryRouter>
    )

    // Verify page headers
    expect(screen.getByText('Invoice Details')).toBeInTheDocument()
    expect(screen.getByText('Hassan Mwita')).toBeInTheDocument()
    expect(screen.getByText('PT-4889')).toBeInTheDocument()

    // Verify department charge groups and their subtotals
    expect(screen.getByText('Consultation')).toBeInTheDocument()
    expect(screen.getByText('Radiology')).toBeInTheDocument()
    expect(screen.getByText('Pharmacy')).toBeInTheDocument()
    expect(screen.getByText('Registration')).toBeInTheDocument()
  })

  it('calculates gross total, covered, and outstanding amounts correctly', () => {
    render(
      <MemoryRouter>
        <BillDetailsPage />
      </MemoryRouter>
    )

    // Verify billing pricing summaries
    expect(screen.getByText('Gross Invoice Total:')).toBeInTheDocument()
    expect(screen.getByText('Total Paid Amount:')).toBeInTheDocument()
    expect(screen.getByText('Outstanding Due:')).toBeInTheDocument()
  })
})
