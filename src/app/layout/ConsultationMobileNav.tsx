import { NavLink, useLocation } from 'react-router-dom'
import { isConsultationNavItemActive } from '@/app/layout/consultationNavUtils'

const MOBILE_NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/consultation/queue', label: 'Queue', icon: 'group' },
  { path: '/consultation/results', label: 'Results', icon: 'lab_research' },
  { path: '/consultation/history', label: 'History', icon: 'history' },
  { path: '/consultation/referrals', label: 'Referrals', icon: 'sync_alt' },
] as const

export function ConsultationMobileNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 w-full z-50 lg:hidden bg-surface-white border-t border-border-subtle shadow-lg px-2 flex justify-around items-center h-16">
      {MOBILE_NAV.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={() =>
            `reception-nav-link flex flex-col items-center justify-center px-2 py-1 rounded-xl transition-colors duration-200 ease-in-out ${
              isConsultationNavItemActive(item.path, location.pathname)
                ? 'reception-nav-link--mobile-active font-bold bg-primary-fixed/30'
                : 'text-secondary'
            }`
          }
        >
          <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
          <span className="font-label-sm text-label-sm">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
