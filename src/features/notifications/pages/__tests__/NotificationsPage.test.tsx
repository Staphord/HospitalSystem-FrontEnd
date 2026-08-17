import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { NotificationsPage } from '../NotificationsPage'
import { notificationsApi } from '@/api/services/notifications'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'u-1', full_name: 'Dr. Jane' },
    roles: ['doctor'],
  }),
}))

// Mock useNotifications
vi.mock('@/context/NotificationContext', () => ({
  useNotifications: () => ({
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    refreshNotifications: vi.fn(),
  }),
}))

// Mock notificationsApi
vi.mock('@/api/services/notifications', () => ({
  notificationsApi: {
    getNotifications: vi.fn(),
    markAllAsRead: vi.fn().mockResolvedValue({}),
    deleteNotification: vi.fn().mockResolvedValue({}),
    getPreferences: vi.fn().mockResolvedValue({}),
    updatePreferences: vi.fn().mockResolvedValue({}),
  },
}))

const mockNotifications = [
  {
    id: 'notif-1',
    title: 'Urgent Lab Result',
    message: 'Critical blood glucose level reported for patient PT-1001',
    priority: 'urgent',
    category: 'clinical',
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'notif-2',
    title: 'Medication Dispensed',
    message: 'Prescription for PT-1002 has been dispensed by the pharmacy',
    priority: 'normal',
    category: 'pharmacy',
    is_read: true,
    created_at: new Date().toISOString(),
  },
]

describe('NotificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(notificationsApi.getNotifications).mockResolvedValue({
      items: mockNotifications as any,
      total: 2,
      page: 1,
      page_size: 10,
    })
  })

  it('renders notification list with priority badges and category details', async () => {
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Urgent Lab Result')).toBeInTheDocument()
      expect(screen.getByText('Medication Dispensed')).toBeInTheDocument()
      expect(screen.getByText('URGENT')).toBeInTheDocument()
    })
  })

  it('filters notifications by unread tab', async () => {
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Urgent Lab Result')).toBeInTheDocument()
    })

    const unreadTab = screen.getByRole('button', { name: /unread/i })
    fireEvent.click(unreadTab)

    await waitFor(() => {
      expect(notificationsApi.getNotifications).toHaveBeenCalledWith(
        expect.objectContaining({ unread_only: true })
      )
    })
  })
})
