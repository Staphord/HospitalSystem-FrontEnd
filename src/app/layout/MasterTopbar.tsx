import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { NotificationBellDropdown } from '@/app/layout/NotificationBellDropdown'

function formatDateTime(): string {
  return new Date().toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getMasterPageTitle(pathname: string): string {
  const p = pathname.toLowerCase()
  if (p.includes('/master/dashboard')) return 'Platform Overview'
  if (p.includes('/master/tenants/new')) return 'Create Hospital Tenant'
  if (p.includes('/master/tenants/') && p !== '/master/tenants') return 'Tenant Configuration'
  if (p.includes('/master/tenants')) return 'Tenant Management'
  if (p.includes('/master/subscriptions/') && p !== '/master/subscriptions') return 'Subscription Detail'
  if (p.includes('/master/subscriptions')) return 'Subscriptions Management'
  if (p.includes('/master/plans')) return 'Subscription Tiers & Plans'
  if (p.includes('/master/requests')) return 'Subscription Requests'
  if (p.includes('/master/invoices/overdue')) return 'Overdue Accounts'
  if (p.includes('/master/invoices')) return 'Invoice Management'
  if (p.includes('/master/payments')) return 'Payments & Revenue'
  if (p.includes('/master/health') || p.includes('/master/telemetry') || p.includes('/master/monitoring')) return 'System Health & Telemetry'
  if (p.includes('/master/incidents')) return 'Platform Incidents'
  if (p.includes('/master/announcements')) return 'System Announcements'
  if (p.includes('/master/audit')) return 'Global Audit Logs'
  if (p.includes('/master/admins') || p.includes('/master/users')) return 'Platform Admins'
  if (p.includes('/master/notifications')) return 'Platform Notifications'
  if (p.includes('/master/profile')) return 'Master Admin Profile'
  return 'Platform Dashboard'
}

export function MasterTopbar() {
  const { user } = useAuth()
  const location = useLocation()
  const [dateTime, setDateTime] = useState(formatDateTime)
  const displayName = user?.full_name || user?.username || 'Superadmin'

  useEffect(() => {
    setDateTime(formatDateTime())
    const interval = setInterval(() => setDateTime(formatDateTime()), 60_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="h-14 bg-surface-white border-b border-border-subtle flex justify-between items-center px-lg z-40 shrink-0 shadow-xs">
      <div className="flex items-center gap-md min-w-0">
        <h1 className="font-headline-md text-headline-md font-semibold text-on-surface truncate m-0">
          {getMasterPageTitle(location.pathname)}
        </h1>
      </div>

      <div className="flex items-center gap-md shrink-0">
        <div className="text-text-muted font-body-sm text-body-sm hidden md:block">{dateTime}</div>

        <NotificationBellDropdown />

        <div className="flex items-center bg-purple-50 text-purple-700 border border-purple-200 px-sm py-xs rounded-full gap-xs">
          <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
          <span className="font-label-md text-xs font-semibold whitespace-nowrap">Superadmin Active</span>
        </div>

        <div className="h-6 w-px bg-border-subtle mx-xs hidden md:block" />

        <Link
          to="/master/profile"
          className="flex items-center gap-sm no-underline text-on-surface hover:text-primary transition-colors"
          title={displayName}
        >
          <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {(displayName[0] || 'S').toUpperCase()}
          </div>
        </Link>
      </div>
    </header>
  )
}
