import { useLocation, Link } from 'react-router-dom'
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
    if (p.includes('/reports/patients')) return 'Patient Reports'
    if (p.includes('/reports/revenue')) return 'Revenue Reports'
    if (p.includes('/reports/operations')) return 'Operational Reports'
    if (p.includes('/reports')) return 'Reports'
    if (p.includes('/staff/new')) return 'Add New Staff'
    if (p.includes('/staff') && p.includes('/edit')) return 'Edit Staff Member'
    if (p.includes('/staff')) return 'All Staff'
    if (p.includes('/sessions')) return 'Active Sessions'
    if (p.includes('/departments')) return 'Departments & Wards'
    if (p.includes('/fees')) return 'Fee Schedules'
    if (p.includes('/insurance')) return 'Insurance Providers'
    if (p.includes('/settings')) return 'Hospital Settings'
    if (p.includes('/audit-logs')) return 'Audit Logs'
    if (p.includes('/backup')) return 'Data Backup'
    if (p.includes('/subscription')) return 'My Subscription'
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
        <Link
          to={location.pathname.startsWith('/master') ? '/master/profile' : '/profile'}
          className="topbar-profile-avatar"
          title={user?.full_name || user?.username || 'User Profile'}
          style={{ textDecoration: 'none' }}
        >
          {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
        </Link>
      </div>
    </header>
  )
}
