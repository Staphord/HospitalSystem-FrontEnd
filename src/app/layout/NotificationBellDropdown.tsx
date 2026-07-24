import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '@/context/NotificationContext'
import type { NotificationItem } from '@/api/services/notifications'

export function NotificationBellDropdown() {
  const navigate = useNavigate()
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleItemClick = async (item: NotificationItem) => {
    if (item.status === 'unread') {
      await markAsRead(item.notification_id)
    }
    setIsOpen(false)
    if (item.action_url) {
      navigate(item.action_url)
    } else {
      navigate('/notifications')
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'clinical':
        return 'medical_services'
      case 'pharmacy':
        return 'medication'
      case 'billing':
        return 'payments'
      default:
        return 'notifications'
    }
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-full text-secondary hover:bg-surface-variant transition-colors bg-transparent border-0 cursor-pointer flex items-center justify-center"
        title="Notifications"
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined text-[22px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-error text-white font-bold text-[10px] rounded-full flex items-center justify-center border-2 border-surface-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-white border border-border-subtle rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[480px]">
          <div className="px-md py-sm border-b border-border-subtle flex items-center justify-between bg-surface-container-low">
            <div className="flex items-center gap-xs">
              <h3 className="font-headline-sm text-body-md font-semibold text-on-surface m-0">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-bold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs text-primary hover:underline font-medium bg-transparent border-0 cursor-pointer p-0"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto divide-y divide-border-subtle flex-1">
            {notifications.length === 0 ? (
              <div className="p-lg text-center text-secondary text-body-sm">
                No notifications right now
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.notification_id}
                  onClick={() => handleItemClick(item)}
                  className={`p-md hover:bg-surface-container-low transition-colors cursor-pointer flex items-start gap-sm ${
                    item.status === 'unread' ? 'bg-primary/[0.03]' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      item.priority === 'emergency' || item.priority === 'urgent'
                        ? 'bg-error/10 text-error'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {getCategoryIcon(item.category)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-xs">
                      <p
                        className={`text-body-sm m-0 truncate ${
                          item.status === 'unread'
                            ? 'font-bold text-on-surface'
                            : 'font-medium text-on-surface-variant'
                        }`}
                      >
                        {item.title}
                      </p>
                      {item.status === 'unread' && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-secondary line-clamp-2 m-0 mt-0.5">
                      {item.message}
                    </p>

                    <span className="text-[10px] text-outline mt-1 block">
                      {new Date(item.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-xs bg-surface-container-low border-t border-border-subtle text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                navigate('/notifications')
              }}
              className="w-full py-1.5 text-xs text-primary font-bold hover:underline bg-transparent border-0 cursor-pointer"
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
