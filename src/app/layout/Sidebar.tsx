import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { HOSPITAL_NAV, MASTER_NAV, ROLES } from '@/lib/roles'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@/api/services/auth'
import { getReceptionNavIcon, getReceptionNavLabel } from '@/app/layout/receptionNavUtils'
import { getTriageNavIcon, getTriageNavLabel } from '@/app/layout/triageNavUtils'
import { getConsultationNavIcon, getConsultationNavLabel, isConsultationNavItemActive } from '@/app/layout/consultationNavUtils'
import { getLaboratoryNavIcon, isLaboratoryNavItemActive } from '@/app/layout/laboratoryNavUtils'
import { getRadiologyNavIcon, isRadiologyNavItemActive } from '@/app/layout/radiologyNavUtils'
import { getPharmacyNavIcon, getPharmacyNavLabel, isPharmacyNavItemActive } from '@/app/layout/pharmacyNavUtils'
import { toast } from 'sonner'

export function Sidebar() {
  const { hasRole, hasAnyRole, isSuperAdmin, isHospitalAdmin } = usePermissions()
  const { user, clearAuth, refreshToken, tenantId } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = isSuperAdmin() ? MASTER_NAV : HOSPITAL_NAV

  // Retrieve dynamic hospital name from /me response or local mock store
  const tenants = JSON.parse(localStorage.getItem('hf_mock_tenants') || '[]')
  const currentTenant = tenants.find((t: any) => t.tenant_id === tenantId)
  const hospitalName =
    user?.hospital_name ||
    (currentTenant ? currentTenant.hospital_name : null) ||
    'Muhimbili National Hospital'

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
          items: visibleItems.filter((item) => item.path === '/laboratory/requests'),
        },
        {
          title: 'Specimens',
          items: visibleItems.filter((item) => item.path === '/laboratory/specimens'),
        },
      ]
    } else if (hasRole(ROLES.cashier)) {
      return [
        {
          title: 'Overview',
          items: visibleItems.filter((item) => item.path === '/dashboard' || item.path === '/billing/dashboard'),
        },
        {
          title: 'Billing & Payments',
          items: visibleItems.filter(
            (item) =>
              item.path === '/billing/bills' ||
              item.path === '/billing/summary'
          ),
        },
      ]
    } else if (hasRole(ROLES.pharmacist)) {
      return [
        {
          title: 'Overview',
          items: visibleItems.filter((item) => item.path === '/dashboard'),
        },
        {
          title: 'Pharmacy',
          items: visibleItems.filter((item) => item.path === '/pharmacy/queue'),
        },
        {
          title: 'Inventory',
          items: visibleItems.filter((item) => item.path === '/pharmacy/stock'),
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
              {hospitalName}
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
                              item.label === 'Operational Reports' ? 'analytics' :
                              item.label === 'Reception' ? 'how_to_reg' :
                              item.label === 'Register Patient' ? 'person_add' :
                              item.label === 'Patient Search' ? 'search' :
                              item.label === 'Queue' ? 'hourglass_empty' :
                              item.label === 'Queue Management' ? 'group' :
                              item.label === 'Triage' ? 'medical_services' :
                              item.label === 'Consultation' ? 'chat' :
                              item.label === 'Laboratory' ? 'biotech' :
                              item.label === 'Radiology' ? 'settings_accessibility' :
                              item.label === 'Pharmacy' ? 'medication' :
                              item.label === 'Billing' ? 'payments' :
                              item.label === 'Ward' ? 'bed' :
                              item.label === 'Notifications' ? 'notifications' : 'description'}
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
                    className={({ isActive }) =>
                      `reception-nav-link flex items-center gap-3 px-md py-sm cursor-pointer transition-all duration-200 ease-in-out ${
                        isActive ? 'reception-nav-link--active' : ''
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

  if ((hasRole(ROLES.wardNurse) || user?.role === ROLES.wardNurse) && !isHospitalAdmin()) {
    const displayName = user?.full_name || user?.username || 'Esther Komba'
    const nurseName = displayName.toLowerCase().includes('nurse') 
      ? displayName 
      : `Nurse ${displayName}`
    const initials = displayName
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()

    const WARD_NAV = [
      {
        section: 'Overview',
        items: [{ label: 'My Dashboard', path: '/ward/dashboard', icon: 'dashboard' }],
      },
      {
        section: 'Ward',
        items: [
          { label: 'Bed Map', path: '/ward/beds', icon: 'bed' },
          { label: 'My Patients', path: '/ward/patients', icon: 'clinical_notes' },
        ],
      },
      {
        section: 'Care',
        items: [{ label: 'Inpatient Orders', path: '/ward/orders', icon: 'receipt_long' }],
      },
      {
        section: 'Visitors',
        items: [{ label: 'Visitor Log', path: '/ward/visitors', icon: 'group' }],
      },
      {
        section: 'Handover',
        items: [{ label: 'Shift Handover', path: '/ward/handover', icon: 'swap_horiz' }],
      },
    ]

    return (
      <aside className="hidden lg:flex flex-col h-screen w-sidebar-width bg-surface-container-lowest border-r border-border-default overflow-hidden shrink-0 z-20">
        {/* Sidebar Header */}
        <div className="px-md py-lg flex items-center gap-sm">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary overflow-hidden">
            <img
              alt="MNH Logo"
              className="w-8 h-8 object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCD6nezhmZs5POhK3Vky4O660tEr-1VxPx-p4eii19B5Bna4xh5Cmfx-NY706Y3e46lIHPvt0sa2OCMdSYV3DOmOknxxYt9t62NgeasTgqrohv4JhaV5rlSfNfCDD7b6B7QI8xU2lmNIDn86cO9kYavue1I6s6bozim3_xsegFaZnIDFwCJj0CpSa-Wn94d2M-o0xw6lQbvHk0YhFJpf6CG7Hz1rhQ2Iu3kHTZRcpY6N-pkB1jH01iHrvbOgmSpL63QHs5XiqsVEQ"
            />
          </div>
          <div>
            <h2 className="font-headline-sm text-label-md font-bold text-on-surface leading-tight">
              Muhimbili National Hospital
            </h2>
            <p className="font-label-sm text-[11px] text-outline">General Ward</p>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto pt-sm">
          {WARD_NAV.map((group) => (
            <div key={group.section} className="mb-xs">
              <div className="px-md mb-xs">
                <span className="font-label-md text-[10px] uppercase text-outline tracking-wider">
                  {group.section}
                </span>
              </div>
              {group.items.map((item) => {
                const isActive = item.path === '/ward/dashboard'
                  ? location.pathname === '/ward/dashboard'
                  : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.label + item.path}
                    to={item.path}
                    className={`flex items-center gap-sm px-md py-sm mb-xs cursor-pointer no-underline hover:no-underline transition-all duration-200 ease-in-out ${
                      isActive
                        ? 'sidebar-active text-clinical-blue bg-[#DEEBFF] border-l-[3px] border-clinical-blue font-semibold'
                        : 'text-secondary hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {item.icon}
                    </span>
                    <span className="font-body-md">
                      {item.label}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-border-default p-md bg-surface-container-lowest">
          <div className="flex items-center gap-sm mb-sm">
            <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-[12px]">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="font-headline-sm text-body-md font-bold truncate">
                {nurseName}
              </p>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E3FCEF] text-[#006644]">
                Ward Nurse
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-xs py-1.5 border border-border-default rounded text-secondary hover:bg-surface-variant transition-colors bg-transparent cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span className="font-label-md">Logout</span>
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

  if ((hasRole(ROLES.cashier) || user?.role === ROLES.cashier) && !isHospitalAdmin()) {
    const displayName = user?.full_name || user?.username || 'Ali Hassan'

    const CASHIER_NAV = [
      {
        section: 'OVERVIEW',
        items: [
          { label: 'My Dashboard', path: '/billing/dashboard', icon: 'dashboard' }
        ]
      },
      {
        section: 'BILLING',
        items: [
          { label: 'Patient Bills', path: '/billing/bills', icon: 'receipt_long' }
        ]
      },
      {
        section: 'REPORTS',
        items: [
          { label: 'Daily Summary', path: '/billing/summary', icon: 'assessment' }
        ]
      }
    ]

    return (
      <aside className="hidden lg:flex flex-col h-screen w-sidebar-width bg-[#f3f3fb] border-r border-[#dfe1e6] py-md px-sm z-50 shrink-0 select-none">
        {/* Brand Header */}
        <div className="px-md mb-xl">
          <div className="flex items-center gap-md">
            <div className="w-8 h-8 bg-[#0052cc] rounded flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_hospital</span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <p className="font-label-sm text-[11px] font-semibold text-[#737685] tracking-tight truncate m-0">
                {hospitalName}
              </p>
              <p className="font-label-sm text-[9px] text-[#737685] uppercase tracking-widest mt-0.5 m-0">
                Billing
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Clusters */}
        <nav className="flex-1 space-y-lg overflow-y-auto custom-scrollbar px-sm">
          {CASHIER_NAV.map((group) => (
            <div key={group.section} className="mb-sm">
              <p className="font-label-md text-[12px] font-semibold text-[#42526e] px-md mb-sm tracking-wider m-0">
                {group.section}
              </p>
              <div className="space-y-xs">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path || (item.path === '/billing/bills' && location.pathname.startsWith('/billing/bills/'));
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-md px-md py-sm no-underline hover:no-underline transition-all rounded-lg ${
                        isActive
                          ? 'bg-[#dae2ff] text-[#001848] font-semibold'
                          : 'text-[#42526e] hover:bg-[#e8e7f0]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {item.icon}
                      </span>
                      <span className="font-body-md text-[14px]">
                        {item.label}
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Profile */}
        <div className="mt-auto border-t border-[#dfe1e6] pt-md px-sm">
          <div className="flex items-center gap-sm px-sm mb-md">
            <img
              alt={displayName}
              className="w-10 h-10 rounded-full border border-[#dfe1e6] object-cover shrink-0"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAq75rl7MHbg2uq-uWkoM3CmaFMmSp6LOgstvvApSyNb4RcORaQjngjcEl_HAA0W24-aV_P0oYcK8INNRqOe7d4CE3ZX3lCw6wHyg6TtMzB9Q3a2N4-EIMhEj8oSDQF-mH2xOjgZfHXfME6nRRRESXJhA5fT7ipkSdSkzEgz6AUGvTKmfVzjuQd3K_IcRrW0Sjdn-p0FubsBjns6gD87jjFC_Xp-v1c9mWWrnwVcfQhYgDNmToQrRs"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="overflow-hidden">
              <p className="font-body-md text-[14px] font-semibold truncate text-[#1a1b21] m-0">
                {displayName}
              </p>
              <span className="inline-block font-label-sm text-[11px] bg-[#DFE1E6] text-[#42526E] px-2 py-[2px] rounded-full font-semibold mt-0.5">
                Cashier
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-md py-sm text-[#ff5630] hover:bg-[#ffdad6] rounded-lg transition-all bg-transparent border-0 cursor-pointer"
          >
            <span className="font-body-md text-[14px] font-semibold">Logout</span>
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </aside>
    )
  }

  if ((hasRole(ROLES.radiographer) || user?.role === ROLES.radiographer) && !isHospitalAdmin()) {
    const displayName = user?.full_name || user?.username || 'User'

    const RADIOLOGY_NAV = [
      {
        section: 'Overview',
        items: [{ label: 'My Dashboard', path: '/dashboard' }],
      },
      {
        section: 'Radiology',
        items: [
          { label: 'Imaging Requests', path: '/radiology/requests' },
          { label: 'Imaging Schedule', path: '/radiology/schedule' },
        ],
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
          <span className="text-secondary font-body-sm pl-[40px]">Radiology</span>
        </div>

        <nav className="flex-1 overflow-y-auto nav-scrollbar py-sm space-y-lg">
          {RADIOLOGY_NAV.map((group) => (
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
                      isRadiologyNavItemActive(item.path, location.pathname)
                        ? 'reception-nav-link--active'
                        : ''
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {getRadiologyNavIcon(item.label)}
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
                <span className="px-1.5 py-0.5 rounded-full bg-surface-container-high text-secondary text-[10px] font-semibold">
                  Radiographer
                </span>
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

  if ((hasRole(ROLES.pharmacist) || user?.role === ROLES.pharmacist) && !isHospitalAdmin()) {
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
          <span className="text-secondary font-body-sm pl-[40px]">Pharmacy</span>
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
                        isPharmacyNavItemActive(item.path, location.pathname)
                          ? 'reception-nav-link--active'
                          : ''
                      }`
                    }
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {getPharmacyNavIcon(item.label)}
                    </span>
                    <span className="font-body-sm">{getPharmacyNavLabel(item.label)}</span>
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
              <span className="text-label-sm text-secondary">Pharmacist</span>
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

  const portalSubtitle = isSuperAdmin() ? 'Super Admin Portal' : 'Hospital Portal'
  return (
    <aside className="sidebar admin-portal-theme bg-surface-white border-r border-border-subtle flex flex-col h-screen overflow-hidden" style={{ padding: 0 }}>
      <div className="px-md py-lg flex items-center space-x-sm" style={{ padding: '24px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shrink-0" style={{ width: '40px', height: '40px', borderRadius: '9999px', backgroundColor: '#0052cc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}>
            local_hospital
          </span>
        </div>
        <div className="overflow-hidden" style={{ overflow: 'hidden' }}>
          <h1 className="font-headline-sm text-[14px] leading-tight truncate text-on-surface" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 600, lineHeight: 1.25, margin: 0, color: '#191c1e', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {isSuperAdmin() ? 'Hospital PMS' : hospitalName}
          </h1>
          <p className="font-label-sm text-outline text-[11px] leading-tight" style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 500, lineHeight: 1.25, margin: 0, color: '#737685' }}>
            {portalSubtitle}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-xs nav-scrollbar space-y-lg mt-sm" style={{ flex: 1, overflowY: 'auto', paddingLeft: '4px', paddingRight: '4px', marginTop: '8px' }}>
        {groupedNav.map((group) => {
          if (group.items.length === 0) return null
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
                              fontSize: '20px',
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
                             item.label === 'Operational Reports' ? 'analytics' :
                             item.label === 'Reception' ? 'how_to_reg' :
                             item.label === 'Register Patient' ? 'person_add' :
                             item.label === 'Patient Search' ? 'search' :
                             item.label === 'Queue' ? 'hourglass_empty' :
                             item.label === 'Queue Management' ? 'group' :
                             item.label === 'Triage' ? 'medical_services' :
                             item.label === 'Consultation' ? 'chat' :
                             item.label === 'Laboratory' ? 'biotech' :
                             item.label === 'Radiology' ? 'settings_accessibility' :
                             item.label === 'Pharmacy' ? 'medication' :
                             item.label === 'Billing' ? 'payments' :
                             item.label === 'Ward' ? 'bed' :
                             item.label === 'Notifications' ? 'notifications' : 'description'}
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
          )
        })}
      </nav>

      <div className="p-md border-t border-border-subtle bg-surface-white" style={{ padding: '16px', borderTop: '1px solid #DFE1E6', backgroundColor: '#FFFFFF' }}>
        <div className="flex items-center space-x-sm mb-md" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0 select-none" style={{ width: '40px', height: '40px', borderRadius: '9999px', backgroundColor: '#0052cc', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, userSelect: 'none' }}>
            <span className="font-headline-sm text-[14px] font-bold leading-none" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 700, lineHeight: 1 }}>
              {(user?.full_name || user?.username || 'U').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
            </span>
          </div>
          <div className="overflow-hidden" style={{ overflow: 'hidden' }}>
            <p className="font-headline-sm text-[14px] truncate" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 600, margin: 0, color: '#191c1e', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.full_name || user?.username || (isSuperAdmin() ? 'Super Admin' : 'User')}
            </p>
            <span className="inline-block px-xs py-[1px] bg-row-hover text-primary text-[10px] font-bold rounded uppercase tracking-wide" style={{ display: 'inline-block', padding: '1px 4px', backgroundColor: '#DEEBFF', color: '#0052cc', fontSize: '10px', fontWeight: 700, borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
              {isSuperAdmin() ? 'Super Administrator' : getRoleLabel(user?.role || '')}
            </span>
          </div>
        </div>
        <button
          type="button"
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
  )
}
