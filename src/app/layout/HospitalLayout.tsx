import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
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
  const { isReadOnly } = useAuth()
  const location = useLocation()
  const isAdmin = isHospitalAdmin()
  const isReceptionist = (hasRole(ROLES.receptionist) || user?.role === ROLES.receptionist) && !isAdmin
  const isTriageNurse = (hasRole(ROLES.triageNurse) || user?.role === ROLES.triageNurse) && !isAdmin
  const isDoctor = (hasRole(ROLES.doctor) || user?.role === ROLES.doctor) && !isAdmin
  const isLabTechnician =
    (hasRole(ROLES.labTechnician) || user?.role === ROLES.labTechnician) && !isAdmin
  const useModernShell = isAdmin || isReceptionist || isTriageNurse || isDoctor || isLabTechnician

  useEffect(() => {
    if (!isReadOnly) return

    const mainEl = document.querySelector('.read-only-session')
    if (!mainEl) return

    const disableMutations = () => {
      // 1. Disable inputs, selects, textareas in forms
      mainEl.querySelectorAll('form').forEach((form) => {
        form.querySelectorAll('input, select, textarea, button').forEach((el) => {
          el.setAttribute('disabled', 'true')
          el.classList.add('cursor-not-allowed')
        })
      })

      // 2. Disable inputs, selects, textareas in Settings page
      if (window.location.pathname.includes('/settings')) {
        mainEl.querySelectorAll('input, select, textarea, button').forEach((el) => {
          el.setAttribute('disabled', 'true')
          el.classList.add('cursor-not-allowed')
        })
      }

      // 3. Disable specific mutating buttons
      mainEl.querySelectorAll('button').forEach((btn) => {
        const text = btn.textContent || ''
        const html = btn.innerHTML || ''
        const isMutation = 
          text.includes('Add') || 
          text.includes('Create') || 
          text.includes('Save') || 
          text.includes('Delete') || 
          text.includes('Deactivate') || 
          text.includes('Revoke') || 
          text.includes('Backup') || 
          text.includes('Import') || 
          text.includes('Manage') || 
          text.includes('Generate') || 
          text.includes('Run') || 
          html.includes('edit') || 
          html.includes('delete') || 
          (html.includes('refresh') === false && (html.includes('add') || html.includes('cloud_upload')))
        
        if (isMutation) {
          btn.setAttribute('disabled', 'true')
          btn.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none')
        }
      })

      // 4. Disable toggle switch buttons (FeesPage)
      mainEl.querySelectorAll('button[aria-label*="Toggle"]').forEach((t) => {
        t.setAttribute('disabled', 'true')
        t.classList.add('opacity-50', 'pointer-events-none')
      })
    }

    // Run initially
    disableMutations()

    // Setup MutationObserver to handle dynamic rendering (e.g. API fetched lists)
    const observer = new MutationObserver(() => {
      disableMutations()
    })

    observer.observe(mainEl, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
    }
  }, [location.pathname, isReadOnly])

  return (
    <AppProvider>
      <div className={useModernShell ? 'app-shell h-screen overflow-hidden' : 'app-shell'}>
        <Sidebar />
        <div className="app-main">
          {isDoctor ? (
            <ConsultationTopbar />
          ) : isLabTechnician ? (
            <LaboratoryTopbar />
          ) : (
            <Topbar />
          )}
          <ImpersonationBanner />
          <Topbar />
          <main
            className={
              (isAdmin
                ? 'flex-1 overflow-y-auto p-lg lg:p-xl pb-24 lg:pb-xl bg-background admin-portal-theme'
                : isReceptionist || isTriageNurse || isDoctor || isLabTechnician
                  ? 'flex-1 overflow-y-auto p-4 md:p-xl bg-background pb-20 lg:pb-xl'
                  : 'page-content') + (isReadOnly ? ' read-only-session' : '')
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

