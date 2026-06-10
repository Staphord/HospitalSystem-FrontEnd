import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSubmitted(true)
      toast.success('Reset link dispatched successfully!')
    } catch {
      toast.error('Failed to submit request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>✉️</div>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Check your email</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: '1.4', margin: 0 }}>
          If the account <strong>{email}</strong> exists, we've sent password reset instructions to it.
        </p>
        <Link
          to="/login"
          className="btn btn-secondary"
          style={{ width: '100%', padding: '0.625rem', fontSize: '0.875rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '0.5rem', textDecoration: 'none' }}
        >
          Return to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Forgot password?</h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-light)', lineHeight: '1.4', margin: 0 }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="forgot-email" style={{ marginBottom: '0.25rem', display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Email Address</label>
        <input
          id="forgot-email"
          className="form-control"
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
        <Link to="/login" style={{ fontSize: '0.8125rem', color: 'var(--color-secondary)', fontWeight: 500, textDecoration: 'none' }}>
          ← Back to sign in
        </Link>
      </div>
    </form>
  )
}
