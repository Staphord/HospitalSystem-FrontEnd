import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ReportsDashboardPage } from '../ReportsDashboardPage'

describe('ReportsDashboardPage', () => {
  it('renders report navigation cards for patient, revenue, and operational reports', () => {
    render(
      <MemoryRouter>
        <ReportsDashboardPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Patient Reports')).toBeInTheDocument()
    expect(screen.getByText('Revenue Reports')).toBeInTheDocument()
    expect(screen.getByText('Operational Reports')).toBeInTheDocument()
  })
})
