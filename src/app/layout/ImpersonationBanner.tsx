import { useImpersonation } from '@/hooks/useImpersonation'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { authService } from '@/api/services/auth'

export function ImpersonationBanner() {
  const { isImpersonating } = useImpersonation()
  const { user } = useAuth()

  if (!isImpersonating) return null

  const hospitalName = user?.hospital_name || 'the selected tenant'

  const stopImpersonating = async () => {
    try {
      await authService.exitImpersonation()
    } catch (err) {
      console.error('Failed to register support session exit on backend:', err)
    }
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
    window.dispatchEvent(new Event('impersonation-change'))
    window.location.href = '/master/tenants'
  }

  return (
    <div className="impersonation-banner">
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: '1.1rem' }}>warning</span>
        <span>
          <strong>Impersonation Active:</strong> Viewing <strong>{hospitalName}</strong> in read-only preview mode.
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
  )
}
