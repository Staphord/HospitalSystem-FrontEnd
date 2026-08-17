import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { MfaSelectionPage } from '../MfaSelectionPage'

describe('MfaSelectionPage', () => {
  it('renders MFA method choices (Authenticator App and Email)', () => {
    render(
      <MemoryRouter>
        <MfaSelectionPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Two-Step Verification')).toBeInTheDocument()
    expect(screen.getByText('Authenticator App')).toBeInTheDocument()
    expect(screen.getByText('Email verification')).toBeInTheDocument()
  })

  it('allows selecting email method and proceeding', () => {
    render(
      <MemoryRouter>
        <MfaSelectionPage />
      </MemoryRouter>
    )

    const emailOption = screen.getByText('Email verification')
    fireEvent.click(emailOption)

    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
  })
})
