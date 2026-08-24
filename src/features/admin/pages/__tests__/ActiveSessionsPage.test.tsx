import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ActiveSessionsPage } from '../ActiveSessionsPage'

const mockRevokeSession = vi.fn()
const mockRefreshSessions = vi.fn()

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    sessions: [
      {
        id: 'sess-1',
        staffId: 'usr-1',
        staffName: 'Dr. John Doe',
        staffRole: 'doctor',
        department: 'Consultation',
        ipAddress: '192.168.1.50',
        browser: 'Chrome 120',
        loginTime: '2026-08-15 08:00',
        lastActivity: '2 mins ago',
        status: 'active',
      },
    ],
    revokeSession: mockRevokeSession,
    refreshSessions: mockRefreshSessions,
    setActiveView: vi.fn(),
    alerts: [],
  }),
}))

describe('ActiveSessionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders active sessions monitor and staff details', () => {
    render(
      <MemoryRouter>
        <ActiveSessionsPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Active Sessions')).toBeInTheDocument()
    expect(screen.getByText('Dr. John Doe')).toBeInTheDocument()
    expect(screen.getByText('192.168.1.50')).toBeInTheDocument()
  })

  it('filters sessions by search input', () => {
    render(
      <MemoryRouter>
        <ActiveSessionsPage />
      </MemoryRouter>
    )

    const searchInput = screen.getByPlaceholderText(/filter by name, role/i)
    fireEvent.change(searchInput, { target: { value: 'Nonexistent' } })

    expect(screen.queryByText('Dr. John Doe')).not.toBeInTheDocument()
  })
})
