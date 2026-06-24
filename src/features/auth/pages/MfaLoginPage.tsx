import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { authService } from '@/api/services/auth'
import { usersService } from '@/api/services/users'
import { useAuth } from '@/hooks/useAuth'
import { getDefaultRoute } from '@/lib/roles'
import { getRolesFromToken } from '@/lib/token'

const CHALLENGE_STORAGE_KEY = 'mfa_login_challenge'

export function MfaLoginPage() {
  const navigate = useNavigate()
  const { setTokens, setUser, clearAuth } = useAuth()

  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const [mfaMode, setMfaMode] = useState<'authenticator' | 'email' | 'backup'>('authenticator')
  const [backupCode, setBackupCode] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [emailSending, setEmailSending] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const challenge = sessionStorage.getItem(CHALLENGE_STORAGE_KEY)

    if (!challenge) {
      navigate('/login', { replace: true })
      return
    }

    inputRefs.current[0]?.focus()
  }, [navigate])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const nextDigits = [...digits]
    nextDigits[index] = value.slice(-1)

    setDigits(nextDigits)
    setError(false)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key !== 'Backspace') return

    if (!digits[index] && index > 0) {
      const nextDigits = [...digits]
      nextDigits[index - 1] = ''

      setDigits(nextDigits)
      inputRefs.current[index - 1]?.focus()
      return
    }

    const nextDigits = [...digits]
    nextDigits[index] = ''
    setDigits(nextDigits)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()

    const pasted = e.clipboardData
      .getData('text')
      .trim()
      .slice(0, 6)

    if (!/^\d+$/.test(pasted)) return

    const nextDigits = Array(6).fill('')

    for (let i = 0; i < pasted.length; i += 1) {
      nextDigits[i] = pasted[i]
    }

    setDigits(nextDigits)
    setError(false)

    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const challengeToken = sessionStorage.getItem(CHALLENGE_STORAGE_KEY)

    if (!challengeToken) {
      navigate('/login', { replace: true })
      return
    }

    const code = mfaMode === 'backup'
      ? backupCode.trim()
      : digits.join('')

    if (mfaMode !== 'backup' && code.length !== 6) {
      setError(true)
      toast.error(
        mfaMode === 'email'
          ? 'Enter the 6-digit email verification code.'
          : 'Enter the 6-digit authenticator code.'
      )
      return
    }

    if (mfaMode === 'backup' && !code) {
      setError(true)
      toast.error('Enter your backup recovery code.')
      return
    }

    setLoading(true)
    setError(false)

    try {
      const tokens = await authService.verifyMfaLogin({
        challenge_token: challengeToken,
        totp_code: code,
      })

      sessionStorage.removeItem(CHALLENGE_STORAGE_KEY)

      setTokens(tokens.access_token, tokens.refresh_token)

      const user = await usersService.getMe()
      setUser(user)

      toast.success('Welcome back!')

      navigate(
        getDefaultRoute(getRolesFromToken(tokens.access_token), user?.role),
        { replace: true }
      )
    } catch {
      clearAuth()

      setError(true)
      setDigits(Array(6).fill(''))
      setBackupCode('')

      inputRefs.current[0]?.focus()

      toast.error('Invalid or expired verification code.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    sessionStorage.removeItem(CHALLENGE_STORAGE_KEY)
    clearAuth()
    navigate('/login')
  }

  const handleSendEmailCode = async () => {
    const challengeToken = sessionStorage.getItem(CHALLENGE_STORAGE_KEY)
    if (!challengeToken) {
      navigate('/login', { replace: true })
      return
    }

    setEmailSending(true)
    try {
      await authService.sendMfaEmailLoginCode(challengeToken)
      setEmailSent(true)
      toast.success('MFA verification code sent to your email.')
    } catch {
      toast.error('Failed to send verification code. Please try again.')
    } finally {
      setEmailSending(false)
    }
  }

  const handleSwitchToEmail = () => {
    setMfaMode('email')
    setError(false)
    setDigits(Array(6).fill(''))
    setBackupCode('')

    const challengeToken = sessionStorage.getItem(CHALLENGE_STORAGE_KEY)
    if (challengeToken && !emailSent) {
      setEmailSending(true)
      authService.sendMfaEmailLoginCode(challengeToken)
        .then(() => {
          setEmailSent(true)
          toast.success('MFA verification code sent to your email.')
        })
        .catch(() => {
          toast.error('Failed to send verification code.')
        })
        .finally(() => {
          setEmailSending(false)
        })
    }
  }

  const digitErrorStyle = error
    ? { borderColor: 'var(--color-error)' }
    : {}

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          marginBottom: '0.25rem',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            backgroundColor: 'var(--color-primary-light)',
            borderRadius: '8px',
            marginBottom: '1rem',
            color: 'var(--color-primary)',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '28px' }}
          >
            shield_locked
          </span>
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-headline)',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--color-text)',
            margin: '0 0 0.5rem 0',
          }}
        >
          Two-Step Verification
        </h2>

        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          {mfaMode === 'backup'
            ? 'Enter one of your backup recovery codes.'
            : mfaMode === 'email'
            ? 'Enter the 6-digit code sent to your registered email address.'
            : 'Enter the 6-digit code from your authenticator app.'}
        </p>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: 'var(--color-error-bg)',
            border: '1px solid var(--color-error)',
            color: 'var(--color-error)',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: '18px',
              flexShrink: 0,
            }}
          >
            error
          </span>

          <div>
            <strong>Verification failed:</strong>{' '}
            Check your code and try again.
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        {mfaMode !== 'backup' ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={digit}
                onChange={(e) =>
                  handleChange(index, e.target.value)
                }
                onKeyDown={(e) =>
                  handleKeyDown(index, e)
                }
                onPaste={
                  index === 0 ? handlePaste : undefined
                }
                maxLength={1}
                required
                style={{
                  width: '44px',
                  height: '48px',
                  textAlign: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  outline: 'none',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  ...digitErrorStyle,
                }}
              />
            ))}
          </div>
        ) : (
          <input
            type="text"
            placeholder="Enter backup recovery code"
            value={backupCode}
            onChange={(e) => {
              setBackupCode(e.target.value)
              setError(false)
            }}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: error
                ? '1px solid var(--color-error)'
                : '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
            }}
          />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
          {mfaMode !== 'authenticator' && (
            <button
              type="button"
              onClick={() => {
                setMfaMode('authenticator')
                setError(false)
                setDigits(Array(6).fill(''))
                setBackupCode('')
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              Use authenticator app instead
            </button>
          )}

          {mfaMode !== 'email' && (
            <button
              type="button"
              onClick={handleSwitchToEmail}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              Email me a verification code instead
            </button>
          )}

          {mfaMode === 'email' && (
            <button
              type="button"
              onClick={handleSendEmailCode}
              disabled={emailSending}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                opacity: emailSending ? 0.6 : 1,
              }}
            >
              {emailSending ? 'Sending...' : 'Resend email code'}
            </button>
          )}

          {mfaMode !== 'backup' && (
            <button
              type="button"
              onClick={() => {
                setMfaMode('backup')
                setError(false)
                setDigits(Array(6).fill(''))
                setBackupCode('')
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              Use a backup recovery code
            </button>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.625rem',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            {loading
              ? 'Verifying...'
              : 'Verify and sign in'}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.625rem',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            Back to login
          </button>
        </div>
      </form>
    </div>
  )
}