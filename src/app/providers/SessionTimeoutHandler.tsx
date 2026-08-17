import { useEffect, useState, useRef, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { getTokenExpiryMs } from '@/lib/token'
import { authService } from '@/api/services/auth'
import { refreshAuthToken } from '@/api/client'

// Refresh the token pair once the refresh token is within this long of expiring.
const PROACTIVE_REFRESH_BUFFER_MS = 60 * 1000
const IDLE_GRACE_MS = 60 * 1000

export function SessionTimeoutHandler({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { isAuthenticated, isImpersonating, clearAuth, refreshToken } = useAuth()

  const [showModal, setShowModal] = useState(false)
  const [countdown, setCountdown] = useState(60)

  const showModalRef = useRef(false)
  const timerRef = useRef<any>(null)
  const countdownRef = useRef<any>(null)

  useEffect(() => {
    showModalRef.current = showModal
  }, [showModal])

  const getDurations = () => {
    const isTest = localStorage.getItem('test_session_timeout') === 'true'
    if (isTest) {
      return {
        warningMs: 10000,
        totalMs: 15000
      }
    }
    return {
      warningMs: 14 * 60 * 1000,
      totalMs: 15 * 60 * 1000
    }
  }

  const handleTimeout = useCallback(async () => {
    setShowModal(false)
    showModalRef.current = false
    try {
      if (refreshToken) {
        await authService.logout(refreshToken)
      }
    } catch (err) {
      console.warn('Inactivity logout API failed:', err)
    } finally {
      clearAuth('idle_timeout')
      localStorage.removeItem('hf_last_activity')
      toast.error('Session expired due to inactivity.')
      navigate('/login')
    }
  }, [refreshToken, clearAuth, navigate])

  const resetTimer = useCallback((isFromActivity = true) => {
    if (timerRef.current) clearTimeout(timerRef.current)

    const now = Date.now()
    if (isFromActivity) {
      localStorage.setItem('hf_last_activity', now.toString())
    }

    const lastActivity = parseInt(localStorage.getItem('hf_last_activity') || now.toString(), 10)
    const { warningMs, totalMs } = getDurations()
    const timeElapsed = now - lastActivity

    if (timeElapsed >= totalMs) {
      if (!showModalRef.current) {
        setShowModal(true)
        showModalRef.current = true
        setCountdown(0)
      }
      return
    }

    if (timeElapsed >= warningMs) {
      const initialCountdown = Math.max(1, Math.ceil((totalMs - timeElapsed) / 1000))
      if (!showModalRef.current) {
        setShowModal(true)
        showModalRef.current = true
      }
      setCountdown(initialCountdown)
      return
    }

    setShowModal(false)
    showModalRef.current = false
    const remainingMs = warningMs - timeElapsed
    timerRef.current = setTimeout(() => {
      const freshLastActivity = parseInt(localStorage.getItem('hf_last_activity') || Date.now().toString(), 10)
      const freshTimeElapsed = Date.now() - freshLastActivity
      const freshCountdown = Math.max(1, Math.ceil((totalMs - freshTimeElapsed) / 1000))
      setShowModal(true)
      showModalRef.current = true
      setCountdown(freshCountdown)
    }, remainingMs)
  }, [])

  useEffect(() => {
    if (!showModal) {
      if (countdownRef.current) clearInterval(countdownRef.current)
      return
    }

    countdownRef.current = setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem('hf_last_activity') || Date.now().toString(), 10)
      const { totalMs } = getDurations()
      const timeElapsed = Date.now() - lastActivity
      const currentCountdown = Math.max(0, Math.ceil((totalMs - timeElapsed) / 1000))

      setCountdown(currentCountdown)

      if (currentCountdown <= 0) {
        clearInterval(countdownRef.current!)
        handleTimeout()
      }
    }, 1000)

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [showModal, handleTimeout])

  const handleKeepAlive = async () => {
    setShowModal(false)
    showModalRef.current = false
    resetTimer(true)
    
    const result = await refreshAuthToken()
    if (result.status === 'success') {
      toast.success('Session extended.')
    } else if (result.status === 'network_failure') {
      toast.warning('Network connection issue. Session will retry automatically when connection restores.')
    } else if (result.status === 'server_failure') {
      toast.warning('Authentication server temporary issue. Session will retry automatically.')
    } else {
      clearAuth('refresh_token_expired')
      toast.error('Session could not be extended. Please sign in again.')
      navigate('/login')
    }
  }

  const handleLogout = async () => {
    setShowModal(false)
    showModalRef.current = false
    try {
      if (refreshToken) {
        await authService.logout(refreshToken)
      }
    } catch (err) {
      console.warn('Logout API failed:', err)
    } finally {
      clearAuth('manual_logout')
      localStorage.removeItem('hf_last_activity')
      navigate('/login')
    }
  }

  useEffect(() => {
    if (!isAuthenticated || isImpersonating) {
      if (timerRef.current) clearTimeout(timerRef.current)
      localStorage.removeItem('hf_last_activity')
      return
    }

    if (!localStorage.getItem('hf_last_activity')) {
      localStorage.setItem('hf_last_activity', Date.now().toString())
    }

    const handleActivity = () => {
      if (showModalRef.current) return
      resetTimer(true)
    }

    const events = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart']
    events.forEach((event) => window.addEventListener(event, handleActivity))

    resetTimer(false)

    const syncInterval = setInterval(() => {
      if (!showModalRef.current) {
        resetTimer(false)
      }
    }, 5000)

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity))
      if (timerRef.current) clearTimeout(timerRef.current)
      clearInterval(syncInterval)
    }
  }, [isAuthenticated, isImpersonating, resetTimer])

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hf_last_activity' && isAuthenticated) {
        resetTimer(false)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [isAuthenticated, resetTimer])

  // Proactive token refresh based on access token expiry
  useEffect(() => {
    if (!isAuthenticated || isImpersonating) return

    const interval = setInterval(async () => {
      const state = useAuthStore.getState()
      const accessToken = state.accessToken
      if (!accessToken) return

      const accessExpiry = state.accessTokenExpiresAt || getTokenExpiryMs(accessToken)
      if (!accessExpiry) return

      const msUntilExpiry = accessExpiry - Date.now()
      // Refresh proactive window: 30-60 seconds before access token expires
      if (msUntilExpiry <= 0 || msUntilExpiry > PROACTIVE_REFRESH_BUFFER_MS) return

      const lastActivity = parseInt(localStorage.getItem('hf_last_activity') || Date.now().toString(), 10)
      const { totalMs } = getDurations()
      if (Date.now() - lastActivity > totalMs + IDLE_GRACE_MS) return

      await refreshAuthToken()
    }, 5000)

    return () => clearInterval(interval)
  }, [isAuthenticated, isImpersonating])

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
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)',
          fontFamily: 'var(--font-body)'
        }}>
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '2rem',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
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
              backgroundColor: 'var(--color-warning-bg)',
              borderRadius: '50%',
              color: 'var(--color-warning)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
                pending_actions
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
                Inactivity Warning
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-muted)',
                lineHeight: '1.4',
                margin: 0
              }}>
                {countdown <= 0
                  ? 'Your session has expired due to inactivity. Signing you out…'
                  : <>
                      You have been inactive for a while. Your administrative session will expire in{' '}
                      <strong style={{ color: 'var(--color-error)' }}>{countdown} seconds</strong>.
                    </>
                }
              </p>
            </div>

            {countdown > 0 && (
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '0.625rem', fontSize: '0.875rem', fontWeight: 600 }}
                >
                  Sign out
                </button>
                <button
                  onClick={handleKeepAlive}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.625rem', fontSize: '0.875rem', fontWeight: 600 }}
                >
                  Keep me signed in
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
