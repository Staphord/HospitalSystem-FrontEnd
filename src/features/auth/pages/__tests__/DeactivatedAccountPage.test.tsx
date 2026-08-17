import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { DeactivatedAccountPage } from '../DeactivatedAccountPage'

describe('DeactivatedAccountPage', () => {
  it('renders account deactivated alert and support contact option', () => {
    render(
      <MemoryRouter>
        <DeactivatedAccountPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Access Suspended')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /contact support desk/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back to login/i })).toBeInTheDocument()
  })
})
