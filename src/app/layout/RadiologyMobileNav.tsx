import { NavLink, useLocation } from 'react-router-dom'
import { isRadiologyNavItemActive } from '@/app/layout/radiologyNavUtils'

const MOBILE_NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/radiology/requests', label: 'Requests', icon: 'medical_services' },
  { path: '/radiology/schedule', label: 'Schedule', icon: 'calendar_month' },
] as const

export function RadiologyMobileNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 w-full z-50 lg:hidden bg-surface-white border-t border-border-subtle shadow-lg px-2 flex justify-around items-center h-16">
      {MOBILE_NAV.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={() =>
            `reception-nav-link flex flex-col items-center justify-center px-2 py-1 rounded-xl transition-colors duration-200 ease-in-out ${
              isRadiologyNavItemActive(item.path, location.pathname)
                ? 'reception-nav-link--mobile-active font-bold bg-primary-fixed/30'
                : 'text-secondary'
            }`
          }
        >
          <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
          <span className="font-label-sm text-[10px]">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
