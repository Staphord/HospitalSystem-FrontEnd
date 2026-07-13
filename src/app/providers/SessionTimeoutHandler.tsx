import { useEffect, useState, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { isTokenExpired } from '@/lib/token'
import { authService } from '@/api/services/auth'

export function SessionTimeoutHandler({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { isAuthenticated, isImpersonating, clearAuth, refreshToken } = useAuth()
  
  const [showModal, setShowModal] = useState(false)
  const [countdown, setCountdown] = useState(60)
  
  const timerRef = useRef<any>(null)
  const countdownRef = useRef<any>(null)

  // Configurations (Default: 14 mins warning, 15 mins total. Test mode: 10s warning, 15s total)
  const getDurations = () => {
    const isTest = localStorage.getItem('test_session_timeout') === 'true'
    if (isTest) {
      return {
        warningMs: 10000, // 10 seconds
        totalMs: 15000    // 15 seconds
      }
    }
    return {
      warningMs: 14 * 60 * 1000, // 14 minutes
      totalMs: 15 * 60 * 1000    // 15 minutes
    }
  }

  const resetTimer = (isFromActivity = true) => {
    if (timerRef.current) clearTimeout(timerRef.current)

    const now = Date.now()
    if (isFromActivity) {
      localStorage.setItem('hf_last_activity', now.toString())
    }

    const lastActivity = parseInt(localStorage.getItem('hf_last_activity') || '0', 10)
    const { warningMs, totalMs } = getDurations()
    const timeElapsed = now - lastActivity

    if (timeElapsed >= totalMs) {
      handleTimeout()
      return
    }

    if (timeElapsed >= warningMs) {
      // Calculate remaining countdown seconds
      const initialCountdown = Math.max(1, Math.ceil((totalMs - timeElapsed) / 1000))
      setShowModal(true)
      setCountdown(initialCountdown)
      return
    }

    setShowModal(false)
    const remainingMs = warningMs - timeElapsed
    timerRef.current = setTimeout(() => {
      setShowModal(true)
      const freshLastActivity = parseInt(localStorage.getItem('hf_last_activity') || '0', 10)
      const freshTimeElapsed = Date.now() - freshLastActivity
      const freshCountdown = Math.max(1, Math.ceil((totalMs - freshTimeElapsed) / 1000))
      setCountdown(freshCountdown)
    }, remainingMs)
  }

  // Handle countdown when modal is visible
  useEffect(() => {
    if (!showModal) {
      if (countdownRef.current) clearInterval(countdownRef.current)
      return
    }

    countdownRef.current = setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem('hf_last_activity') || '0', 10)
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
  }, [showModal])

  const handleTimeout = async () => {
    setShowModal(false)
    try {
      if (refreshToken) {
        await authService.logout(refreshToken)
      }
    } catch (err) {
      console.warn('Inactivity logout API failed:', err)
    } finally {
      clearAuth()
      localStorage.removeItem('hf_last_activity')
      toast.error('Session expired due to inactivity.')
      navigate('/login')
    }
  }

  const handleKeepAlive = () => {
    setShowModal(false)
    resetTimer(true)
    toast.success('Session extended.')
  }

  const handleLogout = async () => {
    setShowModal(false)
    try {
      if (refreshToken) {
        await authService.logout(refreshToken)
      }
    } catch (err) {
      console.warn('Logout API failed:', err)
    } finally {
      clearAuth()
      localStorage.removeItem('hf_last_activity')
      navigate('/login')
    }
  }

  const handleActivity = () => {
    // Mouse movement or keys shouldn't reset time when the warning modal is active
    if (showModal) return
    resetTimer(true)
  }

  // Set up event listeners for tracking activity
  useEffect(() => {
    if (!isAuthenticated || isImpersonating) {
      if (timerRef.current) clearTimeout(timerRef.current)
      localStorage.removeItem('hf_last_activity')
      return
    }

    if (!localStorage.getItem('hf_last_activity')) {
      localStorage.setItem('hf_last_activity', Date.now().toString())
    }

    const events = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart']
    const handler = () => handleActivity()

    events.forEach((event) => {
      window.addEventListener(event, handler)
    })

    // Initial setup (run checks without forcing update of last activity)
    resetTimer(false)

    // Check periodically in case tab is in background
    const syncInterval = setInterval(() => {
      if (!showModal) {
        resetTimer(false)
      }
    }, 5000)

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handler)
      })
      if (timerRef.current) clearTimeout(timerRef.current)
      clearInterval(syncInterval)
    }
  }, [isAuthenticated, isImpersonating, showModal])

  // Synchronize inactivity timer across browser tabs via storage events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hf_last_activity' && isAuthenticated) {
        resetTimer(false)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [isAuthenticated])

  // Synchronize inactivity session warning with token expiration
  useEffect(() => {
    if (!isAuthenticated || isImpersonating) return

    // Every 5 seconds, check if the refresh token is expired
    const interval = setInterval(() => {
      const token = useAuthStore.getState().refreshToken
      if (token && isTokenExpired(token)) {
        handleTimeout()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [isAuthenticated])

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
                You have been inactive for a while. Your administrative session will expire in{' '}
                <strong style={{ color: 'var(--color-error)' }}>{countdown} seconds</strong>.
              </p>
            </div>

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
          </div>
        </div>
      )}
    </>
  )
}
