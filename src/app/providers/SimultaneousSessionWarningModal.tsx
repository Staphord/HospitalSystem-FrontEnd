import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { apiClient } from '@/api/client'
import { authService } from '@/api/services/auth'

export function SimultaneousSessionWarningModal({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { isAuthenticated, isImpersonating, clearAuth } = useAuth()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      setShowModal(false)
      return
    }

    // Impersonation tokens have no session_state claim and are not tracked
    // in the RefreshToken table. Running a session check would falsely report
    // session_revoked and force a logout.
    if (isImpersonating) {
      setShowModal(false)
      return
    }

    const runCheck = async () => {
      // 1. Check simulation mode
      const isCollision = localStorage.getItem('simulate_simultaneous_session') === 'true'
      const isAcknowledged = localStorage.getItem('session_warning_acknowledged') === 'true'

      if (isCollision) {
        if (!isAcknowledged) {
          setShowModal(true)
        } else {
          setShowModal(false)
        }
        return
      }

      // 2. Real API check
      try {
        const resp = await apiClient.get('/auth/session-check')
        if (resp.data?.session_revoked) {
          try {
            const { refreshToken } = useAuthStore.getState()
            if (refreshToken) {
              await authService.logout(refreshToken)
            }
          } catch {
            // Logout API failure is non-fatal — proceed with local cleanup
          } finally {
            clearAuth()
            navigate('/login')
            toast.error('Session terminated from another device.')
          }
          return
        }
        if (resp.data?.has_other_active) {
          if (!isAcknowledged) {
            setShowModal(true)
          } else {
            setShowModal(false)
          }
        } else {
          localStorage.removeItem('session_warning_acknowledged')
          setShowModal(false)
        }
      } catch (err) {
        // Silently catch network/auth errors for check interval
        console.warn('Failed to check simultaneous sessions', err)
      }
    }

    // Run check immediately on mount
    runCheck()

    const checkInterval = setInterval(runCheck, 5000)

    return () => clearInterval(checkInterval)
  }, [isAuthenticated, isImpersonating])

  const handleKeepThisSession = async () => {
    localStorage.removeItem('simulate_simultaneous_session')
    try {
      await apiClient.post('/auth/session-keep-only')
      localStorage.setItem('session_warning_acknowledged', 'true')
      toast.success('Other active sessions have been terminated. This session remains active.')
    } catch (err) {
      toast.error('Failed to terminate other sessions.')
    } finally {
      setShowModal(false)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('simulate_simultaneous_session')
    localStorage.removeItem('session_warning_acknowledged')
    setShowModal(false)
    clearAuth()
    navigate('/login')
    toast.info('Session ended.')
  }

  return (
    <>
      {children}

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          backdropFilter: 'blur(4px)',
          fontFamily: 'var(--font-body)'
        }}>
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '2rem',
            width: '100%',
            maxWidth: '420px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.16)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div style={{
              display: 'inline-flex',
              alignSelf: 'center',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              backgroundColor: 'var(--color-error-bg)',
              borderRadius: '50%',
              color: 'var(--color-error)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
                gpp_maybe
              </span>
            </div>

            <div>
              <h3 style={{
                fontFamily: 'var(--font-headline)',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--color-text)',
                margin: '0 0 0.5rem 0'
              }}>
                Simultaneous Session Warning
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-muted)',
                lineHeight: '1.45',
                margin: 0
              }}>
                Another active session was detected for this administrative account. For security compliance, you can only operate one active session at a time.
              </p>
            </div>

            <div style={{
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '0.75rem',
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              textAlign: 'left',
              lineHeight: '1.4'
            }}>
              Choosing <strong>Keep This Session</strong> will instantly invalidate the access token on all other active devices.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                onClick={handleSignOut}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.625rem', fontSize: '0.875rem', fontWeight: 600 }}
              >
                Sign out
              </button>
              <button
                onClick={handleKeepThisSession}
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.625rem', fontSize: '0.875rem', fontWeight: 600 }}
              >
                Keep This Session
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
