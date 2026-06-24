import { NavLink, useLocation } from 'react-router-dom'
import { isLaboratoryNavItemActive } from '@/app/layout/laboratoryNavUtils'

const MOBILE_NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/laboratory/requests', label: 'Requests', icon: 'biotech' },
  { path: '/laboratory/results', label: 'Results', icon: 'assignment' },
  { path: '/laboratory/specimens', label: 'Specimens', icon: 'inventory_2' },
] as const

export function LaboratoryMobileNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 w-full z-50 lg:hidden bg-surface-white border-t border-border-subtle shadow-lg px-2 flex justify-around items-center h-16">
      {MOBILE_NAV.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={() =>
            `reception-nav-link flex flex-col items-center justify-center px-2 py-1 rounded-xl transition-colors duration-200 ease-in-out ${
              isLaboratoryNavItemActive(item.path, location.pathname)
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
