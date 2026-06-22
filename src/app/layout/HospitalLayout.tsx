import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/app/layout/Sidebar'
import { Topbar } from '@/app/layout/Topbar'
import { ReceptionMobileNav } from '@/app/layout/ReceptionMobileNav'
import { TriageMobileNav } from '@/app/layout/TriageMobileNav'
import { ImpersonationBanner } from '@/app/layout/ImpersonationBanner'
import { AppProvider } from '@/features/admin/context/AppContext'
import { usePermissions } from '@/hooks/usePermissions'
import { ROLES } from '@/lib/roles'

export function HospitalLayout() {
  const { isHospitalAdmin, hasRole } = usePermissions()
  const isAdmin = isHospitalAdmin()
  const isReceptionist = hasRole(ROLES.receptionist) && !isAdmin
  const isTriageNurse = hasRole(ROLES.triageNurse) && !isAdmin
  const useModernShell = isAdmin || isReceptionist || isTriageNurse

  return (
    <AppProvider>
      <div className={useModernShell ? 'app-shell h-screen overflow-hidden' : 'app-shell'}>
        <ImpersonationBanner />
        <Sidebar />
        <div className="app-main">
          <Topbar />
          <main
            className={
              isAdmin
                ? 'flex-1 overflow-y-auto p-lg lg:p-xl pb-24 lg:pb-xl bg-background admin-portal-theme'
                : isReceptionist || isTriageNurse
                  ? 'flex-1 overflow-y-auto p-4 md:p-xl bg-background pb-20 lg:pb-xl'
                  : 'page-content'
            }
          >
            <Outlet />
          </main>
        </div>
        {isReceptionist && <ReceptionMobileNav />}
        {isTriageNurse && <TriageMobileNav />}
      </div>
    </AppProvider>
  )
}

