import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { authService } from '@/api/services/auth'
import { usersService } from '@/api/services/users'
import { useAuth } from '@/hooks/useAuth'
import { getDefaultRoute } from '@/lib/roles'
import { getRolesFromToken } from '@/lib/token'

function getApiErrorMessage(err: any): string {
  let detail = err?.response?.data?.detail
  if (typeof detail === 'string') {
    if (detail.includes('Keycloak error') && detail.includes('{')) {
      try {
        const jsonStr = detail.substring(detail.indexOf('{'))
        const parsed = JSON.parse(jsonStr)
        if (parsed.error_description) return parsed.error_description
        if (parsed.error) return parsed.error
      } catch (e) {
        // Fallback to the full detail string
      }
    }
    return detail
  }
  if (detail?.message) return detail.message
  if (err?.response?.data?.message) return err.response.data.message
  return ''
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setTokens, setUser, clearAuth } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [failedAttempts, setFailedAttempts] = useState(0)

  const isMasterLogin = location.pathname.startsWith('/master')

  useEffect(() => {
    // Check if account is already locked
    const attempts = parseInt(localStorage.getItem('login_failed_attempts') || '0', 10)
    setFailedAttempts(attempts)
    if (attempts >= 5) {
      navigate('/account-locked')
    }
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(false)
    setErrorMessage('')

    try {
      const tokens = isMasterLogin 
        ? await authService.loginSuperAdmin({ username, password })
        : await authService.login({ username, password })
      
      // Clear failed attempts upon successful login
      localStorage.removeItem('login_failed_attempts')
      setFailedAttempts(0)
      
      setTokens(tokens.access_token, tokens.refresh_token)

      let user
      try {
        user = await usersService.getMe()
      } catch (profileErr: any) {
        clearAuth()
        setError(true)
        setErrorMessage(
          getApiErrorMessage(profileErr) ||
          'Login succeeded, but your profile could not be loaded. Please contact an administrator.',
        )
        toast.error('Login succeeded, but profile loading failed.')
        return
      }

      setUser(user)
      toast.success('Welcome back!')

      // If user is logging in for the first time (simulate with a condition or flag if needed)
      // Here we will navigate to default route
      navigate(getDefaultRoute(getRolesFromToken(tokens.access_token)))
    } catch (err: any) {
      console.error('[DEBUG LOGIN ERROR] Full error:', err)
      if (err?.response) {
        console.error('[DEBUG LOGIN ERROR] Response status:', err.response.status)
        console.error('[DEBUG LOGIN ERROR] Response data:', err.response.data)
      }
      const errDataStr = JSON.stringify(err?.response?.data || '')
      const isSuspendedOrDeactivated = err?.response?.status === 403 && (
        errDataStr.includes('TENANT_SUSPENDED') ||
        errDataStr.includes('suspended') ||
        errDataStr.includes('deactivated') ||
        errDataStr.includes('disabled')
      )

      if (isSuspendedOrDeactivated) {
        toast.error('Facility access suspended or account deactivated.')
        navigate('/deactivated-account')
        return
      }

      // Handle rate limiter 429 too
      const isRateLimited = err?.response?.status === 429
      const nextAttempts = isRateLimited ? 5 : failedAttempts + 1
      
      localStorage.setItem('login_failed_attempts', nextAttempts.toString())
      setFailedAttempts(nextAttempts)
      setError(true)
      
      if (isRateLimited) {
        setErrorMessage('Too many login attempts. Account locked.')
        toast.error('Too many login attempts. Account locked.')
        navigate('/account-locked')
      } else {
        const apiMessage = getApiErrorMessage(err)
        const message = apiMessage || 'Invalid username or password. Please try again.'
        setErrorMessage(message)
        toast.error(message)
        if (nextAttempts >= 5) {
          navigate('/account-locked')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const inputErrorStyle = error ? { borderColor: 'var(--color-error)' } : {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '48px',
          height: '48px',
          backgroundColor: 'var(--color-primary-light)',
          borderRadius: '8px',
          marginBottom: '1rem',
          color: 'var(--color-primary)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
            health_and_safety
          </span>
        </div>
        <h2 style={{
          fontFamily: 'var(--font-headline)',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--color-text)',
          margin: '0 0 0.25rem 0'
        }}>
          {isMasterLogin ? 'System Access' : 'Clinical Portal Login'}
        </h2>
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--color-text-muted)',
          margin: '0 0 1.5rem 0'
        }}>
          {isMasterLogin 
            ? 'Secure login for healthcare administration' 
            : 'Secure login for hospital administration and staff'}
        </p>
      </div>

      {error && (
        <div style={{
          backgroundColor: 'var(--color-error-bg)',
          border: '1px solid var(--color-error)',
          color: 'var(--color-error)',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          fontSize: '0.8125rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.25rem'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0 }}>
            error
          </span>
          <div>
            <strong>Access Denied:</strong> {errorMessage || 'Invalid credentials.'} {5 - failedAttempts} attempts remaining before account lock.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="form-group">
          <label htmlFor="login-username" style={{ marginBottom: '0.25rem', display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Username</label>
          <input
            id="login-username"
            className="form-control"
            style={inputErrorStyle}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            placeholder="Enter username"
          />
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
            <label htmlFor="login-password" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Password</label>
            <Link to="/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              id="login-password"
              className="form-control"
              style={{ paddingRight: '2.5rem', ...inputErrorStyle }}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                fontSize: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.625rem', fontSize: '0.875rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '0.5rem' }}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
