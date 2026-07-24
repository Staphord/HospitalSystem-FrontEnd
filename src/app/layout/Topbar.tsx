import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { ROLES } from '@/lib/roles'
import { ReceptionTopbar } from '@/app/layout/ReceptionTopbar'
import { TriageTopbar } from '@/app/layout/TriageTopbar'
import { WardTopbar } from '@/app/layout/WardTopbar'
import { NotificationBellDropdown } from '@/app/layout/NotificationBellDropdown'

export function Topbar() {
  const { user } = useAuth()
  const location = useLocation()
  const { hasRole, isHospitalAdmin } = usePermissions()

  if (hasRole(ROLES.receptionist) && !isHospitalAdmin()) {
    return <ReceptionTopbar />
  }

  if (hasRole(ROLES.triageNurse) && !isHospitalAdmin()) {
    return <TriageTopbar />
  }

  if (hasRole(ROLES.wardNurse) && !isHospitalAdmin()) {
    return <WardTopbar />
  }

  if (hasRole(ROLES.cashier) && !isHospitalAdmin()) {
    return <BillingTopbar />
  }

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
    if (p.includes('/reception/search')) return 'Patient Search'
    if (p.includes('/reception/queue')) return 'Reception Queue'
    if (p.includes('/triage/assess')) return 'Triage Assessment'
    if (p.includes('/triage/history')) return 'Patient History'
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
        <NotificationBellDropdown />
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

function BillingTopbar() {
  const { user } = useAuth()
  const location = useLocation()

  const getPageTitle = (path: string) => {
    const p = path.toLowerCase()
    if (p.includes('/billing/dashboard')) return 'My Dashboard'
    if (p.includes('/billing/bills')) return 'Patient Bills'
    if (p.includes('/billing/summary')) return 'Daily Summary'
    if (p.includes('/billing/payment')) return 'Process Payment'
    return 'Billing Portal'
  }

  return (
    <header className="h-16 bg-white border-b border-[#dfe1e6] flex items-center justify-between px-lg sticky top-0 z-40 w-full shrink-0">
      <div className="flex items-center gap-md">
        <h2 className="font-headline-md text-[20px] font-semibold text-[#1a1b21] m-0">
          {getPageTitle(location.pathname)}
        </h2>
      </div>
      <div className="flex items-center gap-lg">
        <div className="flex items-center gap-sm">
          <NotificationBellDropdown />
          <div className="h-6 w-[1px] bg-[#dfe1e6] mx-sm"></div>
          <div className="flex items-center border border-[#42526E] rounded-full px-3 py-[2px] gap-xs bg-white">
            <span className="w-2 h-2 rounded-full bg-[#36b37e] animate-pulse"></span>
            <span className="font-label-sm text-[11px] text-[#42526E] font-semibold">
              Billing Active
            </span>
          </div>
        </div>
        <Link
          to="/profile"
          className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-semibold text-xs border border-border-subtle no-underline"
          title={user?.full_name || user?.username || 'User Profile'}
        >
          {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
        </Link>
      </div>
    </header>
  )
}
