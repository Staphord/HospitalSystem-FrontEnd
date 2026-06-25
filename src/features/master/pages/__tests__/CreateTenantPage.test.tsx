import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { CreateTenantPage } from '../CreateTenantPage'
import { masterService } from '@/api/services/master'
import type { Tenant } from '@/api/types/master'

// Mock toast notification library
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock master service
vi.mock('@/api/services/master', () => ({
  masterService: {
    listPlans: vi.fn().mockResolvedValue([
      { plan_id: 'basic', plan_name: 'Basic', storage_gb: 10, monthly_price: 299 },
      { plan_id: 'premium', plan_name: 'Premium', storage_gb: 200, monthly_price: 1199 },
    ]),
    createTenant: vi.fn(),
  },
}))

describe('CreateTenantPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders onboarding sections and loads plan options', async () => {
    render(
      <MemoryRouter>
        <CreateTenantPage />
      </MemoryRouter>
    )

    // Verify sections render correctly
    expect(screen.getByText('1. Hospital Information')).toBeInTheDocument()
    expect(screen.getByText('2. Primary Contact & Admin User')).toBeInTheDocument()
    expect(screen.getByText('3. Billing Contact')).toBeInTheDocument()
    expect(screen.getByText('4. System Configuration')).toBeInTheDocument()
    expect(screen.getByText('5. Subscription Setup')).toBeInTheDocument()
    expect(screen.getByText('6. Branding & Contingency Setup')).toBeInTheDocument()

    // Wait for the mock plans list loading to populate options
    await waitFor(() => {
      expect(screen.getByText('Basic Plan')).toBeInTheDocument()
      expect(screen.getByText('Premium Plan')).toBeInTheDocument()
    })
  })

  it('displays form validation error banners on invalid submission attempts', async () => {
    render(
      <MemoryRouter>
        <CreateTenantPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Basic Plan')).toBeInTheDocument()
    })

    const submitBtn = screen.getByRole('button', { name: /onboard hospital tenant/i })

    // Trigger click on submit button
    await act(async () => {
      fireEvent.click(submitBtn)
    })

    // Assert that validation warnings appear
    expect(screen.getByText('Please correct the following errors:')).toBeInTheDocument()
    expect(screen.getAllByText('Hospital Name is required.')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Admin Username is required.')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Admin Password is required.')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Admin Full Name is required.')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Primary Contact Phone Number is required.')[0]).toBeInTheDocument()
  })

  it('submits correctly when inputs are populated and contingency check is completed', async () => {
    vi.mocked(masterService.createTenant).mockResolvedValue({ tenant_id: 'new-hosp-id', hospital_name: 'Test General Hospital', status: 'active' } as unknown as Tenant)

    const { container } = render(
      <MemoryRouter>
        <CreateTenantPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Basic Plan')).toBeInTheDocument()
    })

    // Populate required fields
    fireEvent.change(screen.getByPlaceholderText(/e.g. Dar es Salaam General Hospital/i), {
      target: { value: 'Test General Hospital' },
    })
    fireEvent.change(screen.getByPlaceholderText(/e.g. admin_dar/i), {
      target: { value: 'admin_test' },
    })
    fireEvent.change(screen.getByPlaceholderText(/Minimum 8 characters/i), {
      target: { value: 'password123' },
    })
    fireEvent.change(screen.getByPlaceholderText(/e.g. contact@dargeneral.go.tz/i), {
      target: { value: 'admin@testhospital.org' },
    })
    fireEvent.change(screen.getByPlaceholderText(/e.g. Dr. Jane Mwenye/i), {
      target: { value: 'Dr. Test Admin' },
    })
    fireEvent.change(screen.getByPlaceholderText(/e.g. \+255 22 2123456/i), {
      target: { value: '+255 22 2123456' },
    })

    // Tick the contingency checking checkbox
    const checkbox = container.querySelector('#contingency_chk')
    expect(checkbox).not.toBeNull()
    await act(async () => {
      fireEvent.click(checkbox!)
    })

    const submitBtn = screen.getByRole('button', { name: /onboard hospital tenant/i })
    await act(async () => {
      fireEvent.click(submitBtn)
    })

    // Verify it called backend
    await waitFor(() => {
      expect(masterService.createTenant).toHaveBeenCalled()
    })

    // Assert it sent correct payloads
    expect(masterService.createTenant).toHaveBeenCalledWith(
      expect.objectContaining({
        hospital_name: 'Test General Hospital',
        admin_username: 'admin_test',
        admin_password: 'password123',
        admin_email: 'admin@testhospital.org',
        admin_full_name: 'Dr. Test Admin',
        primary_contact_name: 'Dr. Test Admin',
        primary_contact_phone: '+255 22 2123456',
      })
    )
  })

  it('prefills city, timezone, and currency when country is changed', async () => {
    render(
      <MemoryRouter>
        <CreateTenantPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Basic Plan')).toBeInTheDocument()
    })

    // Check defaults
    expect(screen.getByLabelText('Country')).toHaveValue('Tanzania')
    expect(screen.getByLabelText('City')).toHaveValue('Dar es Salaam')
    expect(screen.getByLabelText('Timezone')).toHaveValue('Africa/Dar_es_Salaam')
    expect(screen.getByLabelText('Billing Currency')).toHaveValue('TZS')

    // Change country to Kenya
    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'Kenya' } })

    // Verify prefilled updates
    expect(screen.getByLabelText('City')).toHaveValue('Nairobi')
    expect(screen.getByLabelText('Timezone')).toHaveValue('Africa/Nairobi')
    expect(screen.getByLabelText('Billing Currency')).toHaveValue('KES')
  })
})

