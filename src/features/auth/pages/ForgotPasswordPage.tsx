import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { authService } from '@/api/services/auth'

function getApiErrorMessage(err: any): string {
  const detail = err?.response?.data?.detail
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

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [cooldown, setCooldown] = useState(60)
  const [error, setError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let interval: any
    if (submitted && cooldown > 0) {
      interval = setInterval(() => {
        setCooldown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [submitted, cooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(false)
    setErrorMessage('')

    try {
      await authService.requestPasswordReset({ email })
      setSubmitted(true)
      setCooldown(60)
      toast.success('Reset link dispatched successfully!')
    } catch (err: any) {
      const errorMsg = getApiErrorMessage(err) || 'Failed to submit request. Please try again.'
      setError(true)
      setErrorMessage(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    setLoading(true)
    setError(false)
    setErrorMessage('')
    try {
      await authService.requestPasswordReset({ email })
      setCooldown(60)
      toast.success('A new password reset link has been sent!')
    } catch (err: any) {
      const errorMsg = getApiErrorMessage(err) || 'Failed to resend. Please try again.'
      setError(true)
      setErrorMessage(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }


  if (submitted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center', alignItems: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '56px',
          height: '56px',
          backgroundColor: 'var(--color-primary-light)',
          borderRadius: '50%',
          color: 'var(--color-primary)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '30px' }}>
            mail
          </span>
        </div>
        <h3 style={{
          fontFamily: 'var(--font-headline)',
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--color-text)',
          margin: 0
        }}>
          Check your email
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: '1.4', margin: 0 }}>
          If the account <strong>{email}</strong> exists, we've sent password reset instructions to it.
        </p>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || loading}
            className="btn btn-primary"
            style={{ 
              width: '100%', 
              padding: '0.625rem', 
              fontSize: '0.875rem', 
              fontWeight: 600, 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center' 
            }}
          >
            {cooldown > 0 ? `Resend Link in ${cooldown}s` : 'Resend Reset Link'}
          </button>

          <Link
            to="/login"
            className="btn btn-secondary"
            style={{ 
              width: '100%', 
              padding: '0.625rem', 
              fontSize: '0.875rem', 
              fontWeight: 600, 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              textDecoration: 'none',
              color: 'var(--color-secondary)'
            }}
          >
            Return to sign in
          </Link>
        </div>
      </div>
    )
  }

  const inputErrorStyle = error ? { borderColor: 'var(--color-error)' } : {}

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '0.25rem' }}>
        <h3 style={{
          fontFamily: 'var(--font-headline)',
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--color-text)',
          margin: '0 0 0.5rem 0'
        }}>
          Forgot password?
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: '1.4', margin: 0 }}>
          Enter your email address and we'll send you a link to reset your password.
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
          marginBottom: '0.25rem'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', flexShrink: 0 }}>
            error
          </span>
          <div>
            <strong>Error:</strong> {errorMessage}
          </div>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="forgot-email" style={{ marginBottom: '0.25rem', display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Email Address</label>
        <input
          id="forgot-email"
          className="form-control"
          style={inputErrorStyle}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="name@hospital.com"
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        style={{ width: '100%', padding: '0.625rem', fontSize: '0.875rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '0.5rem' }}
        disabled={loading}
      >
        {loading ? 'Submitting...' : 'Send reset link'}
      </button>

      <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
        <Link 
          to="/login" 
          style={{ 
            fontSize: '0.8125rem', 
            color: 'var(--color-secondary)', 
            fontWeight: 500, 
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            arrow_back
          </span>
          Back to sign in
        </Link>
      </div>
    </form>
  )
}
