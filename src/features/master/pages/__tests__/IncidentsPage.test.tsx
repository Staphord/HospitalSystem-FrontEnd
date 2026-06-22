import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { IncidentsPage } from '../IncidentsPage'
import { monitoringService } from '@/api/services/monitoring'

// Mock toast notification library
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/api/services/monitoring', () => ({
  monitoringService: {
    getSystemHealth: vi.fn(),
    createIncident: vi.fn(),
    updateIncident: vi.fn(),
  },
}))

describe('IncidentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockIncidentsData: any = {
    incidents: [
      {
        id: 'inc-1',
        title: 'Database Replication Lag',
        severity: 'critical',
        status: 'active',
        message: 'Active lag of 45s detected on US-East replica.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'inc-2',
        title: 'API Gateway Latency Spike',
        severity: 'warning',
        status: 'resolved',
        message: 'Gateway response times spiked.',
        created_at: new Date().toISOString(),
        resolved_at: new Date().toISOString(),
        resolved_notes: 'Resolved by adding more resource capacity.',
        resolved_by: 'System Admin',
      },
    ],
  }

  it('renders incidents log and classifies active vs resolved incidents', async () => {
    vi.mocked(monitoringService.getSystemHealth).mockResolvedValue(mockIncidentsData)

    render(
      <MemoryRouter>
        <IncidentsPage />
      </MemoryRouter>
    )

    // Wait for the incidents list to load
    await waitFor(() => {
      expect(screen.getByText('Database Replication Lag')).toBeInTheDocument()
    })

    // Active disruptions should show the active incident
    expect(screen.getByText('Active Platform Disruptions')).toBeInTheDocument()
    expect(screen.getByText('#inc-1')).toBeInTheDocument()

    // Resolved incident is in collapsed archives initially, click to expand it
    const archiveBtn = screen.getByRole('button', { name: /resolved incidents archives/i })
    await act(async () => {
      fireEvent.click(archiveBtn)
    })

    expect(screen.getByText('API Gateway Latency Spike')).toBeInTheDocument()
    expect(screen.getByText('#inc-2')).toBeInTheDocument()
  })

  it('expands row and submits incident resolution notes', async () => {
    const mockUpdateIncident = vi.fn().mockResolvedValue({ id: 'inc-1', status: 'resolved' })
    vi.mocked(monitoringService.getSystemHealth).mockResolvedValue(mockIncidentsData)
    vi.mocked(monitoringService.updateIncident).mockImplementation(mockUpdateIncident)

    render(
      <MemoryRouter>
        <IncidentsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Database Replication Lag')).toBeInTheDocument()
    })

    // Click row or resolve action to expand
    const row = screen.getByText('Database Replication Lag')
    await act(async () => {
      fireEvent.click(row)
    })

    // Expand details are shown
    expect(screen.getByText('Diagnostics & Description')).toBeInTheDocument()
    expect(screen.getByText('Resolution Action Log')).toBeInTheDocument()

    // Type notes and resolve
    const textarea = screen.getByPlaceholderText(/document diagnostic resolution notes/i)
    fireEvent.change(textarea, { target: { value: 'Successfully restarted replica server.' } })

    const confirmBtn = screen.getByRole('button', { name: /confirm resolution/i })
    await act(async () => {
      fireEvent.click(confirmBtn)
    })

    await waitFor(() => {
      expect(mockUpdateIncident).toHaveBeenCalledWith(
        'inc-1',
        expect.objectContaining({
          status: 'resolved',
          resolved_notes: 'Successfully restarted replica server.',
        })
      )
    })
  })

  it('opens creation modal and broadcasts incident alert', async () => {
    const mockCreateIncident = vi.fn().mockResolvedValue({ id: 'inc-new', status: 'active' })
    vi.mocked(monitoringService.getSystemHealth).mockResolvedValue(mockIncidentsData)
    vi.mocked(monitoringService.createIncident).mockImplementation(mockCreateIncident)

    render(
      <MemoryRouter>
        <IncidentsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Database Replication Lag')).toBeInTheDocument()
    })

    const createBtn = screen.getByRole('button', { name: /create incident alert/i })
    await act(async () => {
      fireEvent.click(createBtn)
    })

    // Assert modal is open
    expect(screen.getByText('Publish Incident / Maintenance Alert')).toBeInTheDocument()

    // Populate form fields
    const titleInput = screen.getByText('Incident Title').parentElement?.querySelector('input')
    const severitySelect = screen.getByText('Severity Tier').parentElement?.querySelector('select')
    const detailsTextarea = screen.getByText('Details / Diagnostic Message').parentElement?.querySelector('textarea')

    if (titleInput) fireEvent.change(titleInput, { target: { value: 'Memory Leak Outage' } })
    if (severitySelect) fireEvent.change(severitySelect, { target: { value: 'critical' } })
    if (detailsTextarea) fireEvent.change(detailsTextarea, {
      target: { value: 'High memory usage on auth service nodes.' },
    })

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /broadcast alert/i })
    await act(async () => {
      fireEvent.click(submitBtn)
    })

    await waitFor(() => {
      expect(mockCreateIncident).toHaveBeenCalledWith({
        title: 'Memory Leak Outage',
        severity: 'critical',
        message: 'High memory usage on auth service nodes.',
      })
    })
  })
})
