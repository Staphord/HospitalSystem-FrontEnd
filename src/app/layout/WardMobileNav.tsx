import { NavLink, useLocation } from 'react-router-dom'

const MOBILE_NAV = [
  { path: '/ward/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/ward/beds', label: 'Beds', icon: 'bed' },
  { path: '/ward/patients', label: 'Patients', icon: 'assignment' },
] as const

export function WardMobileNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 w-full z-50 lg:hidden bg-surface-white border-t border-border-subtle shadow-lg px-4 flex justify-around items-center h-16">
      {MOBILE_NAV.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={() =>
            `reception-nav-link flex flex-col items-center justify-center px-3 py-1 rounded-xl transition-colors duration-200 ease-in-out ${
              location.pathname === item.path || (item.path !== '/ward/dashboard' && location.pathname.startsWith(item.path))
                ? 'reception-nav-link--mobile-active font-bold bg-primary-fixed/30'
                : 'text-secondary'
            }`
          }
        >
          <span className="material-symbols-outlined">{item.icon}</span>
          <span className="font-label-sm text-label-sm">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
