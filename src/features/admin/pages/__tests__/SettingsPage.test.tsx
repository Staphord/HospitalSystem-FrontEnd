import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { SettingsPage } from '../SettingsPage'
import { adminService } from '@/api/services/admin'
import { masterService } from '@/api/services/master'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock useApp
vi.mock('@/features/admin/context/AppContext', () => ({
  useApp: () => ({
    setActiveView: vi.fn(),
  }),
}))

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { role: 'hospital_admin' },
    roles: ['hospital_admin'],
  }),
}))

// Mock services
vi.mock('@/api/services/admin', () => ({
  adminService: {
    getHospitalProfile: vi.fn().mockResolvedValue({
      name: 'St. Mary Hospital',
      address: '123 Hospital Road',
      city: 'Dar es Salaam',
      country: 'Tanzania',
      phone: '0712345678',
      email: 'info@stmary.org',
    }),
    getSettings: vi.fn().mockResolvedValue({}),
    updateHospitalProfile: vi.fn().mockResolvedValue({}),
    updateSettings: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('@/api/services/master', () => ({
  masterService: {
    getMySubscription: vi.fn().mockResolvedValue([]),
    listSubscriptions: vi.fn().mockResolvedValue([]),
  },
}))

describe('SettingsPage (Admin)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(adminService.getSettings).mockResolvedValue({
      hospital_name: 'St. Mary Hospital',
      address: '123 Hospital Road',
      city: 'Dar es Salaam',
      country: 'Tanzania',
      phone: '0712345678',
      email: 'info@stmary.org',
    } as any)
    vi.mocked(masterService.getMySubscription).mockResolvedValue([])
  })

  it('renders hospital organization settings, branding, and localization', async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /hospital identity/i })).toBeInTheDocument()
      expect(screen.getByDisplayValue('St. Mary Hospital')).toBeInTheDocument()
    })
  })
})
