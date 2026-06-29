import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { TenantManagementPage } from '../TenantManagementPage'
import { useAuthStore } from '@/store/authStore'
import { server } from '@/tests/mocks/server'
import { http, HttpResponse } from 'msw'

const mockNavigate = vi.fn()

// Mock toast notification library
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function encodeMockToken(payload: Record<string, unknown>) {
  const str = JSON.stringify(payload)
  const base64 = btoa(unescape(encodeURIComponent(str)))
  const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `mockHeader.${base64url}.mockSignature`
}

describe('TenantManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    useAuthStore.setState({ accessToken: null, refreshToken: null })
  })

  it('renders skeleton loading state initially', async () => {
    render(
      <MemoryRouter>
        <TenantManagementPage />
      </MemoryRouter>
    )

    // Check table headers are present while loading
    expect(screen.getByText('Hospital Name')).toBeInTheDocument()
    expect(screen.getByText('Tenant ID')).toBeInTheDocument()
  })

  it('loads and displays mock tenants after loading completes', async () => {
    render(
      <MemoryRouter>
        <TenantManagementPage />
      </MemoryRouter>
    )

    // Wait for mock API data load to finish
    await waitFor(() => {
      expect(screen.getByText('Aga Khan Hospital')).toBeInTheDocument()
    }, { timeout: 3000 })

    expect(screen.getByText('Nairobi Hospital')).toBeInTheDocument()
    expect(screen.getByText('aga-khan')).toBeInTheDocument()
    expect(screen.getByText('nairobi-hosp')).toBeInTheDocument()
  })

  it('applies search filters correctly', async () => {
    render(
      <MemoryRouter>
        <TenantManagementPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Aga Khan Hospital')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search by name, city or ID...')
    
    // Filter down to Nairobi
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Nairobi' } })
    })

    expect(screen.getByText('Nairobi Hospital')).toBeInTheDocument()
    expect(screen.queryByText('Aga Khan Hospital')).not.toBeInTheDocument()
  })

  it('applies status dropdown filters correctly', async () => {
    render(
      <MemoryRouter>
        <TenantManagementPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Aga Khan Hospital')).toBeInTheDocument()
    })

    // Grab status filter select
    const statusSelect = screen.getAllByRole('combobox')[0]
    
    await act(async () => {
      fireEvent.change(statusSelect, { target: { value: 'suspended' } })
    })

    expect(screen.getByText('Nairobi Hospital')).toBeInTheDocument()
    expect(screen.queryByText('Aga Khan Hospital')).not.toBeInTheDocument()
  })

  it('toggles row action dropdown menu and triggers impersonation', async () => {
    const mockAccessToken = encodeMockToken({
      sub: 'superadmin-sub',
      username: 'superadmin',
      realm_access: { roles: ['super_admin'] },
      tenant_id: null,
      exp: Math.floor(Date.now() / 1000) + 3600,
    })

    // Set mock store access token
    useAuthStore.setState({
      accessToken: mockAccessToken,
      refreshToken: 'test-original-refresh',
    })

    render(
      <MemoryRouter>
        <TenantManagementPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Aga Khan Hospital')).toBeInTheDocument()
    })

    // Click actions button (⋮) on the active row
    const actionButtons = screen.getAllByText('⋮')
    
    await act(async () => {
      fireEvent.click(actionButtons[0])
    })

    // Assert actions menu pops up
    expect(screen.getByText('View details')).toBeInTheDocument()
    expect(screen.getByText('Impersonate')).toBeInTheDocument()
    expect(screen.getByText('Suspend')).toBeInTheDocument()

    // Trigger Impersonation Action
    const impersonateBtn = screen.getByText('Impersonate')
    
    await act(async () => {
      fireEvent.click(impersonateBtn)
    })

    expect(mockNavigate).toHaveBeenCalledWith(
      '/impersonation/switching?tenant_id=aga-khan&return_to=/admin/dashboard',
      { replace: true },
    )
  })

  it('renders empty state when no hospitals exist', async () => {
    // Override MSW handler to return empty list
    server.use(
      http.get('http://localhost:8000/api/v1/superadmin/tenants', () => {
        return HttpResponse.json([])
      })
    )

    render(
      <MemoryRouter>
        <TenantManagementPage />
      </MemoryRouter>
    )

    // Wait for list to load
    await waitFor(() => {
      expect(screen.getByText('No Hospitals Found')).toBeInTheDocument()
    })

    expect(screen.getByText(/We couldn't find any onboarded hospital tenants/i)).toBeInTheDocument()
  })

  it('handles pagination correctly when there are multiple pages of hospitals', async () => {
    // Override MSW handler to return 7 tenants (since page size is 5)
    server.use(
      http.get('http://localhost:8000/api/v1/superadmin/tenants', () => {
        return HttpResponse.json([
          { tenant_id: 't-1', name: 'Hospital 1', status: 'active', is_active: true },
          { tenant_id: 't-2', name: 'Hospital 2', status: 'active', is_active: true },
          { tenant_id: 't-3', name: 'Hospital 3', status: 'active', is_active: true },
          { tenant_id: 't-4', name: 'Hospital 4', status: 'active', is_active: true },
          { tenant_id: 't-5', name: 'Hospital 5', status: 'active', is_active: true },
          { tenant_id: 't-6', name: 'Hospital 6', status: 'active', is_active: true },
          { tenant_id: 't-7', name: 'Hospital 7', status: 'active', is_active: true },
        ])
      })
    )

    render(
      <MemoryRouter>
        <TenantManagementPage />
      </MemoryRouter>
    )

    // Wait for first page to load
    await waitFor(() => {
      expect(screen.getByText('Hospital 1')).toBeInTheDocument()
    })

    // First page items should be rendered
    expect(screen.getByText('Hospital 5')).toBeInTheDocument()
    // Second page items should NOT be rendered
    expect(screen.queryByText('Hospital 6')).not.toBeInTheDocument()

    // Find and click page button "2" or chevron right
    const nextBtn = screen.getByRole('button', { name: '2' })
    await act(async () => {
      fireEvent.click(nextBtn)
    })

    // Now Hospital 6 and 7 should be rendered
    expect(screen.getByText('Hospital 6')).toBeInTheDocument()
    expect(screen.getByText('Hospital 7')).toBeInTheDocument()
    // Hospital 1 should NOT be rendered anymore
    expect(screen.queryByText('Hospital 1')).not.toBeInTheDocument()
  })
})
