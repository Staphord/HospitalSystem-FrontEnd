import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { InsurancePage } from '../InsurancePage'
import { adminService } from '@/api/services/admin'

// Mock adminService
vi.mock('@/api/services/admin', () => ({
  adminService: {
    listInsuranceProviders: vi.fn().mockResolvedValue([
      {
        id: 'ins-1',
        name: 'National Health Insurance Fund (NHIF)',
        code: 'NHIF',
        phone: '0800 110 000',
        email: 'info@nhif.or.tz',
        is_active: true,
        copay_percentage: 0,
      },
    ]),
  },
}))

describe('InsurancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(adminService.listInsuranceProviders).mockResolvedValue([
      {
        id: 'ins-1',
        name: 'National Health Insurance Fund (NHIF)',
        code: 'NHIF',
        phone: '0800 110 000',
        email: 'info@nhif.or.tz',
        is_active: true,
        copay_percentage: 0,
      },
    ] as any)
  })

  it('renders insurance provider list and copay schemes', async () => {
    render(
      <MemoryRouter>
        <InsurancePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Insurance Providers')).toBeInTheDocument()
      expect(screen.getByText('National Health Insurance Fund (NHIF)')).toBeInTheDocument()
    })
  })
})
