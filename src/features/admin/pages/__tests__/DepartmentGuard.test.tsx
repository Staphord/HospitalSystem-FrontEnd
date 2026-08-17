import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DepartmentGuard } from '@/components/auth/DepartmentGuard'
import { useDepartmentStatus } from '@/hooks/useDepartmentStatus'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Outlet: () => <div>Outlet Content</div>,
}))

vi.mock('@/hooks/useDepartmentStatus', () => ({
  useDepartmentStatus: vi.fn(),
}))

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

describe('DepartmentGuard', () => {
  const mockClearAuth = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockImplementation((selector: any) => selector({ clearAuth: mockClearAuth }))
  })

  it('renders loading spinner when status is resolving', () => {
    vi.mocked(useDepartmentStatus).mockReturnValue({
      isLoading: true,
      isError: false,
      getDepartmentStatus: () => ({ isInactive: false, isUnavailable: false, isPending: true, deptName: '' }),
    })

    render(
      <DepartmentGuard moduleName="pharmacy">
        <div>Protected Pharmacy Content</div>
      </DepartmentGuard>
    )

    expect(screen.getByText('Verifying access...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Pharmacy Content')).not.toBeInTheDocument()
  })

  it('logs out user and redirects to login when department is deactivated', () => {
    vi.mocked(useDepartmentStatus).mockReturnValue({
      isLoading: false,
      isError: false,
      getDepartmentStatus: () => ({ isInactive: true, isUnavailable: false, isPending: false, deptName: 'Pharmacy' }),
    })

    render(
      <DepartmentGuard moduleName="pharmacy">
        <div>Protected Pharmacy Content</div>
      </DepartmentGuard>
    )

    expect(mockClearAuth).toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining('Pharmacy department has been temporarily deactivated'),
      expect.any(Object)
    )
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
    expect(screen.queryByText('Protected Pharmacy Content')).not.toBeInTheDocument()
  })

  it('renders protected children when department is active', () => {
    vi.mocked(useDepartmentStatus).mockReturnValue({
      isLoading: false,
      isError: false,
      getDepartmentStatus: () => ({ isInactive: false, isUnavailable: false, isPending: false, deptName: 'Pharmacy' }),
    })

    render(
      <DepartmentGuard moduleName="pharmacy">
        <div>Protected Pharmacy Content</div>
      </DepartmentGuard>
    )

    expect(screen.getByText('Protected Pharmacy Content')).toBeInTheDocument()
    expect(mockClearAuth).not.toHaveBeenCalled()
  })
})

