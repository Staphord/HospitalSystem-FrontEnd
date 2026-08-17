import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ImpersonationSwitchPage } from '../ImpersonationSwitchPage'

describe('ImpersonationSwitchPage', () => {
  it('renders administrator impersonation warning and switch controls', () => {
    render(
      <MemoryRouter>
        <ImpersonationSwitchPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Switching to tenant preview')).toBeInTheDocument()
    expect(screen.getByText(/preparing a secure read-only session/i)).toBeInTheDocument()
  })
})
