import { NavLink, useLocation } from 'react-router-dom'
import { isTriageNavItemActive } from '@/app/layout/triageNavUtils'

const MOBILE_NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/triage/queue', label: 'Queue', icon: 'queue' },
  { path: '/triage/history', label: 'History', icon: 'history' },
] as const

export function TriageMobileNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 w-full z-50 lg:hidden bg-surface-white border-t border-border-subtle shadow-lg px-4 flex justify-around items-center h-16">
      {MOBILE_NAV.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={() =>
            `reception-nav-link flex flex-col items-center justify-center px-3 py-1 rounded-xl transition-colors duration-200 ease-in-out ${
              isTriageNavItemActive(item.path, location.pathname)
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
