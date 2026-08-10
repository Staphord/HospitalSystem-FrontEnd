import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DepartmentGuard } from '@/components/auth/DepartmentGuard'
import { useDepartmentStatus } from '@/hooks/useDepartmentStatus'

vi.mock('@/hooks/useDepartmentStatus', () => ({
  useDepartmentStatus: vi.fn(),
}))

describe('DepartmentGuard', () => {
  it('renders loading spinner when status is resolving', () => {
    vi.mocked(useDepartmentStatus).mockReturnValue({
      isLoading: true,
      isError: false,
      getDepartmentStatus: () => ({ isInactive: null, deptName: '' }),
    })

    render(
      <DepartmentGuard moduleName="pharmacy">
        <div>Protected Pharmacy Content</div>
      </DepartmentGuard>
    )

    expect(screen.getByText('Verifying access...')).toBeInTheDocument()
    expect(screen.queryByText('Protected Pharmacy Content')).not.toBeInTheDocument()
  })

  it('renders suspended error banner when department is deactivated', () => {
    vi.mocked(useDepartmentStatus).mockReturnValue({
      isLoading: false,
      isError: false,
      getDepartmentStatus: () => ({ isInactive: true, deptName: 'Pharmacy' }),
    })

    render(
      <DepartmentGuard moduleName="pharmacy">
        <div>Protected Pharmacy Content</div>
      </DepartmentGuard>
    )

    expect(screen.getByText('Department Temporarily Suspended')).toBeInTheDocument()
    expect(screen.queryByText('Protected Pharmacy Content')).not.toBeInTheDocument()
  })

  it('renders protected children when department is active', () => {
    vi.mocked(useDepartmentStatus).mockReturnValue({
      isLoading: false,
      isError: false,
      getDepartmentStatus: () => ({ isInactive: false, deptName: 'Pharmacy' }),
    })

    render(
      <DepartmentGuard moduleName="pharmacy">
        <div>Protected Pharmacy Content</div>
      </DepartmentGuard>
    )

    expect(screen.getByText('Protected Pharmacy Content')).toBeInTheDocument()
    expect(screen.queryByText('Department Temporarily Suspended')).not.toBeInTheDocument()
  })
})
