import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LabResultsPage } from '../LabResultsPage'

describe('LabResultsPage Component', () => {
  it('redirects legacy lab results route to laboratory requests list page', () => {
    render(
      <MemoryRouter initialEntries={['/laboratory/results']}>
        <Routes>
          <Route path="/laboratory/results" element={<LabResultsPage />} />
          <Route path="/laboratory/requests" element={<div>Lab Requests Destination</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Lab Requests Destination')).toBeInTheDocument()
  })
})
