import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { masterService } from '@/api/services/master'
import type { Tenant } from '@/api/types/master'
import { TerminateTenantModal } from '../TerminateTenantModal'

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock master service
vi.mock('@/api/services/master', () => ({
  masterService: {
    updateTenant: vi.fn(),
    exportTenantData: vi.fn(),
  },
}))

describe('TerminateTenantModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    tenantId: 'test-tenant',
    tenantName: 'Test Hospital Name',
    stats: {
      user_count: 5,
      kc_user_count: 5,
      patient_count: 100,
      db_size_mb: 200,
    },
    storageGb: 10,
    tenantProfile: {
      tenant_id: 'test-tenant',
      hospital_name: 'Test Hospital Name',
      status: 'active',
    },
    subscriptions: [],
    invoices: [],
    auditLogs: [],
    onSuccess: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(masterService.exportTenantData).mockResolvedValue({
      tenant_id: 'test-tenant',
      hospital_name: 'Test Hospital Name',
      exported_at: '2026-06-29T12:00:00Z',
      data: {}
    })
    global.URL.createObjectURL = vi.fn().mockReturnValue('mock-download-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  it('renders step 1 with stats and next button is disabled initially', () => {
    render(<TerminateTenantModal {...defaultProps} />)

    expect(screen.getByText('Terminate Hospital Account - Step 1 of 3')).toBeInTheDocument()
    expect(screen.getByText('5 accounts')).toBeInTheDocument()
    expect(screen.getByText('100 records')).toBeInTheDocument()
    expect(screen.getByText('10 GB')).toBeInTheDocument()
    expect(screen.getByText('200 MB')).toBeInTheDocument()

    const nextBtn = screen.getByRole('button', { name: 'Next Step' })
    expect(nextBtn).toBeDisabled()
  })

  it('enables step 1 next button only when tenant name is typed exactly', () => {
    render(<TerminateTenantModal {...defaultProps} />)

    const input = screen.getByPlaceholderText('Enter hospital name exactly...')
    
    // Type incorrect name
    fireEvent.change(input, { target: { value: 'Wrong Hospital Name' } })
    const nextBtn = screen.getByRole('button', { name: 'Next Step' })
    expect(nextBtn).toBeDisabled()

    // Type correct name
    fireEvent.change(input, { target: { value: 'Test Hospital Name' } })
    expect(nextBtn).not.toBeDisabled()
  })

  it('progresses to step 2 and requires backup verification', async () => {
    const { container } = render(<TerminateTenantModal {...defaultProps} />)

    // Unlock and go to step 2
    const input = screen.getByPlaceholderText('Enter hospital name exactly...')
    fireEvent.change(input, { target: { value: 'Test Hospital Name' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next Step' }))

    expect(screen.getByText('Terminate Hospital Account - Step 2 of 3')).toBeInTheDocument()

    // Next step button should be disabled initially on step 2
    const nextBtnStep2 = screen.getByRole('button', { name: 'Next Step' })
    expect(nextBtnStep2).toBeDisabled()

    // Trigger download
    const downloadBtn = screen.getByRole('button', { name: /Generate & Download Backup Export/i })
    fireEvent.click(downloadBtn)

    // Wait for the async call to finish and update state
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Export Downloaded' })).toBeInTheDocument()
    })

    // Checkbox should now be visible
    const verifyCheckbox = container.querySelector('#chk_verify_backup') as HTMLInputElement
    expect(verifyCheckbox).not.toBeNull()
    expect(verifyCheckbox.checked).toBe(false)

    // Checking the checkbox enables next step
    fireEvent.click(verifyCheckbox)
    expect(verifyCheckbox.checked).toBe(true)
    expect(nextBtnStep2).not.toBeDisabled()
  })

  it('progresses to step 3 and requires both final consent check boxes to execute', async () => {
    const { container } = render(<TerminateTenantModal {...defaultProps} />)

    // Step 1
    fireEvent.change(screen.getByPlaceholderText('Enter hospital name exactly...'), { target: { value: 'Test Hospital Name' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next Step' }))

    // Step 2
    fireEvent.click(screen.getByRole('button', { name: /Generate & Download Backup/i }))
    let verifyCheckbox: HTMLInputElement | null = null
    await waitFor(() => {
      verifyCheckbox = container.querySelector('#chk_verify_backup') as HTMLInputElement
      expect(verifyCheckbox).not.toBeNull()
    })
    fireEvent.click(verifyCheckbox!)
    fireEvent.click(screen.getByRole('button', { name: 'Next Step' }))

    // Step 3
    expect(screen.getByText('Terminate Hospital Account - Step 3 of 3')).toBeInTheDocument()

    const terminateBtn = screen.getByRole('button', { name: 'Terminate Hospital' })
    expect(terminateBtn).toBeDisabled()

    // Check only first consent checkbox
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    fireEvent.click(checkboxes[0])
    expect(terminateBtn).toBeDisabled()

    // Check second consent checkbox
    fireEvent.click(checkboxes[1])
    expect(terminateBtn).not.toBeDisabled()

    // Trigger termination API call
    vi.mocked(masterService.updateTenant).mockResolvedValue({ tenant_id: 'test-tenant', hospital_name: 'Test Hospital', status: 'terminated' } as unknown as Tenant)
    fireEvent.click(terminateBtn)

    await waitFor(() => {
      expect(masterService.updateTenant).toHaveBeenCalledWith('test-tenant', { status: 'terminated' })
      expect(defaultProps.onSuccess).toHaveBeenCalled()
      expect(defaultProps.onClose).toHaveBeenCalled()
    })
  })

  it('does not render when isOpen is false', () => {
    render(<TerminateTenantModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('Terminate Hospital Account - Step 1 of 3')).not.toBeInTheDocument()
  })
})
