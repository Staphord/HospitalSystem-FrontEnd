import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AnnouncementsPage } from '../AnnouncementsPage'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock services
vi.mock('@/api/services/monitoring', () => ({
  monitoringService: {
    listAnnouncements: vi.fn().mockResolvedValue([
      {
        announcement_id: 'ann-1',
        title: 'Scheduled System Maintenance',
        body: 'System update on Sunday at 02:00 UTC',
        audience: 'all',
        target_tenant_ids: null,
        is_active: true,
        publish_at: new Date(Date.now() - 60000).toISOString(),
        expires_at: null,
        created_at: new Date().toISOString(),
      },
    ]),
    createAnnouncement: vi.fn().mockResolvedValue({}),
    updateAnnouncement: vi.fn().mockResolvedValue({}),
    deleteAnnouncement: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('@/api/services/master', () => ({
  masterService: {
    listTenants: vi.fn().mockResolvedValue([]),
  },
}))

describe('AnnouncementsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders announcements list and broadcast metrics', async () => {
    render(
      <MemoryRouter>
        <AnnouncementsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Scheduled System Maintenance')).toBeInTheDocument()
      expect(screen.getByText('Create Announcement')).toBeInTheDocument()
    })
  })
})
