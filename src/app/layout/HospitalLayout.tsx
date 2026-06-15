import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/app/layout/Sidebar'
import { Topbar } from '@/app/layout/Topbar'
import { ImpersonationBanner } from '@/app/layout/ImpersonationBanner'
import { AppProvider } from '@/features/admin/context/AppContext'
import { usePermissions } from '@/hooks/usePermissions'

export function HospitalLayout() {
  const { isHospitalAdmin } = usePermissions()
  const isAdmin = isHospitalAdmin()

  return (
    <AppProvider>
      <div className={isAdmin ? "app-shell h-screen overflow-hidden" : "app-shell"}>
        <ImpersonationBanner />
        <Sidebar />
        <div className="app-main">
          <Topbar />
          <main className={isAdmin ? "flex-1 overflow-y-auto p-lg lg:p-xl pb-24 lg:pb-xl bg-background admin-portal-theme" : "page-content"}>
            <Outlet />
          </main>
        </div>
      </div>
    </AppProvider>
  )
}

