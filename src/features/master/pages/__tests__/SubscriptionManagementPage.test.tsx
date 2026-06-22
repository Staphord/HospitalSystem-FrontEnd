import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { SubscriptionManagementPage } from '../SubscriptionManagementPage'
import { server } from '@/tests/mocks/server'
import { http, HttpResponse } from 'msw'

// Mock toast notification library
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('SubscriptionManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders active subscriptions tab and loads lists by default', async () => {
    render(
      <MemoryRouter>
        <SubscriptionManagementPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Active Subscriptions')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/search by hospital name, plan tier/i)).toBeInTheDocument()

    // Wait for list to render
    await waitFor(() => {
      expect(screen.getByText('Aga Khan Hospital')).toBeInTheDocument()
    })

    expect(screen.getByText('premium')).toBeInTheDocument()
  })

  it('renders subscription tiers tab and displays plans with corresponding badges', async () => {
    render(
      <MemoryRouter>
        <SubscriptionManagementPage />
      </MemoryRouter>
    )

    // Switch tab to Tiers
    const tiersTabBtn = screen.getByRole('button', { name: /subscription tiers/i })
    await act(async () => {
      fireEvent.click(tiersTabBtn)
    })

    // Wait for plans to load
    await waitFor(() => {
      expect(screen.getByText('Basic')).toBeInTheDocument()
    })

    expect(screen.getByText('Premium')).toBeInTheDocument()

    // Verify Premium has the special badge
    expect(screen.getByText('Most Popular')).toBeInTheDocument()
  })

  it('toggles Edit Plan modal on clicking action triggers', async () => {
    render(
      <MemoryRouter>
        <SubscriptionManagementPage />
      </MemoryRouter>
    )

    // Switch to tiers tab
    const tiersTabBtn = screen.getByRole('button', { name: /subscription tiers/i })
    await act(async () => {
      fireEvent.click(tiersTabBtn)
    })

    await waitFor(() => {
      expect(screen.getByText('Basic')).toBeInTheDocument()
    })

    // Click edit on the first card
    const editBtns = screen.getAllByRole('button', { name: /edit plan tiers/i })
    await act(async () => {
      fireEvent.click(editBtns[0])
    })

    // Verify modal elements render
    expect(screen.getByText(/Edit Plan Configuration/i)).toBeInTheDocument()
    expect(screen.getByText('Plan Name')).toBeInTheDocument()
  })

  it('applies Amber row highlight for expiring subscriptions and Red row highlight for grace/suspended subscriptions', async () => {
    // Override default MSW handler to return custom subscriptions
    server.use(
      http.get('http://localhost:8000/api/v1/superadmin/subscriptions', () => {
        const testNow = new Date()
        const dateExpiringSoon = new Date(testNow.getTime() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0] // Expiring in 5 days
        const dateActive = new Date(testNow.getTime() + 20 * 24 * 3600 * 1000).toISOString().split('T')[0] // Expiring in 20 days

        return HttpResponse.json([
          {
            subscription_id: 'sub-expiring',
            tenant_id: 'aga-khan',
            plan_name: 'premium',
            end_date: dateExpiringSoon,
            status: 'active',
          },
          {
            subscription_id: 'sub-suspended',
            tenant_id: 'aga-khan',
            plan_name: 'basic',
            end_date: dateActive,
            status: 'suspended',
          },
          {
            subscription_id: 'sub-active-ok',
            tenant_id: 'aga-khan',
            plan_name: 'basic',
            end_date: dateActive,
            status: 'active',
          },
        ])
      })
    )

    render(
      <MemoryRouter>
        <SubscriptionManagementPage />
      </MemoryRouter>
    )

    // Wait for list to render
    await waitFor(() => {
      expect(screen.getAllByText('Aga Khan Hospital')[0]).toBeInTheDocument()
    })

    // Grab the table rows
    const rows = screen.getAllByRole('row')
    
    // We expect 4 rows total: 1 header row + 3 data rows
    expect(rows.length).toBe(4)

    // The first data row (sub-expiring) should have amber background color style (rgba(255, 171, 0, 0.08))
    const expiringRow = rows[1]
    expect(expiringRow.style.backgroundColor).toBe('rgba(255, 171, 0, 0.08)')

    // The second data row (sub-suspended) should have red background color style (rgba(255, 86, 48, 0.08))
    const suspendedRow = rows[2]
    expect(suspendedRow.style.backgroundColor).toBe('rgba(255, 86, 48, 0.08)')

    // The third data row (sub-active-ok) should not have any row highlight style
    const activeRow = rows[3]
    expect(activeRow.style.backgroundColor).toBe('')
  })
})
