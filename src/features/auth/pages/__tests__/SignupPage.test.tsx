import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { SignupPage } from '../SignupPage'

describe('SignupPage', () => {
  it('renders hospital registration header and placeholder state', () => {
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Signup form coming soon')).toBeInTheDocument()
    expect(screen.getByText(/this page will connect to/i)).toBeInTheDocument()
    expect(screen.getByText(/already have an account\?/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
  })
})
