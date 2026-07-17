import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { PatientSearchPage } from '../PatientSearchPage'
import { receptionService } from '@/api/services/reception'

// Mock HTML scrollIntoView in jsdom
beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  if (typeof Element !== 'undefined') {
    Element.prototype.scrollIntoView = vi.fn()
  }
})

// Mock toast notifications
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
    updatePatient: vi.fn(),
    checkInPatient: vi.fn(),
    getInsurancePolicies: vi.fn().mockResolvedValue([]),
  },
}))

// Mock useAuthStore
vi.mock('@/store/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'user-123', role: 'receptionist' },
    roles: [],
  }),
}))

const mockPatient = {
  id: 'pat-123',
  patient_number: 'PT-20260713-0003',
  full_name: 'John Doe',
  national_id: '12345',
  date_of_birth: '1990-01-01',
  gender: 'male',
  phone_primary: '536637',
  next_of_kin_name: 'Jane Doe',
  next_of_kin_relationship: 'spouse',
  next_of_kin_phone: '2333',
  created_at: '2026-07-13T10:00:00Z',
  updated_at: '2026-07-13T10:00:00Z',
  insurance_policies: [
    {
      insurance_id: 'ins-123',
      insurer_name: 'NHIF',
      policy_number: '7865433',
      verification_status: 'pending',
      is_active: true,
    },
  ],
}

describe('PatientSearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(receptionService.searchPatients).mockResolvedValue({ patients: [mockPatient] })
    vi.mocked(receptionService.getActiveVisit).mockResolvedValue({ active: false })
  })

  it('renders search input fields correctly', () => {
    render(
      <MemoryRouter>
        <PatientSearchPage />
      </MemoryRouter>
    )

    expect(screen.getByPlaceholderText(/enter national id/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter full name/i)).toBeInTheDocument()
  })

  it('performs search and displays patient details', async () => {
    render(
      <MemoryRouter>
        <PatientSearchPage />
      </MemoryRouter>
    )

    const searchInput = screen.getByPlaceholderText(/enter national id/i)
    fireEvent.change(searchInput, { target: { value: '12345' } })
    
    const searchForm = searchInput.closest('form')
    expect(searchForm).toBeInTheDocument()
    
    await act(async () => {
      fireEvent.submit(searchForm!)
    })

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('PT-20260713-0003')).toBeInTheDocument()
    })
  })

  it('allows demographic details editing using function icons when patient is inactive', async () => {
    vi.mocked(receptionService.updatePatient).mockResolvedValue(mockPatient)

    render(
      <MemoryRouter>
        <PatientSearchPage />
      </MemoryRouter>
    )

    // Trigger search to load patient card
    const searchInput = screen.getByPlaceholderText(/enter national id/i)
    fireEvent.change(searchInput, { target: { value: '12345' } })
    await act(async () => {
      fireEvent.submit(searchInput.closest('form')!)
    })

    // Wait for the patient card to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Click NOK name edit button (third edit pencil in list)
    const editButtons = screen.getAllByRole('button').filter(btn => btn.querySelector('span')?.textContent === 'edit')
    expect(editButtons.length).toBeGreaterThan(2)
    
    // Toggle edit Nok Name
    fireEvent.click(editButtons[2])

    const nokInput = screen.getByDisplayValue('Jane Doe')
    fireEvent.change(nokInput, { target: { value: 'Mary Doe' } })

    // Click check/save button (labeled "check" via material symbols text content)
    const saveButton = screen.getByText('check').closest('button')
    expect(saveButton).toBeInTheDocument()
    await act(async () => {
      fireEvent.click(saveButton!)
    })

    expect(receptionService.updatePatient).toHaveBeenCalledWith(
      'pat-123',
      expect.objectContaining({ next_of_kin_name: 'Mary Doe' })
    )
  })

  it('hides edit pencils and payment selection when patient is already active in queue', async () => {
    vi.mocked(receptionService.getActiveVisit).mockResolvedValue({
      active: true,
      queue_number: 'TR-0012',
      queue_status: 'waiting',
      queue_type: 'triage',
    })

    render(
      <MemoryRouter>
        <PatientSearchPage />
      </MemoryRouter>
    )

    // Search patient
    const searchInput = screen.getByPlaceholderText(/enter national id/i)
    fireEvent.change(searchInput, { target: { value: '12345' } })
    await act(async () => {
      fireEvent.submit(searchInput.closest('form')!)
    })

    // Wait for details card and verify active visit locks are applied
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Wait for the asynchronous active visit status update to resolve in UI
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Already Waiting/i })).toBeInTheDocument()
    })

    // Verify edit pencils are hidden
    const editButtons = screen.queryAllByRole('button').filter(btn => btn.querySelector('span')?.textContent === 'edit')
    expect(editButtons.length).toBe(0)

    // Verify payment option choices are hidden
    expect(screen.queryByLabelText(/cash \/ private/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/insurance/i)).not.toBeInTheDocument()

    // Verify button displays wait state
    const checkinBtn = screen.getByRole('button', { name: /Already Waiting/i })
    expect(checkinBtn).toBeDisabled()
  })
})
