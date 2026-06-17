import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export function DeactivatedAccountPage() {
  const navigate = useNavigate()

  const handleContactSupport = () => {
    toast.success('Support ticket submitted successfully!')
  }

  const handleBackToLogin = () => {
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
          gpp_bad
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
          Access Suspended
        </h3>
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--color-text-muted)',
          lineHeight: '1.5',
          margin: 0
        }}>
          Your user profile or tenant facility access has been deactivated by the central systems administration.
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
          Organization Security Compliance:
        </span>
        All clinical dashboards, database endpoints, and active user logins for this organization have been paused.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
        <button
          onClick={handleContactSupport}
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
          Contact Support Desk
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
