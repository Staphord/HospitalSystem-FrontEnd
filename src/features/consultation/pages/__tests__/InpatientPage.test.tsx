import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { InpatientPage } from '../InpatientPage'
import { wardService } from '@/api/services/ward'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/api/services/ward', () => ({
  wardService: {
    getAdmittedPatients: vi.fn(),
  },
}))

const mockAdmittedPatients = [
  {
    id: 'adm-1',
    admissionId: 'adm-1',
    patientId: 'pat-1',
    patientNumber: 'PAT-001',
    patientName: 'Grace Hopper',
    name: 'Grace Hopper',
    age: 40,
    gender: 'female',
    ward: 'Medical Ward A',
    bedNumber: 'M-102',
    bed: 'Bed M-102',
    admissionDate: '2026-07-10T10:00:00Z',
    attendingDoctor: 'Dr. House',
    diagnosis: 'Pneumonia',
    status: 'monitoring',
  },
  {
    id: 'adm-2',
    admissionId: 'adm-2',
    patientId: 'pat-2',
    patientNumber: 'PAT-002',
    patientName: 'Alan Turing',
    name: 'Alan Turing',
    age: 42,
    gender: 'male',
    ward: 'Surgical Ward B',
    bedNumber: 'S-205',
    bed: 'Bed S-205',
    admissionDate: '2026-07-12T14:00:00Z',
    attendingDoctor: 'Dr. Strange',
    diagnosis: 'Post-op appendectomy',
    status: 'stable',
  },
]

describe('InpatientPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(wardService.getAdmittedPatients).mockResolvedValue(mockAdmittedPatients as any)
  })

  it('fetches and renders admitted inpatients', async () => {
    render(
      <MemoryRouter>
        <InpatientPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(wardService.getAdmittedPatients).toHaveBeenCalled()
      expect(screen.getByText('Grace Hopper')).toBeInTheDocument()
      expect(screen.getByText('Alan Turing')).toBeInTheDocument()
      expect(screen.getByText(/M-102/)).toBeInTheDocument()
    })
  })

  it('filters inpatient list by search query', async () => {
    render(
      <MemoryRouter>
        <InpatientPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Grace Hopper')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search/i)
    fireEvent.change(searchInput, { target: { value: 'Alan' } })

    expect(screen.getByText('Alan Turing')).toBeInTheDocument()
    expect(screen.queryByText('Grace Hopper')).not.toBeInTheDocument()
  })

  it('navigates to inpatient orders on row menu action click', async () => {
    render(
      <MemoryRouter>
        <InpatientPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Grace Hopper')).toBeInTheDocument()
    })

    const actionMenuBtn = screen.getAllByText('more_vert')[0].closest('button')
    fireEvent.click(actionMenuBtn!)

    const viewOrdersBtn = screen.getByRole('menuitem', { name: /view orders/i })
    fireEvent.click(viewOrdersBtn)

    expect(mockNavigate).toHaveBeenCalledWith('/consultation/inpatient/adm-1/orders')
  })
})
