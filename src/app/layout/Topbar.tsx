import { useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function Topbar() {
  const { user } = useAuth()
  const location = useLocation()

  // Dynamic route page titles
  const getPageTitle = (path: string) => {
    const p = path.toLowerCase()
    if (p.includes('/master/tenants')) return 'Tenants'
    if (p.includes('/master/subscriptions')) return 'Subscriptions'
    if (p.includes('/master/invoices')) return 'Invoices'
    if (p.includes('/master/admins')) return 'Platform Admins'
    if (p.includes('/master/health')) return 'System Health'
    if (p.includes('/master/announcements')) return 'Announcements'
    if (p.includes('/master/audit-logs')) return 'Security Audit Logs'
    if (p.includes('/dashboard')) return 'Dashboard'
    if (p.includes('/reports')) return 'Reports'
    if (p.includes('/admin/users')) return 'User Directory'
    if (p.includes('/reception/register')) return 'Patient Registration'
    if (p.includes('/reception/queue')) return 'Reception Queue'
    if (p.includes('/triage/queue')) return 'Triage Queue'
    if (p.includes('/consultation/queue')) return 'Clinical Consultation'
    if (p.includes('/laboratory')) return 'Laboratory Services'
    if (p.includes('/radiology')) return 'Radiology Imaging'
    if (p.includes('/pharmacy')) return 'Pharmacy Dispensing'
    if (p.includes('/billing')) return 'Billing & Cashier'
    if (p.includes('/ward')) return 'Ward Admissions'
    if (p.includes('/notifications')) return 'System Notifications'
    return 'Hospital Flow'
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">{getPageTitle(location.pathname)}</h1>
        <div className="global-search-container">
          <span className="material-symbols-outlined search-icon" style={{ fontSize: '1.25rem' }}>search</span>
          <input
            type="text"
            className="global-search-input"
            placeholder="Search transactions, patients, logs..."
          />
        </div>
      </div>

      <div className="topbar-right">
        <button className="topbar-action-btn" title="Notifications">
          <span className="material-symbols-outlined" style={{ fontSize: '1.35rem' }}>notifications</span>
          <span className="notification-badge" />
        </button>
        <button className="topbar-action-btn" title="Settings">
          <span className="material-symbols-outlined" style={{ fontSize: '1.35rem' }}>settings</span>
        </button>
        <div className="topbar-profile-avatar" title={user?.full_name || user?.username || 'User'}>
          {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
        </div>
      </div>
    </header>
  )
}
