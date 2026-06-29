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
    expect(screen.getByText('Hospital Information')).toBeInTheDocument()
    expect(screen.getByText('Primary Contact')).toBeInTheDocument()
    expect(screen.getByText('Billing Contact')).toBeInTheDocument()
    expect(screen.getByText('System Configuration')).toBeInTheDocument()
    expect(screen.getByText('Subscription Setup')).toBeInTheDocument()
    expect(screen.getByText('Branding')).toBeInTheDocument()

    // Wait for the mock plans list loading to populate options
    await waitFor(() => {
      expect(screen.getByText('Basic')).toBeInTheDocument()
      expect(screen.getByText('Premium')).toBeInTheDocument()
    })
  })

  it('displays form validation error banners on invalid submission attempts', async () => {
    render(
      <MemoryRouter>
        <CreateTenantPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Basic')).toBeInTheDocument()
    })

    const submitBtn = screen.getByRole('button', { name: /save and activate/i })

    // Trigger click on submit button
    await act(async () => {
      fireEvent.click(submitBtn)
    })

    // Assert that validation warnings appear
    expect(screen.getByText('Please correct the following errors:')).toBeInTheDocument()
    expect(screen.getAllByText('Hospital Name is required.')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Primary Contact Full Name is required.')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Primary Contact Email is required.')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Primary Contact Phone Number is required.')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Billing Email is required.')[0]).toBeInTheDocument()
  })

  it('submits correctly when inputs are populated', async () => {
    vi.mocked(masterService.createTenant).mockResolvedValue({ tenant_id: 'new-hosp-id', hospital_name: 'Test General Hospital', status: 'active' } as unknown as Tenant)

    render(
      <MemoryRouter>
        <CreateTenantPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Basic')).toBeInTheDocument()
    })

    // Populate required fields
    fireEvent.change(screen.getByPlaceholderText(/e.g. Dar City Medical Center/i), {
      target: { value: 'Test General Hospital' },
    })
    fireEvent.change(screen.getByLabelText(/country/i), {
      target: { value: 'Tanzania' },
    })
    fireEvent.change(screen.getByPlaceholderText(/e.g. Dar es Salaam/i), {
      target: { value: 'Dar es Salaam' },
    })
    fireEvent.change(screen.getByPlaceholderText(/Enter primary administrator name/i), {
      target: { value: 'Dr. Test Admin' },
    })
    fireEvent.change(screen.getByPlaceholderText(/name@hospital.com/i), {
      target: { value: 'admin@testhospital.org' },
    })
    const phoneInputs = screen.getAllByPlaceholderText(/\+255 --- --- ---/i)
    fireEvent.change(phoneInputs[0], {
      target: { value: '+255 22 2123456' },
    })
    fireEvent.change(screen.getByPlaceholderText(/accounts@hospital.com/i), {
      target: { value: 'billing@testhospital.org' },
    })

    const submitBtn = screen.getByRole('button', { name: /save and activate/i })
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
        admin_email: 'admin@testhospital.org',
        admin_full_name: 'Dr. Test Admin',
        primary_contact_name: 'Dr. Test Admin',
        primary_contact_phone: '+255 22 2123456',
        billing_email: 'billing@testhospital.org',
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
      expect(screen.getByText('Basic')).toBeInTheDocument()
    })

    // Change country to Kenya
    fireEvent.change(screen.getByLabelText(/country/i), { target: { value: 'Kenya' } })

    // Verify prefilled updates
    expect(screen.getByLabelText(/city/i)).toHaveValue('Nairobi')
    expect(screen.getByLabelText(/timezone/i)).toHaveValue('Africa/Nairobi')
    expect(screen.getByLabelText(/currency/i)).toHaveValue('KES')
  })
})
