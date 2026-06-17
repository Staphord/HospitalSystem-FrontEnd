import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export function FirstLoginChangePasswordPage() {
  const navigate = useNavigate()
  const [tempPassword, setTempPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

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
        return { label: 'Weak', color: 'var(--color-error)' }
      case 2:
        return { label: 'Fair', color: 'var(--color-warning)' }
      case 3:
        return { label: 'Good', color: 'var(--color-primary)' }
      case 4:
        return { label: 'Strong', color: 'var(--color-success)' }
      default:
        return { label: 'Too Short', color: 'var(--color-text-light)' }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('New passwords do not match.')
      return
    }

    if (strengthScore < 3) {
      toast.error('Password is too weak. Please meet at least 3 strength criteria.')
      return
    }

    setLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200))
      toast.success('Credential compliance verified. Welcome to the system!')
      navigate('/dashboard')
    } catch {
      toast.error('Failed to update credentials. Please check your temporary password.')
    } finally {
      setLoading(false)
    }
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
          Update Password
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: '1.4', margin: 0 }}>
          Define your permanent administrative credentials.
        </p>
      </div>

      {/* Policy compliance banner */}
      <div style={{
        backgroundColor: 'var(--color-warning-bg)',
        border: '1px solid var(--color-warning)',
        color: 'var(--color-warning)',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        fontSize: '0.8125rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem',
        marginBottom: '0.25rem'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>
          security
        </span>
        <div>
          <strong style={{ display: 'block', marginBottom: '0.15rem' }}>First-Time Sign-In:</strong>
          For security compliance, you must change your temporary password before proceeding.
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="temp-password" style={{ marginBottom: '0.25rem', display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Temporary Password</label>
        <input
          id="temp-password"
          className="form-control"
          type="password"
          value={tempPassword}
          onChange={(e) => setTempPassword(e.target.value)}
          required
          placeholder="Enter temp password"
        />
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
        
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {[1, 2, 3, 4].map((bar) => (
            <div
              key={bar}
              style={{
                height: '4px',
                flex: 1,
                backgroundColor: strengthScore >= bar ? color : 'var(--color-border)',
                borderRadius: '2px',
                transition: 'background-color 0.2s'
              }}
            />
          ))}
        </div>

        <ul style={{ 
          margin: '0.25rem 0 0 0', 
          paddingLeft: '1.25rem', 
          fontSize: '0.75rem', 
          color: 'var(--color-text-muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem'
        }}>
          <li style={{ color: checks.length ? 'var(--color-success)' : 'inherit' }}>Min 8 characters</li>
          <li style={{ color: checks.lowercase ? 'var(--color-success)' : 'inherit' }}>Lowercase letter (a-z)</li>
          <li style={{ color: checks.uppercase ? 'var(--color-success)' : 'inherit' }}>Uppercase letter (A-Z)</li>
          <li style={{ color: checks.special ? 'var(--color-success)' : 'inherit' }}>Number or special symbol</li>
        </ul>
      </div>

      <div className="form-group">
        <label htmlFor="confirm-password" style={{ marginBottom: '0.25rem', display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Confirm New Password</label>
        <input
          id="confirm-password"
          className="form-control"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          placeholder="Re-enter new password"
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        style={{ width: '100%', padding: '0.625rem', fontSize: '0.875rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '0.5rem' }}
        disabled={loading}
      >
        {loading ? 'Updating credentials...' : 'Establish Secure Password'}
      </button>
    </form>
  )
}
