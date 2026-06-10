import { NavLink, useNavigate } from 'react-router-dom'
import { HOSPITAL_NAV, MASTER_NAV } from '@/lib/roles'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@/api/services/auth'
import { toast } from 'sonner'

export function Sidebar() {
  const { hasAnyRole, isSuperAdmin } = usePermissions()
  const { user, clearAuth, refreshToken } = useAuth()
  const navigate = useNavigate()

  const navItems = isSuperAdmin() ? MASTER_NAV : HOSPITAL_NAV

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await authService.logout(refreshToken)
      }
    } catch {
      // Session may already be expired
    } finally {
      clearAuth()
      toast.success('You have been signed out.')
      navigate('/login')
    }
  }

  const getRoleLabel = (role: string) => {
    if (!role) return ''
    return role
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }

  const getGroupedNav = () => {
    const visibleItems = navItems.filter((item) => hasAnyRole(item.roles))
    
    if (isSuperAdmin()) {
      return [
        {
          title: 'Overview',
          items: visibleItems.filter(
            (item) =>
              item.path.includes('/master/dashboard')
          ),
        },
        {
          title: 'Tenant Management',
          items: visibleItems.filter(
            (item) =>
              item.path.includes('/master/tenants') ||
              item.path.includes('/master/subscriptions') ||
              item.path.includes('/master/invoices')
          ),
        },
        {
          title: 'Platform Operations',
          items: visibleItems.filter(
            (item) =>
              item.path.includes('/master/admins') ||
              item.path.includes('/master/health') ||
              item.path.includes('/master/announcements') ||
              item.path.includes('/master/audit-logs')
          ),
        },
      ]
    } else {
      return [
        {
          title: 'Overview',
          items: visibleItems.filter(
            (item) =>
              item.path === '/dashboard' ||
              item.path === '/reports' ||
              item.path === '/notifications'
          ),
        },
        {
          title: 'Clinical Workflow',
          items: visibleItems.filter(
            (item) =>
              item.path.includes('/reception') ||
              item.path.includes('/triage') ||
              item.path.includes('/consultation') ||
              item.path.includes('/ward')
          ),
        },
        {
          title: 'Ancillary Services',
          items: visibleItems.filter(
            (item) =>
              item.path.includes('/laboratory') ||
              item.path.includes('/radiology') ||
              item.path.includes('/pharmacy')
          ),
        },
        {
          title: 'Admin & Billing',
          items: visibleItems.filter(
            (item) =>
              item.path.includes('/admin/users') ||
              item.path === '/billing'
          ),
        },
      ]
    }
  }

  const groupedNav = getGroupedNav()

  return (
    <aside className="sidebar">
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
        <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--color-primary)' }}>
            local_hospital
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.05rem', lineHeight: 1.1 }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>Hospital PMS</span>
            {isSuperAdmin() && (
              <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Super Admin Portal
              </span>
            )}
          </div>
        </div>
        <nav className="sidebar-nav">
          {groupedNav.map((group) => {
            if (group.items.length === 0) return null
            return (
              <div key={group.title} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <div className="sidebar-group-title">{group.title}</div>
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      isActive ? 'nav-link active' : 'nav-link'
                    }
                  >
                    <span className="material-symbols-outlined nav-icon" style={{ marginRight: '0.75rem', fontSize: '1.25rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      {item.label === 'Tenants' ? 'domain' :
                       item.label === 'Subscriptions' ? 'card_membership' :
                       item.label === 'Invoices' ? 'receipt_long' :
                       item.label === 'Platform Admins' ? 'admin_panel_settings' :
                       item.label === 'System Health' ? 'monitor_heart' :
                       item.label === 'Announcements' ? 'campaign' :
                       item.label === 'Audit Logs' ? 'history' :
                       item.label === 'Dashboard' ? 'dashboard' :
                       item.label === 'Reports' ? 'bar_chart' :
                       item.label === 'Users' ? 'group' :
                       item.label === 'Reception' ? 'how_to_reg' :
                       item.label === 'Queue' ? 'hourglass_empty' :
                       item.label === 'Triage' ? 'medical_services' :
                       item.label === 'Consultation' ? 'chat' :
                       item.label === 'Laboratory' ? 'biotech' :
                       item.label === 'Radiology' ? 'settings_accessibility' :
                       item.label === 'Pharmacy' ? 'medication' :
                       item.label === 'Billing' ? 'payments' :
                       item.label === 'Ward' ? 'bed' :
                       item.label === 'Notifications' ? 'notifications' : 'description'}
                    </span>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-profile">
          <div className="avatar-circle">
            {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
          </div>
          <div className="profile-info">
            <div className="profile-name" title={user?.full_name || user?.username || 'User'}>
              {user?.full_name || user?.username || 'User'}
            </div>
            <div className="profile-role" title={getRoleLabel(user?.role || '')}>
              {getRoleLabel(user?.role || '')}
            </div>
          </div>
        </div>
        <button
          className="btn-logout"
          title="Sign out"
          onClick={handleLogout}
          style={{
            color: '#dc3545',
            transition: 'transform 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'translateX(2px)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'none')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
