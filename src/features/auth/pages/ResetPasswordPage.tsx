import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { authService } from '@/api/services/auth'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isExpired, setIsExpired] = useState(false)

  // Password Strength States
  const [strengthScore, setStrengthScore] = useState(0)
  const [checks, setChecks] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    special: false
  })

  useEffect(() => {
    const newChecks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      special: /[0-9!@#$%^&*(),.?":{}|<>]/.test(password)
    }
    setChecks(newChecks)

    // Calculate score
    let score = 0
    if (newChecks.length) score++
    if (newChecks.lowercase) score++
    if (newChecks.uppercase) score++
    if (newChecks.special) score++
    setStrengthScore(score)
  }, [password])

  const getStrengthLabel = () => {
    switch (strengthScore) {
      case 1:
        return { label: 'Weak Password', color: 'var(--color-error)' }
      case 2:
        return { label: 'Fair Password', color: 'var(--color-warning)' }
      case 3:
        return { label: 'Good Password', color: 'var(--color-primary)' }
      case 4:
        return { label: 'Strong Password', color: 'var(--color-success)' }
      default:
        return { label: 'Password Security Check', color: 'var(--color-text-light)' }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    if (strengthScore < 3) {
      toast.error('Password is too weak. Please meet at least 3 strength criteria.')
      return
    }

    setLoading(true)

    try {
      await authService.confirmPasswordReset({ token, new_password: password })
      setSubmitted(true)
      toast.success('Your new password has been established successfully.')
    } catch {
      setIsExpired(true)
      toast.error('Failed to reset password. Link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  if (isExpired) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center', alignItems: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '56px',
          height: '56px',
          backgroundColor: 'var(--color-error-bg)',
          borderRadius: '50%',
          color: 'var(--color-error)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '30px' }}>
            link_off
          </span>
        </div>
        <h3 style={{
          fontFamily: 'var(--font-headline)',
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--color-text)',
          margin: 0
        }}>
          Reset Link Expired
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: '1.4', margin: 0 }}>
          This password reset link is invalid or has expired. Please request a new link.
        </p>
        <Link
          to="/forgot-password"
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.625rem', fontSize: '0.875rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '0.5rem', textDecoration: 'none' }}
        >
          Request new link
        </Link>
      </div>
    )
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
          backgroundColor: 'var(--color-success-bg)',
          borderRadius: '50%',
          color: 'var(--color-success)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '30px' }}>
            check_circle
          </span>
        </div>
        <h3 style={{
          fontFamily: 'var(--font-headline)',
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--color-text)',
          margin: 0
        }}>
          Password Updated
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: '1.4', margin: 0 }}>
          Your security credentials have been updated. You can now access the system using your new password.
        </p>
        <Link
          to="/login"
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.625rem', fontSize: '0.875rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '0.5rem', textDecoration: 'none' }}
        >
          Sign in
        </Link>
      </div>
    )
  }

  const { label, color } = getStrengthLabel()

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
          Set a new password
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: '1.4', margin: 0 }}>
          Choose a secure password containing numbers and uppercase letters.
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="new-password" style={{ marginBottom: '0.25rem', display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>New Password</label>
        <div style={{ position: 'relative' }}>
          <input
            id="new-password"
            className="form-control"
            style={{ paddingRight: '2.5rem' }}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Min 8 characters"
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

      {/* Strength Indicator */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>Strength:</span>
          <span style={{ color, fontWeight: 600 }}>{label}</span>
        </div>
        
        {/* 4-bar indicator */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {[1, 2, 3, 4].map((bar) => {
            const isActive = strengthScore >= bar
            return (
              <div
                key={bar}
                style={{
                  height: '4px',
                  flex: 1,
                  backgroundColor: isActive ? color : 'var(--color-border)',
                  borderRadius: '2px',
                  transition: 'background-color 0.2s'
                }}
              />
            )
          })}
        </div>

        {/* Bullet criteria */}
        <ul style={{ 
          margin: '0.25rem 0 0 0', 
          paddingLeft: '1.25rem', 
          fontSize: '0.75rem', 
          color: 'var(--color-text-muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem'
        }}>
          <li style={{ color: checks.length ? 'var(--color-success)' : 'inherit' }}>
            At least 8 characters
          </li>
          <li style={{ color: checks.lowercase ? 'var(--color-success)' : 'inherit' }}>
            Contains lowercase letters (a-z)
          </li>
          <li style={{ color: checks.uppercase ? 'var(--color-success)' : 'inherit' }}>
            Contains uppercase letters (A-Z)
          </li>
          <li style={{ color: checks.special ? 'var(--color-success)' : 'inherit' }}>
            Contains number or special character
          </li>
        </ul>
      </div>

      <div className="form-group">
        <label htmlFor="confirm-password" style={{ marginBottom: '0.25rem', display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Confirm Password</label>
        <input
          id="confirm-password"
          className="form-control"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          placeholder="Re-enter password"
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        style={{ width: '100%', padding: '0.625rem', fontSize: '0.875rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '0.5rem' }}
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Confirm Reset Password'}
      </button>
    </form>
  )
}
