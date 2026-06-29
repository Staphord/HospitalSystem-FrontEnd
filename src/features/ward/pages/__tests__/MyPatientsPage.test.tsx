import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { MyPatientsPage } from '../MyPatientsPage'

describe('MyPatientsPage', () => {
  it('renders admitted patients table with headers and data rows', () => {
    render(
      <MemoryRouter>
        <MyPatientsPage />
      </MemoryRouter>
    )

    // Verify page header
    expect(screen.getByText('My Admitted Patients')).toBeInTheDocument()

    // Verify table columns
    expect(screen.getByText('Bed #')).toBeInTheDocument()
    expect(screen.getByText('Patient Name')).toBeInTheDocument()
    expect(screen.getByText('Patient No')).toBeInTheDocument()

    // Verify mock patients are listed
    expect(screen.getByText('Juma Hamisi')).toBeInTheDocument()
    expect(screen.getByText('Zuwena Said')).toBeInTheDocument()
    expect(screen.getByText('HN-7721')).toBeInTheDocument()
  })

  it('filters patient rows based on search input query', () => {
    render(
      <MemoryRouter>
        <MyPatientsPage />
      </MemoryRouter>
    )

    const searchInput = screen.getByPlaceholderText('Search patient, bed, or file #...')
    
    // Filter by name Juma
    fireEvent.change(searchInput, { target: { value: 'Juma' } })
    expect(screen.getByText('Juma Hamisi')).toBeInTheDocument()
    expect(screen.queryByText('Neema Kessy')).not.toBeInTheDocument()
  })

  it('filters patient rows based on condition dropdown selection', () => {
    render(
      <MemoryRouter>
        <MyPatientsPage />
      </MemoryRouter>
    )

    const select = screen.getByRole('combobox')
    
    // Select Critical condition filter
    fireEvent.change(select, { target: { value: 'Critical' } })
    expect(screen.getByText('Juma Hamisi')).toBeInTheDocument()
    expect(screen.queryByText('Neema Kessy')).not.toBeInTheDocument() // Neema is Stable
  })
})
