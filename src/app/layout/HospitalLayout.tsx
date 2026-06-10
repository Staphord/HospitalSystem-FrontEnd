import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/app/layout/Sidebar'
import { Topbar } from '@/app/layout/Topbar'
import { ImpersonationBanner } from '@/app/layout/ImpersonationBanner'

export function HospitalLayout() {
  return (
    <div className="app-shell">
      <ImpersonationBanner />
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
