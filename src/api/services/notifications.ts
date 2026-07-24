import { apiClient } from '@/api/client'

export type NotificationCategory = 'clinical' | 'billing' | 'pharmacy' | 'system'
export type NotificationPriority = 'low' | 'normal' | 'urgent' | 'emergency'
export type NotificationStatus = 'unread' | 'read'

export interface NotificationItem {
  notification_id: string
  tenant_id: string
  recipient_id: string | null
  recipient_role: string | null
  title: string
  message: string
  category: NotificationCategory
  priority: NotificationPriority
  status: NotificationStatus
  action_url: string | null
  metadata_payload: Record<string, any> | null
  read_at: string | null
  created_at: string
}

export interface NotificationListResponse {
  items: NotificationItem[]
  total: number
  page: number
  page_size: number
  unread_count: number
}

export interface UnreadCountResponse {
  unread_count: number
}

export interface MarkReadResponse {
  notification_id?: string | null
  marked_count: number
  status: string
}

export interface NotificationPreference {
  user_id: string
  in_app_enabled: boolean
  email_enabled: boolean
  sms_enabled: boolean
  categories_disabled: string[]
}

export const notificationsApi = {
  getNotifications: async (params?: {
    unread_only?: boolean
    category?: string
    page?: number
    page_size?: number
  }): Promise<NotificationListResponse> => {
    const res = await apiClient.get<NotificationListResponse>('/notifications', { params })
    return res.data
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const res = await apiClient.get<UnreadCountResponse>('/notifications/unread-count')
    return res.data
  },

  markAsRead: async (notificationId: string): Promise<MarkReadResponse> => {
    const res = await apiClient.patch<MarkReadResponse>(`/notifications/${notificationId}/read`)
    return res.data
  },

  markAllAsRead: async (): Promise<MarkReadResponse> => {
    const res = await apiClient.post<MarkReadResponse>('/notifications/mark-all-read')
    return res.data
  },

  getPreferences: async (): Promise<NotificationPreference> => {
    const res = await apiClient.get<NotificationPreference>('/notifications/preferences')
    return res.data
  },

  updatePreferences: async (data: Partial<NotificationPreference>): Promise<NotificationPreference> => {
    const res = await apiClient.put<NotificationPreference>('/notifications/preferences', data)
    return res.data
  },
}
