import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { authService } from '@/api/services/auth'
import { useAuthStore } from '@/store/authStore'

export function ImpersonationSwitchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const didStartRef = useRef(false)

  useEffect(() => {
    if (didStartRef.current) return
    didStartRef.current = true

    const tenantId = searchParams.get('tenant_id')
    const returnTo = searchParams.get('return_to') || '/admin/dashboard'

    if (!tenantId) {
      toast.error('Missing tenant information for impersonation.')
      navigate('/master/tenants', { replace: true })
      return
    }

    const startImpersonation = async () => {
      try {
        const currentAccess = useAuthStore.getState().accessToken
        const currentRefresh = useAuthStore.getState().refreshToken

        if (currentAccess) {
          localStorage.setItem('original_access_token', currentAccess)
        }
        if (currentRefresh) {
          localStorage.setItem('original_refresh_token', currentRefresh)
        }

        const res = await authService.impersonate({ target_tenant_id: tenantId })

        localStorage.setItem('impersonated_tenant_id', tenantId)
        useAuthStore.getState().setTokens(res.access_token, '')
        window.dispatchEvent(new Event('impersonation-change'))
        navigate(returnTo, { replace: true })
      } catch (err) {
        console.error('Failed to start impersonation mode', err)
        toast.error('Failed to start impersonation mode.')
        navigate('/master/tenants', { replace: true })
      }
    }

    void startImpersonation()
  }, [navigate, searchParams])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#ffffff',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 1rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(26, 82, 118, 0.1)',
            color: 'var(--color-primary)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '30px' }}>
            sync
          </span>
        </div>
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
          Switching to tenant preview
        </h1>
        <p style={{ margin: 0, color: 'var(--color-text-light)', fontSize: '0.95rem', lineHeight: 1.5 }}>
          Preparing a secure read-only session for this hospital account.
        </p>
      </div>
    </div>
  )
}
