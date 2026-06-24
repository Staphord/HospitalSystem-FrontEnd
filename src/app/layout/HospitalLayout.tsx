import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/app/layout/Sidebar'
import { Topbar } from '@/app/layout/Topbar'
import { ReceptionMobileNav } from '@/app/layout/ReceptionMobileNav'
import { TriageMobileNav } from '@/app/layout/TriageMobileNav'
import { ConsultationMobileNav } from '@/app/layout/ConsultationMobileNav'
import { ConsultationTopbar } from '@/app/layout/ConsultationTopbar'
import { LaboratoryTopbar } from '@/app/layout/LaboratoryTopbar'
import { LaboratoryMobileNav } from '@/app/layout/LaboratoryMobileNav'
import { ImpersonationBanner } from '@/app/layout/ImpersonationBanner'
import { AppProvider } from '@/features/admin/context/AppContext'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/lib/roles'

export function HospitalLayout() {
  const { isHospitalAdmin, hasRole } = usePermissions()
  const { user } = useAuth()
  const isAdmin = isHospitalAdmin()
  const isReceptionist = (hasRole(ROLES.receptionist) || user?.role === ROLES.receptionist) && !isAdmin
  const isTriageNurse = (hasRole(ROLES.triageNurse) || user?.role === ROLES.triageNurse) && !isAdmin
  const isDoctor = (hasRole(ROLES.doctor) || user?.role === ROLES.doctor) && !isAdmin
  const isLabTechnician =
    (hasRole(ROLES.labTechnician) || user?.role === ROLES.labTechnician) && !isAdmin
  const useModernShell = isAdmin || isReceptionist || isTriageNurse || isDoctor || isLabTechnician

  return (
    <AppProvider>
      <div className={useModernShell ? 'app-shell h-screen overflow-hidden' : 'app-shell'}>
        <ImpersonationBanner />
        <Sidebar />
        <div className="app-main">
          {isDoctor ? (
            <ConsultationTopbar />
          ) : isLabTechnician ? (
            <LaboratoryTopbar />
          ) : (
            <Topbar />
          )}
          <main
            className={
              isAdmin
                ? 'flex-1 overflow-y-auto p-lg lg:p-xl pb-24 lg:pb-xl bg-background admin-portal-theme'
                : isReceptionist || isTriageNurse || isDoctor || isLabTechnician
                  ? 'flex-1 overflow-y-auto p-4 md:p-xl bg-background pb-20 lg:pb-xl'
                  : 'page-content'
            }
          >
            <Outlet />
          </main>
        </div>
        {isReceptionist && <ReceptionMobileNav />}
        {isTriageNurse && <TriageMobileNav />}
        {isDoctor && <ConsultationMobileNav />}
        {isLabTechnician && <LaboratoryMobileNav />}
      </div>
    </AppProvider>
  )
}

