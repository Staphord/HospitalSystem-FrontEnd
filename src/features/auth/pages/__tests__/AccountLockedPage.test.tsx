import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AccountLockedPage } from '../AccountLockedPage'

describe('AccountLockedPage', () => {
  it('renders account locked notice and administrator contact actions', () => {
    render(
      <MemoryRouter>
        <AccountLockedPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Account Locked')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /contact administrator/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back to login/i })).toBeInTheDocument()
  })
})
