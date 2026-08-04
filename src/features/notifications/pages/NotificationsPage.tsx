import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import {
  notificationsApi,
  type NotificationItem,
  type NotificationCategory,
  type NotificationPreference,
} from '@/api/services/notifications'
import { useNotifications } from '@/context/NotificationContext'

type CategoryFilter = 'all' | NotificationCategory
type StatusFilter = 'all' | 'unread'

const PRIORITY_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  emergency: { label: 'EMERGENCY', bg: 'bg-error/10', text: 'text-error font-bold' },
  urgent: { label: 'URGENT', bg: 'bg-warning/10', text: 'text-warning font-bold' },
  normal: { label: 'NORMAL', bg: 'bg-secondary/10', text: 'text-secondary' },
  low: { label: 'LOW', bg: 'bg-surface-container-highest', text: 'text-outline' },
}

const CATEGORY_ICONS: Record<string, string> = {
  clinical: 'medical_services',
  pharmacy: 'medication',
  billing: 'payments',
  system: 'settings_suggest',
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const { user, roles } = useAuth()
  const { markAsRead, markAllAsRead, refreshNotifications } = useNotifications()

  const isSuperAdmin = user?.role === 'super_admin'

  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [total, setTotal] = useState<number>(0)
  const [showPreferences, setShowPreferences] = useState<boolean>(false)
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null)

  const fetchItems = async () => {
    try {
      setLoading(true)
      const res = await notificationsApi.getNotifications({
        unread_only: statusFilter === 'unread',
        page,
        page_size: pageSize,
      })
      setItems(res.items || [])
      setTotal(res.total || 0)
    } catch {
      toast.error('Failed to load notifications list.')
    } finally {
      setLoading(false)
    }
  }

  const fetchPreferences = async () => {
    try {
      const res = await notificationsApi.getPreferences()
      setPreferences(res)
    } catch {
      // Preference load handle
    }
  }

  useEffect(() => {
    fetchItems()
  }, [statusFilter, page, pageSize])

  const handleMarkItemRead = async (id: string) => {
    await markAsRead(id)
    setItems((prev) =>
      prev.map((item) => (item.notification_id === id ? { ...item, status: 'read' as const } : item))
    )
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead()
    setItems((prev) => prev.map((item) => ({ ...item, status: 'read' as const })))
  }

  const handleSavePreferences = async (updated: Partial<NotificationPreference>) => {
    try {
      const res = await notificationsApi.updatePreferences(updated)
      setPreferences(res)
      toast.success('Notification preferences updated.')
      setShowPreferences(false)
    } catch {
      toast.error('Failed to update notification preferences.')
    }
  }

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    )
  }, [items, searchQuery])

  const totalPages = Math.ceil(total / pageSize) || 1
  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endIndex = Math.min(page * pageSize, total)

  return (
    <div className="max-w-container-max mx-auto w-full flex flex-col gap-lg pb-xl">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface m-0">Notification Center</h1>
          <p className="text-body-sm text-secondary m-0 mt-0.5">
            {isSuperAdmin
              ? 'Manage platform alerts, tenant requests, and system telemetry notifications'
              : 'Manage system alerts, clinical notifications, and preference settings'}
          </p>
        </div>

        <div className="flex items-center gap-sm">
          <button
            type="button"
            onClick={() => {
              fetchPreferences()
              setShowPreferences(true)
            }}
            className="px-md h-9 rounded-lg border border-border-subtle text-body-sm font-medium text-secondary hover:bg-surface-variant transition-colors bg-surface-white cursor-pointer flex items-center gap-xs"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            Preferences
          </button>

          <button
            type="button"
            onClick={handleMarkAllRead}
            className="px-md h-9 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-body-sm font-semibold transition-colors border-0 cursor-pointer flex items-center gap-xs"
          >
            <span className="material-symbols-outlined text-[18px]">done_all</span>
            Mark All Read
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-white border border-border-subtle rounded-xl p-md flex flex-col lg:flex-row lg:items-center justify-between gap-md shadow-sm">
        {/* Notifications Header Label */}
        <div className="flex items-center gap-2 text-secondary text-body-sm font-medium">
          <span className="material-symbols-outlined text-primary text-[20px]">notifications_active</span>
          <span>{isSuperAdmin ? 'System Alerts & Notifications' : 'Notifications'}</span>
        </div>

        <div className="flex items-center gap-sm flex-wrap">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[220px]">
            <span className="material-symbols-outlined absolute inset-y-0 left-0 flex items-center justify-center w-9 text-secondary text-[18px] pointer-events-none select-none z-10 leading-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
              className="w-full h-9 pl-9 pr-3 border border-border-subtle rounded-lg text-body-sm bg-surface-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-outline"
            />
          </div>

          {/* Status Filter Toggle */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter)
              setPage(1)
            }}
            className="h-9 px-md border border-border-subtle rounded-lg text-body-sm bg-surface-white cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-secondary font-medium"
          >
            <option value="all">Status: All</option>
            <option value="unread">Unread Only</option>
          </select>

          {/* Page Size Selector */}
          <select
            className="h-9 px-md border border-border-subtle rounded-lg text-body-sm bg-surface-white cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-secondary font-medium"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
            title="Page Size"
          >
            <option value={5}>Show: 5</option>
            <option value={10}>Show: 10</option>
            <option value={20}>Show: 20</option>
            <option value={50}>Show: 50</option>
          </select>

          <button
            type="button"
            onClick={() => {
              fetchItems()
              refreshNotifications()
            }}
            title="Refresh"
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-border-subtle text-secondary hover:bg-surface-variant transition-colors bg-surface-white cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-surface-white border border-border-subtle rounded-xl overflow-hidden shadow-sm flex flex-col">
        {loading ? (
          <div className="p-xl space-y-md">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="h-20 bg-surface-container-highest rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-2xl text-center flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-outline text-[48px] mb-sm">
              notifications_off
            </span>
            <h3 className="font-headline-sm text-body-lg font-semibold text-on-surface m-0 mb-xs">
              No notifications found
            </h3>
            <p className="text-body-sm text-secondary m-0 max-w-sm">
              You are all caught up! There are no notifications matching your current filters.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {filteredItems.map((item) => {
              const priorityStyle =
                PRIORITY_BADGES[item.priority] || PRIORITY_BADGES.normal
              const categoryIcon = CATEGORY_ICONS[item.category] || 'notifications'
              const isUnread = item.status === 'unread'

              return (
                <div
                  key={item.notification_id}
                  className={`p-md sm:p-lg flex flex-col sm:flex-row items-start justify-between gap-md transition-colors ${isUnread ? 'bg-primary/[0.02]' : 'hover:bg-surface-container-low/50'
                    }`}
                >
                  <div className="flex items-start gap-md flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isUnread ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-secondary'
                        }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{categoryIcon}</span>
                    </div>

                    <div className="space-y-xs">
                      <div className="flex items-center gap-xs flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] tracking-wider uppercase ${priorityStyle.bg} ${priorityStyle.text}`}
                        >
                          {priorityStyle.label}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-surface-container-high text-secondary capitalize font-medium">
                          {item.category}
                        </span>
                        {isUnread && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            NEW
                          </span>
                        )}
                      </div>

                      <h4 className="font-title-md text-body-md font-semibold text-on-surface m-0">
                        {item.title}
                      </h4>
                      <p className="text-body-sm text-secondary m-0 leading-relaxed">
                        {item.message}
                      </p>

                      <span className="text-[11px] text-outline block pt-xs">
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-xs self-end sm:self-center flex-shrink-0">
                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => handleMarkItemRead(item.notification_id)}
                        className="px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-semibold text-secondary hover:bg-surface-variant transition-colors bg-surface-white cursor-pointer"
                      >
                        Mark Read
                      </button>
                    )}

                    {item.action_url && (
                      <button
                        type="button"
                        onClick={() => {
                          if (isUnread) handleMarkItemRead(item.notification_id)
                          const isDoctor = (roles || []).some((r) => String(r).toLowerCase().includes('doctor')) || user?.role === 'doctor'
                          const targetUrl = (isDoctor && (item.action_url!.startsWith('/laboratory') || item.action_url!.startsWith('/radiology')))
                            ? '/consultation/results'
                            : item.action_url!
                          navigate(targetUrl)
                        }}
                        className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:brightness-95 transition-all border-0 cursor-pointer flex items-center gap-xs"
                      >
                        View Details
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer Pagination */}
        <div className="p-md bg-surface-bright flex flex-col sm:flex-row items-center justify-between border-t border-outline-variant gap-md">
          <span className="font-body-sm text-body-sm text-secondary">
            Showing <strong>{startIndex}</strong> to <strong>{endIndex}</strong> of{' '}
            <strong>{total}</strong> entries
          </span>

          <div className="flex items-center gap-xs">
            <button
              type="button"
              className="px-sm py-xs border border-outline-variant rounded bg-surface-container-lowest text-outline font-body-sm flex items-center justify-center min-w-[32px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <span className="material-symbols-outlined text-[20px] leading-none">chevron_left</span>
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1
              if (totalPages > 5 && page > 3) {
                pageNum = Math.min(page - 2 + i, totalPages - 4 + i)
              }
              return (
                <button
                  key={pageNum}
                  type="button"
                  className={`px-sm py-xs border rounded font-body-sm font-medium cursor-pointer ${page === pageNum
                      ? 'border-primary bg-primary text-white'
                      : 'border-outline-variant bg-surface-container-lowest text-secondary hover:bg-surface-container-low'
                    }`}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </button>
              )
            })}

            <button
              type="button"
              className="px-sm py-xs border border-outline-variant rounded bg-surface-container-lowest text-outline font-body-sm flex items-center justify-center min-w-[32px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <span className="material-symbols-outlined text-[20px] leading-none">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Preferences Modal */}
      {showPreferences && preferences && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-md">
          <div className="bg-surface-white border border-border-subtle rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="px-lg py-md border-b border-border-subtle flex items-center justify-between bg-surface-container-low">
              <h2 className="font-headline-sm text-headline-sm text-on-surface m-0">Notification Preferences</h2>
              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                className="p-1 text-secondary hover:text-on-surface rounded bg-transparent border-0 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-lg space-y-md">
              <label className="flex items-center justify-between cursor-pointer p-sm hover:bg-surface-container-low rounded-lg transition-colors">
                <div>
                  <span className="font-body-md font-semibold text-on-surface block">In-App Notifications</span>
                  <span className="text-xs text-secondary">Receive notifications and badge counters in app</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.in_app_enabled}
                  onChange={(e) => setPreferences({ ...preferences, in_app_enabled: e.target.checked })}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-sm hover:bg-surface-container-low rounded-lg transition-colors">
                <div>
                  <span className="font-body-md font-semibold text-on-surface block">Email Notifications</span>
                  <span className="text-xs text-secondary">Receive email summaries for important updates</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.email_enabled}
                  onChange={(e) => setPreferences({ ...preferences, email_enabled: e.target.checked })}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
              </label>
            </div>

            <div className="px-lg py-md border-t border-border-subtle bg-surface-container-low flex justify-end gap-sm">
              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                className="px-md h-9 rounded-lg border border-border-subtle text-body-sm font-medium hover:bg-surface-variant transition-colors bg-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSavePreferences(preferences)}
                className="px-lg h-9 rounded-lg bg-primary text-white font-bold text-body-sm hover:brightness-95 transition-all border-0 cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
