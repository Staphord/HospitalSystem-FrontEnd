import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type MfaMethod = 'authenticator' | 'sms' | 'email'

export function MfaSelectionPage() {
  const navigate = useNavigate()
  const [selectedMethod, setSelectedMethod] = useState<MfaMethod>('authenticator')

  const handleContinue = () => {
    navigate(`/mfa-verify?method=${selectedMethod}`)
  }

  const handleBack = () => {
    navigate('/login')
  }

  const methodsList = [
    {
      id: 'authenticator' as MfaMethod,
      title: 'Authenticator App',
      description: 'Use a Google Authenticator, Duo, or Authy app to generate dynamic validation codes.',
      icon: 'phonelink_setup'
    },
    {
      id: 'sms' as MfaMethod,
      title: 'Text Message (SMS)',
      description: 'Receive a temporary 6-digit passcode on your registered mobile number.',
      icon: 'sms'
    },
    {
      id: 'email' as MfaMethod,
      title: 'Email verification',
      description: 'We will send a one-time passcode to your hospital administrative email address.',
      icon: 'mail'
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '0.25rem' }}>
        <h3 style={{
          fontFamily: 'var(--font-headline)',
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--color-text)',
          margin: '0 0 0.5rem 0'
        }}>
          Two-Step Verification
        </h3>
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--color-text-muted)',
          margin: 0
        }}>
          Select a multi-factor authentication (MFA) method to secure your administrative session.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {methodsList.map((method) => {
          const isSelected = selectedMethod === method.id
          return (
            <div
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              style={{
                border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '1rem',
                cursor: 'pointer',
                display: 'flex',
                gap: '1rem',
                backgroundColor: isSelected ? 'var(--color-primary-light)' : 'var(--color-surface)',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{
                color: isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                  {method.icon}
                </span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text)'
                }}>
                  {method.title}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  lineHeight: '1.3'
                }}>
                  {method.description}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="radio"
                  name="mfa-method"
                  checked={isSelected}
                  onChange={() => setSelectedMethod(method.id)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: 'var(--color-primary)'
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button
          onClick={handleBack}
          className="btn btn-secondary"
          style={{ flex: 1, padding: '0.625rem', fontSize: '0.875rem', fontWeight: 600 }}
        >
          Cancel
        </button>
        <button
          onClick={handleContinue}
          className="btn btn-primary"
          style={{ flex: 1, padding: '0.625rem', fontSize: '0.875rem', fontWeight: 600 }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
