import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { HOSPITAL_NAV, MASTER_NAV, ROLES } from '@/lib/roles'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@/api/services/auth'
import { getReceptionNavIcon, getReceptionNavLabel } from '@/app/layout/receptionNavUtils'
import { getTriageNavIcon, getTriageNavLabel, isTriageNavItemActive } from '@/app/layout/triageNavUtils'
import { getConsultationNavIcon, getConsultationNavLabel, isConsultationNavItemActive } from '@/app/layout/consultationNavUtils'
import { getLaboratoryNavIcon, isLaboratoryNavItemActive } from '@/app/layout/laboratoryNavUtils'
import { toast } from 'sonner'

export function Sidebar() {
  const { hasRole, hasAnyRole, isSuperAdmin, isHospitalAdmin } = usePermissions()
  const { user, clearAuth, refreshToken } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

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

  // Get navigation items grouped by section
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
              item.path.includes('/master/invoices') ||
              item.path.includes('/master/payments')
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
    } else if (isHospitalAdmin()) {
      return [
        {
          title: 'Overview',
          items: visibleItems.filter((item) => item.path === '/admin/dashboard'),
        },
        {
          title: 'Staff Management',
          items: visibleItems.filter(
            (item) =>
              item.path === '/admin/staff' ||
              item.path === '/admin/sessions'
          ),
        },
        {
          title: 'Hospital Configuration',
          items: visibleItems.filter(
            (item) =>
              item.path === '/admin/departments' ||
              item.path === '/admin/fees' ||
              item.path === '/admin/insurance' ||
              item.path === '/admin/settings'
          ),
        },
        {
          title: 'Reports & Analytics',
          items: visibleItems.filter(
            (item) =>
              item.path === '/admin/reports/patients' ||
              item.path === '/admin/reports/revenue' ||
              item.path === '/admin/reports/operations'
          ),
        },
        {
          title: 'System',
          items: visibleItems.filter(
            (item) =>
              item.path === '/admin/audit-logs' ||
              item.path === '/admin/backup' ||
              item.path === '/admin/subscription'
          ),
        },
      ]
    } else if (hasRole(ROLES.receptionist)) {
      return [
        {
          title: 'Overview',
          items: visibleItems.filter((item) => item.path === '/dashboard'),
        },
        {
          title: 'Patients',
          items: visibleItems.filter(
            (item) =>
              item.path === '/reception/register' ||
              item.path === '/reception/search'
          ),
        },
        {
          title: 'Queue',
          items: visibleItems.filter((item) => item.path === '/reception/queue'),
        },
        {
          title: 'Billing',
          items: visibleItems.filter((item) => item.path === '/billing'),
        },
      ]
    } else if (hasRole(ROLES.triageNurse)) {
      return [
        {
          title: 'Overview',
          items: visibleItems.filter((item) => item.path === '/dashboard'),
        },
        {
          title: 'Triage',
          items: visibleItems.filter((item) => item.path === '/triage/queue'),
        },
        {
          title: 'Patients',
          items: visibleItems.filter((item) => item.path === '/triage/history'),
        },
      ]
    } else if (hasRole(ROLES.labTechnician)) {
      return [
        {
          title: 'Overview',
          items: visibleItems.filter((item) => item.path === '/dashboard'),
        },
        {
          title: 'Laboratory',
          items: visibleItems.filter(
            (item) =>
              item.path === '/laboratory/requests' ||
              item.path === '/laboratory/results'
          ),
        },
        {
          title: 'Specimens',
          items: visibleItems.filter((item) => item.path === '/laboratory/specimens'),
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
              item.path.includes('/admin/') ||
              item.path === '/billing'
          ),
        },
      ]
    }
  }

  const groupedNav = getGroupedNav()

  if (isHospitalAdmin()) {
    return (
      <aside className="sidebar admin-portal-theme bg-surface-white border-r border-border-subtle flex flex-col h-screen overflow-hidden" style={{ padding: 0 }}>
        {/* Brand logo header */}
        <div className="px-md py-lg flex items-center space-x-sm" style={{ padding: '24px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shrink-0" style={{ width: '40px', height: '40px', borderRadius: '9999px', backgroundColor: '#0052cc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}>
              festival
            </span>
          </div>
          <div className="overflow-hidden" style={{ overflow: 'hidden' }}>
            <h1 className="font-headline-sm text-[14px] leading-tight truncate text-on-surface" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 600, lineHeight: 1.25, margin: 0, color: '#191c1e', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              Muhimbili National Hospital
            </h1>
            <p className="font-label-sm text-outline text-[11px] leading-tight" style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 500, lineHeight: 1.25, margin: 0, color: '#737685' }}>
              Admin Portal
            </p>
          </div>
        </div>

        {/* Renders main navigation structure */}
        <nav className="flex-1 overflow-y-auto px-xs nav-scrollbar space-y-lg mt-sm" style={{ flex: 1, overflowY: 'auto', paddingLeft: '4px', paddingRight: '4px', marginTop: '8px' }}>
          {groupedNav.map((group) => {
            if (group.items.length === 0) return null;
            return (
              <div key={group.title} className="space-y-xs" style={{ marginBottom: '24px' }}>
                <h3 className="px-md mb-xs font-label-md text-outline text-[11px] tracking-wider uppercase" style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: '#737685', paddingLeft: '16px', paddingRight: '16px', margin: '0 0 8px 0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {group.title}
                </h3>
                <ul className="space-y-[2px]" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {group.items.map((item) => (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center space-x-sm px-md py-sm transition-colors group ${
                            isActive
                              ? 'sidebar-active bg-row-hover text-primary font-semibold'
                              : 'text-secondary hover:bg-surface-container-low'
                          }`
                        }
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              className="material-symbols-outlined shrink-0"
                              style={{
                                fontVariationSettings: isActive || item.label === 'Dashboard' ? "'FILL' 1" : "'FILL' 0",
                                fontSize: '20px'
                              }}
                            >
                              {item.label === 'Tenants' ? 'domain' :
                               item.label === 'Subscriptions' ? 'card_membership' :
                               item.label === 'Invoices' ? 'receipt_long' :
                               item.label === 'Payments' ? 'payments' :
                               item.label === 'Platform Admins' ? 'admin_panel_settings' :
                               item.label === 'System Health' ? 'monitor_heart' :
                               item.label === 'Announcements' ? 'campaign' :
                               (item.label === 'Audit Logs' || item.label === 'Active Sessions' || item.label === 'Sessions') ? 'history' :
                               item.label === 'Dashboard' ? 'dashboard' :
                               item.label === 'Reports' ? 'bar_chart' :
                               (item.label === 'All Staff' || item.label === 'Users') ? 'group' :
                               (item.label === 'Departments & Wards' || item.label === 'Departments') ? 'domain' :
                               (item.label === 'Fee Schedules' || item.label === 'Fees') ? 'receipt_long' :
                               (item.label === 'Insurance Providers' || item.label === 'Insurance') ? 'health_and_safety' :
                               item.label === 'Hospital Settings' ? 'settings_heart' :
                               item.label === 'Settings' ? 'settings' :
                               item.label === 'Data Backup' ? 'cloud_upload' :
                               (item.label === 'My Subscription' || item.label === 'Subscription') ? 'card_membership' :
                               item.label === 'Patient Reports' ? 'assignment' :
                               item.label === 'Revenue Reports' ? 'monetization_on' :
                               item.label === 'Operational Reports' ? 'analytics' : 'description'}
                            </span>
                            <span className="font-body-md" style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
                              {item.label}
                            </span>
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Renders administrator user profile footer */}
        <div className="p-md border-t border-border-subtle bg-surface-white" style={{ padding: '16px', borderTop: '1px solid #DFE1E6', backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center space-x-sm mb-md" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0 select-none" style={{ width: '40px', height: '40px', borderRadius: '9999px', backgroundColor: '#0052cc', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, userSelect: 'none' }}>
              <span className="font-headline-sm text-[14px] font-bold leading-none" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 700, lineHeight: 1 }}>
                {(user?.full_name || user?.username || 'U').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
              </span>
            </div>
            <div className="overflow-hidden" style={{ overflow: 'hidden' }}>
              <p className="font-headline-sm text-[14px] truncate" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 600, margin: 0, color: '#191c1e', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.full_name || user?.username || 'Hospital Admin'}
              </p>
              <span className="inline-block px-xs py-[1px] bg-row-hover text-primary text-[10px] font-bold rounded uppercase tracking-wide" style={{ display: 'inline-block', padding: '1px 4px', backgroundColor: '#DEEBFF', color: '#0052cc', fontSize: '10px', fontWeight: 700, borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                Hospital Administrator
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-xs py-sm border border-border-subtle rounded hover:bg-surface-container-low transition-colors group cursor-pointer bg-transparent"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '8px 0', border: '1px solid #DFE1E6', borderRadius: '4px', transition: 'all 0.2s', cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined text-secondary group-hover:text-error transition-colors" style={{ fontSize: '20px' }}>
              logout
            </span>
            <span className="font-label-md text-secondary group-hover:text-error transition-colors uppercase" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
              Logout
            </span>
          </button>
        </div>
      </aside>
    );
  }

  if ((hasRole(ROLES.receptionist) || user?.role === ROLES.receptionist) && !isHospitalAdmin()) {
    const displayName = user?.full_name || user?.username || 'User'

    return (
      <aside className="hidden lg:flex flex-col h-screen w-sidebar-width bg-surface-white border-r border-border-subtle overflow-hidden shrink-0">
        <div className="flex flex-col py-lg px-md gap-xs">
          <div className="flex items-center gap-sm">
            <div className="w-8 h-8 rounded bg-reception-primary flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-[20px]">local_hospital</span>
            </div>
            <span className="font-headline-sm text-headline-sm font-semibold text-on-surface leading-tight">
              Muhimbili National Hospital
            </span>
          </div>
          <span className="text-secondary font-body-sm pl-[40px]">Reception</span>
        </div>

        <nav className="flex-1 overflow-y-auto nav-scrollbar py-sm">
          {groupedNav.map((group) => {
            if (group.items.length === 0) return null
            return (
              <div key={group.title} className="mb-lg">
                <h3 className="px-md mb-xs font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                  {group.title}
                </h3>
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `reception-nav-link flex items-center gap-3 px-md py-sm cursor-pointer transition-all duration-200 ease-in-out ${
                        isActive ? 'reception-nav-link--active' : ''
                      }`
                    }
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {getReceptionNavIcon(item.label)}
                    </span>
                    <span className="font-body-sm">{getReceptionNavLabel(item.label)}</span>
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>

        <div className="border-t border-border-subtle p-md flex flex-col gap-sm bg-surface-container-low">
          <div className="flex items-center gap-sm min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-semibold text-sm shrink-0 border border-border-subtle">
              {displayName
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-body-sm font-semibold text-on-surface truncate">{displayName}</span>
              <span className="text-label-sm text-secondary">Receptionist</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-sm text-secondary hover:text-error transition-colors font-body-sm w-full py-xs bg-transparent border-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    )
  }

  if ((hasRole(ROLES.triageNurse) || user?.role === ROLES.triageNurse) && !isHospitalAdmin()) {
    const displayName = user?.full_name || user?.username || 'User'

    return (
      <aside className="hidden lg:flex flex-col h-screen w-sidebar-width bg-surface-white border-r border-border-subtle overflow-hidden shrink-0">
        <div className="flex flex-col py-lg px-md gap-xs">
          <div className="flex items-center gap-sm">
            <div className="w-8 h-8 rounded bg-reception-primary flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-[20px]">local_hospital</span>
            </div>
            <span className="font-headline-sm text-headline-sm font-semibold text-on-surface leading-tight">
              Muhimbili National Hospital
            </span>
          </div>
          <span className="text-secondary font-body-sm pl-[40px]">Triage</span>
        </div>

        <nav className="flex-1 overflow-y-auto nav-scrollbar py-sm">
          {groupedNav.map((group) => {
            if (group.items.length === 0) return null
            return (
              <div key={group.title} className="mb-lg">
                <h3 className="px-md mb-xs font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                  {group.title}
                </h3>
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={() =>
                      `reception-nav-link flex items-center gap-3 px-md py-sm cursor-pointer transition-all duration-200 ease-in-out ${
                        isTriageNavItemActive(item.path, location.pathname)
                          ? 'reception-nav-link--active'
                          : ''
                      }`
                    }
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {getTriageNavIcon(item.label)}
                    </span>
                    <span className="font-body-sm">{getTriageNavLabel(item.label)}</span>
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>

        <div className="border-t border-border-subtle p-md flex flex-col gap-sm bg-surface-container-low">
          <div className="flex items-center gap-sm min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-semibold text-sm shrink-0 border border-border-subtle">
              {displayName
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-body-sm font-semibold text-on-surface truncate">{displayName}</span>
              <span className="text-label-sm text-secondary">Triage Nurse</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-sm text-secondary hover:text-error transition-colors font-body-sm w-full py-xs bg-transparent border-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    )
  }

  if ((hasRole(ROLES.labTechnician) || user?.role === ROLES.labTechnician) && !isHospitalAdmin()) {
    const displayName = user?.full_name || user?.username || 'User'

    const LABORATORY_NAV = [
      {
        section: 'Overview',
        items: [{ label: 'My Dashboard', path: '/dashboard' }],
      },
      {
        section: 'Laboratory',
        items: [
          { label: 'Test Requests', path: '/laboratory/requests' },
          { label: 'Results Entry', path: '/laboratory/results' },
        ],
      },
      {
        section: 'Specimens',
        items: [{ label: 'Specimen Tracking', path: '/laboratory/specimens' }],
      },
    ]

    return (
      <aside className="hidden lg:flex flex-col h-screen w-sidebar-width bg-surface-white border-r border-border-subtle overflow-hidden shrink-0">
        <div className="flex flex-col py-lg px-md gap-xs">
          <div className="flex items-center gap-sm">
            <div className="w-8 h-8 rounded bg-reception-primary flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-[20px]">local_hospital</span>
            </div>
            <span className="font-headline-sm text-headline-sm font-semibold text-on-surface leading-tight">
              Muhimbili National Hospital
            </span>
          </div>
          <span className="text-secondary font-body-sm pl-[40px]">Laboratory</span>
        </div>

        <nav className="flex-1 overflow-y-auto nav-scrollbar py-sm space-y-lg">
          {LABORATORY_NAV.map((group) => (
            <div key={group.section} className="mb-xs">
              <h3 className="px-md mb-xs font-label-md text-label-md text-on-surface-variant uppercase tracking-wider opacity-60">
                {group.section}
              </h3>
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={() =>
                    `reception-nav-link flex items-center gap-3 px-md py-sm cursor-pointer transition-all duration-200 ease-in-out ${
                      isLaboratoryNavItemActive(item.path, location.pathname)
                        ? 'reception-nav-link--active'
                        : ''
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {getLaboratoryNavIcon(item.label)}
                  </span>
                  <span className="font-body-sm">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-border-subtle p-md flex flex-col gap-sm bg-surface-container-low">
          <div className="flex items-center gap-sm min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-semibold text-sm shrink-0 border border-border-subtle">
              {displayName
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-body-sm font-semibold text-on-surface truncate">{displayName}</span>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                <span className="text-label-sm text-warning">Lab Technician</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-sm text-secondary hover:text-error transition-colors font-body-sm w-full py-xs bg-transparent border-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    )
  }

  if ((hasRole(ROLES.doctor) || user?.role === ROLES.doctor) && !isHospitalAdmin()) {
    const displayName = user?.full_name || user?.username || 'User'
    const roleLabel = user?.role ? getRoleLabel(user.role) : 'Medical Officer'

    const CONSULTATION_NAV = [
      {
        section: 'OVERVIEW',
        items: [{ label: 'Dashboard', path: '/dashboard' }],
      },
      {
        section: 'CONSULTATIONS',
        items: [
          { label: 'Consultation', path: '/consultation/queue' },
          { label: 'Inpatient', path: '/consultation/inpatient' },
        ],
      },
      {
        section: 'RESULTS',
        items: [{ label: 'Investigation Results', path: '/consultation/results' }],
      },
      {
        section: 'RECORDS',
        items: [{ label: 'Patient History', path: '/consultation/history' }],
      },
      {
        section: 'REFERRALS',
        items: [{ label: 'My Referrals', path: '/consultation/referrals' }],
      },
    ]

    return (
      <aside className="hidden lg:flex flex-col h-screen w-sidebar-width bg-surface-white border-r border-border-subtle overflow-hidden shrink-0">
        {/* Brand header */}
        <div className="flex flex-col py-lg px-md gap-xs">
          <div className="flex items-center gap-sm">
            <div className="w-8 h-8 rounded bg-reception-primary flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-[20px]">local_hospital</span>
            </div>
            <span className="font-headline-sm text-headline-sm font-semibold text-on-surface leading-tight">
              Muhimbili National Hospital
            </span>
          </div>
          <span className="text-secondary font-body-sm pl-[40px]">Consultation Portal</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto nav-scrollbar py-sm space-y-lg">
          {CONSULTATION_NAV.map((group) => (
            <div key={group.section} className="mb-xs">
              <h3 className="px-md mb-xs font-label-md text-label-md text-on-surface-variant uppercase tracking-wider opacity-60">
                {group.section}
              </h3>
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={() =>
                    `reception-nav-link flex items-center gap-3 px-md py-sm cursor-pointer transition-all duration-200 ease-in-out ${
                      isConsultationNavItemActive(item.path, location.pathname)
                        ? 'reception-nav-link--active'
                        : ''
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {getConsultationNavIcon(item.label)}
                  </span>
                  <span className="font-body-sm">{getConsultationNavLabel(item.label)}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-border-subtle p-md flex flex-col gap-sm bg-surface-container-low">
          <div className="flex items-center gap-sm min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-semibold text-sm shrink-0 border border-border-subtle">
              {displayName
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-body-sm font-semibold text-on-surface truncate">{displayName}</span>
              <span className="text-label-sm text-secondary">{roleLabel}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-sm text-secondary hover:text-error transition-colors font-body-sm w-full py-xs bg-transparent border-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    )
  }

  return null
}
