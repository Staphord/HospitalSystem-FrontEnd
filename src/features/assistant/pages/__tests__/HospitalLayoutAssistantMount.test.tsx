import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { HospitalLayout } from '@/app/layout/HospitalLayout'

/**
 * Acceptance check for the mount point itself: the assistant launcher belongs to
 * the authenticated hospital shell, exactly once, rather than being added per
 * page. Rendering the real HospitalLayout is what makes that a guarantee rather
 * than an assumption about a single line of JSX.
 */

const auth = vi.hoisted(() => ({
  current: {
    isAuthenticated: true,
    isReadOnly: false,
    roles: ['receptionist'] as string[],
    user: { role: 'receptionist' } as { role: string } | null,
  },
}))

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => auth.current }))

// The shell's chrome is not under test here, and each piece pulls in its own
// data fetching. Stubbing it keeps this test about the mount point.
vi.mock('@/app/layout/Sidebar', () => ({ Sidebar: () => <nav data-testid="sidebar" /> }))
vi.mock('@/app/layout/Topbar', () => ({ Topbar: () => <header data-testid="topbar" /> }))
vi.mock('@/app/layout/ReceptionMobileNav', () => ({ ReceptionMobileNav: () => null }))
vi.mock('@/app/layout/ImpersonationBanner', () => ({ ImpersonationBanner: () => null }))
vi.mock('@/features/admin/context/AppContext', () => ({
  AppProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/api/services/assistant', () => ({
  assistantService: { chat: vi.fn(), sendFeedback: vi.fn() },
}))

function renderShell() {
  return render(
    <MemoryRouter initialEntries={['/reception']}>
      <Routes>
        <Route element={<HospitalLayout />}>
          <Route path="/reception" element={<div>Reception page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('HospitalLayout assistant mount', () => {
  beforeEach(() => {
    localStorage.clear()
    auth.current = {
      isAuthenticated: true,
      isReadOnly: false,
      roles: ['receptionist'],
      user: { role: 'receptionist' },
    }
  })

  it('mounts exactly one assistant launcher in the authenticated shell', () => {
    renderShell()

    expect(screen.getByText('Reception page')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /open hospital assistant/i })).toHaveLength(1)
  })

  it('does not mount the launcher during a read-only impersonation session', () => {
    auth.current = { ...auth.current, isReadOnly: true }
    renderShell()

    expect(screen.getByText('Reception page')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /hospital assistant/i })).not.toBeInTheDocument()
  })

  it('does not mount the launcher for a platform super admin', () => {
    auth.current = { ...auth.current, roles: ['super_admin'], user: { role: 'super_admin' } }
    renderShell()

    expect(screen.queryByRole('button', { name: /hospital assistant/i })).not.toBeInTheDocument()
  })
})
