import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export function AccountLockedPage() {
  const navigate = useNavigate()

  const handleContactAdmin = () => {
    toast.success('Support ticket submitted to system administrator!')
  }

  const handleBackToLogin = () => {
    // For testing/recovery purposes, reset attempts when clicking back to login so we can test login again
    localStorage.removeItem('login_failed_attempts')
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.25rem' }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '64px',
        height: '64px',
        backgroundColor: 'var(--color-error-bg)',
        borderRadius: '50%',
        color: 'var(--color-error)'
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>
          lock
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <h3 style={{
          fontFamily: 'var(--font-headline)',
          fontSize: '1.375rem',
          fontWeight: 700,
          color: 'var(--color-text)',
          margin: 0
        }}>
          Account Locked
        </h3>
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--color-text-muted)',
          lineHeight: '1.5',
          margin: 0
        }}>
          Your account has been locked after 5 consecutive failed login attempts to protect hospital network integrity.
        </p>
      </div>

      <div style={{
        backgroundColor: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '0.875rem 1rem',
        fontSize: '0.8125rem',
        color: 'var(--color-text-muted)',
        textAlign: 'left',
        width: '100%',
        lineHeight: '1.4'
      }}>
        <span className="font-bold" style={{ color: 'var(--color-text)', display: 'block', marginBottom: '0.25rem' }}>
          Administrative Security Protocol:
        </span>
        Locked accounts can only be unlocked by a Super Administrator through the central network control terminal.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
        <button
          onClick={handleContactAdmin}
          className="btn btn-primary"
          style={{ 
            width: '100%', 
            padding: '0.625rem', 
            fontSize: '0.875rem', 
            fontWeight: 600, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            gap: '0.5rem' 
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            support_agent
          </span>
          Contact Administrator
        </button>

        <button
          onClick={handleBackToLogin}
          className="btn btn-secondary"
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
          Back to Login
        </button>
      </div>
    </div>
  )
}
