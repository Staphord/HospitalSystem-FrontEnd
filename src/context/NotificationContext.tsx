import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import {
  notificationsApi,
  type NotificationItem,
} from '@/api/services/notifications'

interface NotificationContextType {
  unreadCount: number
  notifications: NotificationItem[]
  loading: boolean
  refreshNotifications: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  notifications: [],
  loading: false,
  refreshNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
})

export const useNotifications = () => useContext(NotificationContext)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const inAppEnabledRef = React.useRef<boolean>(true)

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      setLoading(true)
      const [res, prefs] = await Promise.all([
        notificationsApi.getNotifications({ page: 1, page_size: 10 }),
        notificationsApi.getPreferences().catch(() => null),
      ])
      setNotifications(res.items || [])
      if (prefs) {
        inAppEnabledRef.current = prefs.in_app_enabled
        if (prefs.in_app_enabled === false) {
          setUnreadCount(0)
          return
        }
      }
      setUnreadCount(res.unread_count || 0)
    } catch {
      // Fallback silent handle
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId)
      setNotifications((prev) =>
        prev.map((item) =>
          item.notification_id === notificationId ? { ...item, status: 'read' as const } : item
        )
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {
      toast.error('Failed to mark notification as read')
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      setNotifications((prev) => prev.map((item) => ({ ...item, status: 'read' as const })))
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    refreshNotifications()
    const interval = setInterval(refreshNotifications, 10_000)
    return () => clearInterval(interval)
  }, [isAuthenticated, refreshNotifications])

  // Establish real-time EventSource stream when authenticated
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken') || ''
    if (!isAuthenticated || !accessToken) return

    const streamUrl = `/api/v1/notifications/stream?token=${encodeURIComponent(accessToken)}`
    let eventSource: EventSource | null = null

    try {
      eventSource = new EventSource(streamUrl)

      eventSource.onmessage = (event) => {
        try {
          const item: NotificationItem = JSON.parse(event.data)
          setNotifications((prev) => [item, ...prev.slice(0, 9)])
          
          // Respect user's in_app_enabled preference
          if (inAppEnabledRef.current === false) {
            return
          }

          setUnreadCount((prev) => prev + 1)

          if (item.priority === 'emergency' || item.priority === 'urgent') {
            toast.error(`${item.title}: ${item.message}`, {
              duration: 6000,
            })
          } else {
            toast.info(item.title, {
              description: item.message,
            })
          }
        } catch {
          // Silent parsing failure handle
        }
      }

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close()
        }
      }
    } catch {
      // EventSource fallback
    }

    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [isAuthenticated])

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        loading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
