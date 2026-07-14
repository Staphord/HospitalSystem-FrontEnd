import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PatientRegistrationPage } from '../PatientRegistrationPage'
import { receptionService } from '@/api/services/reception'

// Mock HTML scrollIntoView in jsdom
beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  if (typeof Element !== 'undefined') {
    Element.prototype.scrollIntoView = vi.fn()
  }
})

// Mock toast notification
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock reception service
vi.mock('@/api/services/reception', () => ({
  receptionService: {
    searchPatients: vi.fn(),
    getActiveVisit: vi.fn(),
    registerPatient: vi.fn(),
    checkInPatient: vi.fn(),
    updatePatient: vi.fn(),
    registerAndVisit: vi.fn().mockResolvedValue({
      patient: { id: 'pat-new', full_name: 'New Child Patient' },
      visit: { visit_id: 'visit-new' },
      queue: { queue_number: 'TR-0012' },
    }),
  },
}))

// Mock useAuthStore
vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'user-123', role: 'receptionist' },
    roles: [],
  }),
}))

const mockExistingPatient = {
  id: 'pat-456',
  patient_number: 'PT-20260713-0004',
  full_name: 'Jane Smith',
  national_id: '98765',
  date_of_birth: '1995-05-05',
  gender: 'female',
  phone_primary: '987654321',
  next_of_kin_name: 'Bob Smith',
  next_of_kin_relationship: 'spouse',
  next_of_kin_phone: '11112222',
  created_at: '2026-07-13T10:00:00Z',
  updated_at: '2026-07-13T10:00:00Z',
  insurance_policies: [],
}

describe('PatientRegistrationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(receptionService.searchPatients).mockResolvedValue({ patients: [] })
    vi.mocked(receptionService.getActiveVisit).mockResolvedValue({ active: false })
  })

  it('renders form inputs correctly', () => {
    const { container } = render(
      <MemoryRouter>
        <PatientRegistrationPage />
      </MemoryRouter>
    )

    expect(screen.getByPlaceholderText('e.g. John Doe')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. 0712 345 678')).toBeInTheDocument()
    expect(screen.getByText(/national id \/ passport # \(optional\)/i)).toBeInTheDocument()
  })

  it('displays validation errors on submitting empty fields', async () => {
    render(
      <MemoryRouter>
        <PatientRegistrationPage />
      </MemoryRouter>
    )

    const submitBtn = screen.getByRole('button', { name: /Save & Assign to Queue/i })
    
    await act(async () => {
      fireEvent.click(submitBtn)
    })

    expect(screen.getByText('Full name is required')).toBeInTheDocument()
    expect(screen.getByText('Contact phone is required')).toBeInTheDocument()
    expect(screen.getByText('Next of kin full name is required')).toBeInTheDocument()
  })

  it('allows registration without a National ID (optional field)', async () => {
    const { container } = render(
      <MemoryRouter>
        <PatientRegistrationPage />
      </MemoryRouter>
    )

    // Populate required fields using placeholders and classes
    fireEvent.change(screen.getByPlaceholderText('e.g. John Doe'), { target: { value: 'New Child Patient' } })
    
    const dobInput = container.querySelector('input[type="date"]')
    expect(dobInput).toBeInTheDocument()
    fireEvent.change(dobInput!, { target: { value: '2020-01-01' } })

    const genderSelect = container.querySelector('select')
    expect(genderSelect).toBeInTheDocument()
    fireEvent.change(genderSelect!, { target: { value: 'Male' } })

    fireEvent.change(screen.getByPlaceholderText('e.g. 0712 345 678'), { target: { value: '123456789' } })
    
    const nokNameInput = screen.getAllByText(/Full Name/i)[1].closest('div')?.querySelector('input')
    expect(nokNameInput).toBeInTheDocument()
    fireEvent.change(nokNameInput!, { target: { value: 'Mother Smith' } })

    const nokRelationSelect = screen.getAllByRole('combobox')[1]
    expect(nokRelationSelect).toBeInTheDocument()
    fireEvent.change(nokRelationSelect!, { target: { value: 'Parent' } })

    const nokPhoneInput = screen.getByText(/Phone Number/i).closest('div')?.querySelector('input')
    expect(nokPhoneInput).toBeInTheDocument()
    fireEvent.change(nokPhoneInput!, { target: { value: '987654321' } })

    // Change payment type to Cash to avoid policy number validation error
    const cashRadio = screen.getByLabelText(/cash \/ private/i)
    fireEvent.click(cashRadio)

    const submitBtn = screen.getByRole('button', { name: /Save & Assign to Queue/i })
    await act(async () => {
      fireEvent.click(submitBtn)
    })

    // Verify both registration and check-in are triggered without National ID validation errors via registerAndVisit
    expect(receptionService.registerAndVisit).toHaveBeenCalledWith(
      expect.objectContaining({
        patient: expect.objectContaining({
          full_name: 'New Child Patient',
          national_id: undefined, // empty ID omitted or undefined
        }),
      })
    )
  })

  it('checks for duplicate National ID, populates details, and disables inputs if patient is active in queue', async () => {
    vi.mocked(receptionService.searchPatients).mockResolvedValue({ patients: [mockExistingPatient] })
    vi.mocked(receptionService.getActiveVisit).mockResolvedValue({
      active: true,
      queue_number: 'TR-0012',
      queue_status: 'waiting',
      queue_type: 'triage',
    })

    const { container } = render(
      <MemoryRouter>
        <PatientRegistrationPage />
      </MemoryRouter>
    )

    const nationalIdInput = screen.getByText(/national id \/ passport #/i).closest('div')?.querySelector('input')
    expect(nationalIdInput).toBeInTheDocument()
    fireEvent.change(nationalIdInput!, { target: { value: '98765' } })
    
    // Blur to trigger handleNationalIdCheck
    await act(async () => {
      fireEvent.blur(nationalIdInput!)
    })

    await waitFor(() => {
      // Verify warning alert is showing the active queue number
      expect(screen.getByText(/already exists/i)).toBeInTheDocument()
      expect(screen.getByText(/\(queue #tr-0012\)/i)).toBeInTheDocument()
      
      // Verify inputs are populated
      expect(screen.getByDisplayValue('Jane Smith')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Bob Smith')).toBeInTheDocument()
    })

    // Verify demographic inputs are disabled
    expect(screen.getByPlaceholderText('e.g. John Doe')).toBeDisabled()
    expect(screen.getByPlaceholderText('e.g. 0712 345 678')).toBeDisabled()
    
    const nokNameInput = screen.getAllByText(/Full Name/i)[1].closest('div')?.querySelector('input')
    expect(nokNameInput).toBeDisabled()

    // Verify main button redirects to queue
    const queueBtn = screen.getAllByRole('button', { name: /view in queue/i })[1]
    expect(queueBtn).toBeInTheDocument()
  })
})
