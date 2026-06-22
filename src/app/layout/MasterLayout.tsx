import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/app/layout/Sidebar'
import { Topbar } from '@/app/layout/Topbar'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'

export function MasterLayout() {
  const [impersonatedId, setImpersonatedId] = useState<string | null>(null)

  useEffect(() => {
    const checkImpersonation = () => {
      setImpersonatedId(localStorage.getItem('impersonated_tenant_id'))
    }

    checkImpersonation()

    // Listen to custom events or window storage changes
    window.addEventListener('storage', checkImpersonation)
    window.addEventListener('impersonation-change', checkImpersonation)

    return () => {
      window.removeEventListener('storage', checkImpersonation)
      window.removeEventListener('impersonation-change', checkImpersonation)
    }
  }, [])

  const stopImpersonating = () => {
    const originalAccess = localStorage.getItem('original_access_token')
    const originalRefresh = localStorage.getItem('original_refresh_token')
    if (originalAccess) {
      useAuthStore.getState().setTokens(originalAccess, originalRefresh || '')
      localStorage.removeItem('original_access_token')
      localStorage.removeItem('original_refresh_token')
    } else {
      useAuthStore.getState().clearAuth()
    }
    localStorage.removeItem('impersonated_tenant_id')
    setImpersonatedId(null)
    window.dispatchEvent(new Event('impersonation-change'))
    window.location.reload()
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        {impersonatedId && (
          <div className="impersonation-banner">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '1.1rem' }}>warning</span>
              <span>
                <strong>Impersonation Active:</strong> Viewing tenant space (ID: {impersonatedId}) in read-only preview mode.
              </span>
            </span>
            <button 
              onClick={stopImpersonating} 
              style={{
                backgroundColor: '#dc3545',
                color: '#ffffff',
                border: 'none',
                padding: '0.25rem 0.75rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#bd2130')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#dc3545')}
            >
              Exit Impersonation
            </button>
          </div>
        )}
        <Topbar />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
