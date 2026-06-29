import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

function getWardPageTitle(path: string): string {
  const p = path.toLowerCase()
  if (p.includes('/ward/dashboard') || p === '/ward' || p.endsWith('/ward/')) return 'My Dashboard'
  if (p.includes('/ward/beds')) return 'Bed Map'
  if (p.includes('/ward/patients') && p.includes('/notes')) return 'Nursing Notes'
  if (p.includes('/ward/patients')) return 'My Patients'
  if (p.includes('/ward/orders')) return 'Inpatient Orders'
  if (p.includes('/ward/visitors/active')) return 'Active Visitors'
  if (p.includes('/ward/visitors')) return 'Visitor Log'
  if (p.includes('/ward/handover')) return 'Shift Handover'
  if (p.includes('/ward/admissions')) return 'Ward Admissions'
  if (p.includes('/notifications')) return 'Notifications'
  if (p.includes('/profile')) return 'My Profile'
  return 'Ward Dashboard'
}

function UserAvatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'

  return (
    <div
      className={`${dim} rounded-full bg-primary-container flex items-center justify-center text-on-primary font-semibold shrink-0 border border-border-subtle`}
      aria-hidden
    >
      {initials || 'U'}
    </div>
  )
}

export function WardTopbar() {
  const { user } = useAuth()
  const location = useLocation()
  const [showNotificationBadge, setShowNotificationBadge] = useState(true)
  const displayName = user?.full_name || user?.username || 'User'

  return (
    <header className="h-12 bg-surface-white border-b border-border-subtle flex justify-between items-center px-lg z-40 shrink-0">
      <div className="flex items-center min-w-0">
        <h1 className="font-headline-md text-headline-md font-semibold text-on-surface truncate m-0">
          {getWardPageTitle(location.pathname)}
        </h1>
      </div>

      <div className="flex items-center gap-md shrink-0">
        <Link
          to="/notifications"
          className="relative p-2 hover:bg-surface-container-low rounded-full transition-colors flex items-center justify-center no-underline"
          title="Notifications"
          onClick={() => setShowNotificationBadge(false)}
        >
          <span className="material-symbols-outlined text-secondary">notifications</span>
          {showNotificationBadge && (
            <span className="absolute top-1 right-1.5 w-2 h-2 bg-error rounded-full border border-surface-white" />
          )}
        </Link>

        <div className="flex items-center bg-success/10 text-success px-sm py-xs rounded-full gap-xs border border-success/20">
          <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
          <span className="font-label-md text-label-md whitespace-nowrap">General Ward Active</span>
        </div>

        <div className="h-6 w-px bg-border-subtle mx-xs hidden md:block" />

        <Link to="/profile" className="flex items-center gap-sm no-underline" title={displayName}>
          <UserAvatar name={displayName} size="sm" />
        </Link>
      </div>
    </header>
  )
}
