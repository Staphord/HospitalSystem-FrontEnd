import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { usersService, type UserUpdatePayload, type PasswordChangePayload } from '@/api/services/users'
import { authService } from '@/api/services/auth'
import { useAuth } from '@/hooks/useAuth'

export function ProfilePage() {
  const { user, setUser } = useAuth()
  
  // Basic Info Form
  const { register: registerInfo, handleSubmit: handleInfoSubmit, formState: { errors: infoErrors }, reset } = useForm<UserUpdatePayload>()
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false)

  // Password Form
  const { register: registerPwd, handleSubmit: handlePwdSubmit, formState: { errors: pwdErrors }, reset: resetPwd, watch } = useForm<PasswordChangePayload & { confirm_password?: string }>()
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false)
  const newPwd = watch('new_password')

  // Tab State
  const [activeTab, setActiveTab] = useState<'info' | 'password' | 'mfa'>('info')

  // MFA Flow States
  const [mfaStep, setMfaStep] = useState<'idle' | 'verify' | 'backup_codes'>('idle')
  const [selectedMethod, setSelectedMethod] = useState<'authenticator' | 'email'>('authenticator')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [timer, setTimer] = useState(30)
  const [timerExpired, setTimerExpired] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [confirmDisable, setConfirmDisable] = useState(false)
  const [isDisablingMfa, setIsDisablingMfa] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Load / Refresh Profile info on mount
  const refreshProfile = async () => {
    try {
      const data = await usersService.getMe()
      setUser(data)
    } catch (err) {
      // Failed to load silently
    }
  }

  useEffect(() => {
    refreshProfile()
  }, [])

  useEffect(() => {
    if (user) {
      reset({
        username: user.username,
        email: user.email,
        full_name: user.full_name || '',
      })
    }
  }, [user, reset])

  // Timer for setup verification
  useEffect(() => {
    if (mfaStep !== 'verify' || selectedMethod !== 'email') return
    if (timer <= 0) {
      setTimerExpired(true)
      return
    }
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [mfaStep, selectedMethod, timer])

  const onInfoSubmit = async (data: UserUpdatePayload) => {
    setIsUpdatingInfo(true)
    try {
      await usersService.updateMe(data)
      if (user) {
        setUser({ ...user, ...data })
      }
      toast.success('Profile information updated successfully')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update profile information')
    } finally {
      setIsUpdatingInfo(false)
    }
  }

  const onPwdSubmit = async (data: PasswordChangePayload & { confirm_password?: string }) => {
    setIsUpdatingPwd(true)
    try {
      await usersService.changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      })
      toast.success('Password changed successfully')
      resetPwd()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to change password')
    } finally {
      setIsUpdatingPwd(false)
    }
  }

  // MFA Action Handlers
  const handleStartMfaSetup = async () => {
    setLoading(true)
    setDigits(Array(6).fill(''))
    setError(false)
    try {
      if (selectedMethod === 'authenticator') {
        const data = await authService.setupMfa()
        setQrCode(data.qr_code_url)
        setSecret(data.secret)
        setMfaStep('verify')
      } else {
        await authService.sendMfaEmailSetupCode()
        setTimer(30)
        setTimerExpired(false)
        setMfaStep('verify')
        toast.success('Verification code sent to your email.')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to initialize MFA setup.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendEmailCode = async () => {
    setTimer(30)
    setTimerExpired(false)
    setDigits(Array(6).fill(''))
    setError(false)
    try {
      await authService.sendMfaEmailSetupCode()
      toast.success('A new verification code was sent to your email.')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to send verification code.')
    }
  }

  const handleVerifyMfa = async () => {
    const code = digits.join('')
    if (code.length < 6) {
      setError(true)
      toast.error('Please enter all 6 digits.')
      return
    }

    if (selectedMethod === 'email' && timerExpired) {
      setError(true)
      toast.error('Verification code has expired. Please resend code.')
      return
    }

    setLoading(true)
    setError(false)
    try {
      const res = await authService.verifyMfa(code)
      toast.success('Two-factor verification successful!')
      if (res && res.backup_codes && res.backup_codes.length > 0) {
        setBackupCodes(res.backup_codes)
        setMfaStep('backup_codes')
      } else {
        await refreshProfile()
        setMfaStep('idle')
      }
    } catch (err: any) {
      setError(true)
      toast.error(err.response?.data?.detail || 'Invalid verification code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDisableMfa = async () => {
    setIsDisablingMfa(true)
    try {
      await authService.disableMfa()
      toast.success('Two-factor authentication disabled successfully.')
      setConfirmDisable(false)
      await refreshProfile()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to disable MFA.')
    } finally {
      setIsDisablingMfa(false)
    }
  }

  const handleCompleteMfaSetup = async () => {
    await refreshProfile()
    setMfaStep('idle')
    setBackupCodes([])
  }

  const downloadBackupCodes = () => {
    const element = document.createElement("a");
    const file = new Blob([
      "HOSPITALFLOW MFA RECOVERY BACKUP CODES\n",
      "Keep these codes in a safe place. Each code can only be used once.\n\n",
      backupCodes.join("\n"),
      "\n\nGenerated on: " + new Date().toLocaleString()
    ], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "hospitalflow-mfa-backup-codes.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Backup codes file downloaded!');
  }

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'))
    toast.success('Backup codes copied to clipboard!')
  }

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newDigits = [...digits]
    newDigits[index] = value.slice(-1)
    setDigits(newDigits)
    setError(false)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits]
        newDigits[index - 1] = ''
        setDigits(newDigits)
        inputRefs.current[index - 1]?.focus()
      } else {
        const newDigits = [...digits]
        newDigits[index] = ''
        setDigits(newDigits)
      }
    }
  }

  const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim().slice(0, 6)
    if (!/^\d+$/.test(pastedData)) return
    const newDigits = [...digits]
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i]
    }
    setDigits(newDigits)
    setError(false)
    const focusIndex = Math.min(pastedData.length, 5)
    inputRefs.current[focusIndex]?.focus()
  }

  // Initials for avatar
  const getInitials = () => {
    if (!user) return '?'
    if (user.full_name) {
      const parts = user.full_name.split(' ')
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
      return parts[0][0].toUpperCase()
    }
    return user.username ? user.username[0].toUpperCase() : 'U'
  }

  return (
    <div className="page-content">
      <style>{`
        .profile-container {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 2rem;
          align-items: start;
          margin-top: 1rem;
        }
        
        @media (max-width: 991px) {
          .profile-container {
            grid-template-columns: 1fr;
          }
        }

        .avatar-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 2.5rem 1.5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
        }

        .profile-avatar-large {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-primary) 0%, #3b82f6 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.75rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          box-shadow: 0 10px 25px rgba(0, 82, 204, 0.2);
          border: 4px solid var(--color-surface);
        }

        .profile-name-title {
          font-family: var(--font-headline);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-text);
          margin: 0 0 0.25rem 0;
        }

        .profile-email-subtitle {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          margin-bottom: 1.5rem;
          word-break: break-all;
        }

        .profile-meta-list {
          width: 100%;
          border-top: 1px solid var(--color-border);
          padding-top: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          text-align: left;
        }

        .profile-meta-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.8125rem;
        }

        .profile-meta-label {
          color: var(--color-text-light);
          font-weight: 500;
        }

        .profile-meta-value {
          color: var(--color-text);
          font-weight: 600;
        }

        .profile-tabs-header {
          display: flex;
          border-bottom: 2px solid var(--color-border);
          margin-bottom: 2rem;
          gap: 1.5rem;
        }

        .profile-tab-btn {
          background: none;
          border: none;
          padding: 1rem 0;
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--color-text-light);
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
        }

        .profile-tab-btn:hover {
          color: var(--color-text);
        }

        .profile-tab-btn.active {
          color: var(--color-primary);
        }

        .profile-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 3px;
          background-color: var(--color-primary);
          border-radius: 3px;
        }

        .card-form-body {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
        }

        .mfa-method-card {
          border: 1px solid var(--color-border);
          border-radius: 10px;
          padding: 1.25rem;
          cursor: pointer;
          display: flex;
          gap: 1.25rem;
          align-items: flex-start;
          transition: all 0.15s ease;
          background: var(--color-surface);
        }

        .mfa-method-card:hover {
          border-color: var(--color-primary);
          background: #f8f9fc;
        }

        .mfa-method-card.selected {
          border: 2px solid var(--color-primary);
          background: var(--color-primary-light);
        }

        .mfa-badge-active {
          background-color: var(--color-success-bg);
          color: var(--color-success);
          border: 1px solid #c3e6cb;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-weight: 600;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
        }

        .totp-digits-container {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          margin: 1.5rem 0;
        }

        .totp-digit-input {
          width: 44px;
          height: 48px;
          font-size: 1.5rem;
          font-weight: 700;
          text-align: center;
          border: 1px solid var(--color-border);
          border-radius: 8px;
          background-color: var(--color-surface);
          color: var(--color-text);
          transition: all 0.2s;
        }

        .totp-digit-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-light);
        }

        .totp-digit-input.error {
          border-color: var(--color-error);
          background-color: var(--color-error-bg);
        }
      `}</style>

      <div className="page-header">
        <div>
          <h2>Account Profile</h2>
          <p>Configure personal details, security settings and two-factor authentication.</p>
        </div>
      </div>

      {user && (
        <div className="profile-container">
          {/* Left Column: Avatar & Meta details */}
          <div className="avatar-card">
            <div className="profile-avatar-large">
              {getInitials()}
            </div>
            <h3 className="profile-name-title">{user.full_name || user.username}</h3>
            <span className="profile-email-subtitle">{user.email}</span>

            <div className="profile-meta-list">
              <div className="profile-meta-item">
                <span className="profile-meta-label">Username</span>
                <span className="profile-meta-value">{user.username}</span>
              </div>
              <div className="profile-meta-item">
                <span className="profile-meta-label">Role</span>
                <span className="profile-meta-value" style={{ textTransform: 'capitalize' }}>
                  {user.role ? user.role.replace('_', ' ') : 'User'}
                </span>
              </div>
              <div className="profile-meta-item">
                <span className="profile-meta-label">Status</span>
                <span className="profile-meta-value">
                  <span className="badge badge-success">Active</span>
                </span>
              </div>
              <div className="profile-meta-item">
                <span className="profile-meta-label">Security Shield</span>
                <span className="profile-meta-value">
                  {user.mfa_enabled ? (
                    <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>verified_user</span> 2FA On
                    </span>
                  ) : (
                    <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>gpp_maybe</span> 2FA Off
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Tab Content */}
          <div>
            <div className="profile-tabs-header">
              <button
                onClick={() => setActiveTab('info')}
                className={`profile-tab-btn ${activeTab === 'info' ? 'active' : ''}`}
              >
                Basic Information
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`profile-tab-btn ${activeTab === 'password' ? 'active' : ''}`}
              >
                Change Password
              </button>
              <button
                onClick={() => setActiveTab('mfa')}
                className={`profile-tab-btn ${activeTab === 'mfa' ? 'active' : ''}`}
              >
                Two-Factor Security
              </button>
            </div>

            {/* TAB 1: Basic Info Form */}
            {activeTab === 'info' && (
              <div className="card-form-body">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>badge</span>
                  Basic Information
                </h3>
                <form onSubmit={handleInfoSubmit(onInfoSubmit)}>
                  <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                      id="username"
                      type="text"
                      {...registerInfo('username', { required: 'Username is required' })}
                      className="form-control"
                      placeholder="Enter your username"
                    />
                    {infoErrors.username && <p className="text-sm text-danger" style={{ color: 'var(--color-error)', margin: '4px 0 0 0' }}>{infoErrors.username.message}</p>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      id="email"
                      type="email"
                      {...registerInfo('email', { required: 'Email is required' })}
                      className="form-control"
                      placeholder="Enter your email address"
                    />
                    {infoErrors.email && <p className="text-sm text-danger" style={{ color: 'var(--color-error)', margin: '4px 0 0 0' }}>{infoErrors.email.message}</p>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="full_name">Full Name</label>
                    <input
                      id="full_name"
                      type="text"
                      {...registerInfo('full_name')}
                      className="form-control"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                    <button
                      type="submit"
                      disabled={isUpdatingInfo}
                      className="btn btn-primary"
                    >
                      {isUpdatingInfo ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: Change Password Form */}
            {activeTab === 'password' && (
              <div className="card-form-body">
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>lock</span>
                  Change Password
                </h3>
                <form onSubmit={handlePwdSubmit(onPwdSubmit)}>
                  <div className="form-group">
                    <label htmlFor="current_password">Current Password</label>
                    <input
                      id="current_password"
                      type="password"
                      {...registerPwd('current_password', { required: 'Current password is required' })}
                      className="form-control"
                      placeholder="Enter your current password"
                    />
                    {pwdErrors.current_password && <p className="text-sm text-danger" style={{ color: 'var(--color-error)', margin: '4px 0 0 0' }}>{pwdErrors.current_password.message}</p>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="new_password">New Password</label>
                    <input
                      id="new_password"
                      type="password"
                      {...registerPwd('new_password', { 
                        required: 'New password is required',
                        minLength: { value: 8, message: 'Password must be at least 8 characters' }
                      })}
                      className="form-control"
                      placeholder="Enter a new password"
                    />
                    {pwdErrors.new_password && <p className="text-sm text-danger" style={{ color: 'var(--color-error)', margin: '4px 0 0 0' }}>{pwdErrors.new_password.message}</p>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirm_password">Confirm New Password</label>
                    <input
                      id="confirm_password"
                      type="password"
                      {...registerPwd('confirm_password', { 
                        required: 'Please confirm your new password',
                        validate: (value?: string) => value === newPwd || 'Passwords do not match'
                      })}
                      className="form-control"
                      placeholder="Confirm your new password"
                    />
                    {pwdErrors.confirm_password && <p className="text-sm text-danger" style={{ color: 'var(--color-error)', margin: '4px 0 0 0' }}>{pwdErrors.confirm_password.message}</p>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                    <button
                      type="submit"
                      disabled={isUpdatingPwd}
                      className="btn btn-primary"
                    >
                      {isUpdatingPwd ? 'Updating...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 3: Two-Factor Security */}
            {activeTab === 'mfa' && (
              <div className="card-form-body">
                {/* STATE 1: MFA is already enabled */}
                {user.mfa_enabled && !confirmDisable && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem 1rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '4.5rem', color: 'var(--color-success)', marginBottom: '1rem' }}>
                      verified_user
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                      Two-Factor Authentication is Enabled
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)', maxWidth: '450px', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '2rem' }}>
                      Your account is protected by an additional verification layer. You will be prompted to enter a verification code upon signing in from new administrative sessions.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button
                        onClick={() => setConfirmDisable(true)}
                        className="btn btn-secondary"
                        style={{ color: 'var(--color-error)', borderColor: 'var(--color-border)' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>shield_with_heart</span>
                        Disable 2FA Security
                      </button>
                    </div>
                  </div>
                )}

                {/* STATE 1.1: Confirm disable MFA */}
                {user.mfa_enabled && confirmDisable && (
                  <div style={{ padding: '1rem 0' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="material-symbols-outlined">warning</span>
                      Disable Two-Factor Authentication?
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                      Disabling Two-Factor Authentication decreases your administrative security. You will only need your username and password to log in. Are you absolutely sure you want to proceed?
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setConfirmDisable(false)}
                        className="btn btn-secondary"
                        disabled={isDisablingMfa}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDisableMfa}
                        className="btn btn-danger"
                        disabled={isDisablingMfa}
                      >
                        {isDisablingMfa ? 'Disabling...' : 'Yes, Disable Security'}
                      </button>
                    </div>
                  </div>
                )}

                {/* STATE 2: MFA is disabled - Idle state (Method Selection) */}
                {!user.mfa_enabled && mfaStep === 'idle' && (
                  <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>security</span>
                      Enable Two-Factor Authentication (MFA)
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
                      Choose how you want to receive administrative verification codes to secure your sessions.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                      {/* Authenticator App */}
                      <div
                        onClick={() => setSelectedMethod('authenticator')}
                        className={`mfa-method-card ${selectedMethod === 'authenticator' ? 'selected' : ''}`}
                      >
                        <span className="material-symbols-outlined" style={{ 
                          fontSize: '28px', 
                          color: selectedMethod === 'authenticator' ? 'var(--color-primary)' : 'var(--color-text-light)',
                          marginTop: '2px'
                        }}>
                          phonelink_setup
                        </span>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>Authenticator App (Recommended)</h4>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: '1.4' }}>
                            Use Google Authenticator, Duo, Microsoft Authenticator, or Authy to scan a QR code and receive rolling, time-based codes.
                          </p>
                        </div>
                        <input
                          type="radio"
                          name="selectedMethod"
                          checked={selectedMethod === 'authenticator'}
                          onChange={() => setSelectedMethod('authenticator')}
                          style={{ accentColor: 'var(--color-primary)', marginTop: '4px' }}
                        />
                      </div>

                      {/* Email Code */}
                      <div
                        onClick={() => setSelectedMethod('email')}
                        className={`mfa-method-card ${selectedMethod === 'email' ? 'selected' : ''}`}
                      >
                        <span className="material-symbols-outlined" style={{ 
                          fontSize: '28px', 
                          color: selectedMethod === 'email' ? 'var(--color-primary)' : 'var(--color-text-light)',
                          marginTop: '2px'
                        }}>
                          mail
                        </span>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, margin: '0 0 0.25rem 0' }}>Email Verification</h4>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: '1.4' }}>
                            Receive a 6-digit one-time passcode at your registered email address ({user.email}).
                          </p>
                        </div>
                        <input
                          type="radio"
                          name="selectedMethod"
                          checked={selectedMethod === 'email'}
                          onChange={() => setSelectedMethod('email')}
                          style={{ accentColor: 'var(--color-primary)', marginTop: '4px' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={handleStartMfaSetup}
                        disabled={loading}
                        className="btn btn-primary"
                      >
                        {loading ? 'Initializing...' : 'Set Up Two-Factor Authentication'}
                      </button>
                    </div>
                  </div>
                )}

                {/* STATE 3: MFA verification screen (Scan QR / Enter Code) */}
                {!user.mfa_enabled && mfaStep === 'verify' && (
                  <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button 
                        onClick={() => setMfaStep('idle')} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', padding: 0 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-text-light)' }}>arrow_back</span>
                      </button>
                      Verify Security Code
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
                      {selectedMethod === 'authenticator' 
                        ? 'Scan the QR code below using your authenticator app, then enter the generated 6-digit code.' 
                        : `Enter the 6-digit verification code sent to your registered email (${user.email}).`}
                    </p>

                    {selectedMethod === 'authenticator' && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', padding: '1rem', background: '#f8f9fc', borderRadius: '12px' }}>
                        {qrCode ? (
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrCode)}`} alt="MFA Setup QR Code" style={{ width: '180px', height: '180px', border: '1px solid var(--color-border)', borderRadius: '8px', background: '#ffffff', padding: '0.5rem' }} />
                        ) : (
                          <div style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e9ecef', borderRadius: '8px' }}>
                            Loading QR Code...
                          </div>
                        )}
                        <div style={{ textAlign: 'center', maxWidth: '380px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>CANNOT SCAN QR CODE? ENTER MANUAL KEY:</span>
                          <div style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, letterSpacing: '2px', background: '#ffffff', border: '1px solid var(--color-border)', padding: '0.5rem 1rem', borderRadius: '6px', marginTop: '0.25rem', userSelect: 'all' }}>
                            {secret || 'loading key...'}
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2rem 0' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>ENTER 6-DIGIT VERIFICATION CODE</span>
                      <div className="totp-digits-container">
                        {digits.map((digit, idx) => (
                          <input
                            key={idx}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleDigitChange(idx, e.target.value)}
                            onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                            onPaste={handleDigitPaste}
                            ref={(el) => { inputRefs.current[idx] = el }}
                            className={`totp-digit-input ${error ? 'error' : ''}`}
                            disabled={loading}
                          />
                        ))}
                      </div>

                      {selectedMethod === 'email' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                            {timerExpired ? (
                              <span style={{ color: 'var(--color-error)' }}>Verification code has expired.</span>
                            ) : (
                              <span>Code expires in <strong style={{ color: 'var(--color-primary)' }}>{timer}s</strong></span>
                            )}
                          </span>
                          <button
                            onClick={handleResendEmailCode}
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            Resend Code via Email
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                      <button
                        onClick={() => setMfaStep('idle')}
                        className="btn btn-secondary"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleVerifyMfa}
                        className="btn btn-primary"
                        disabled={loading}
                      >
                        {loading ? 'Verifying...' : 'Verify and Enable'}
                      </button>
                    </div>
                  </div>
                )}

                {/* STATE 4: MFA setup complete - Backup recovery codes screen */}
                {!user.mfa_enabled && mfaStep === 'backup_codes' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)', marginBottom: '1rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '2.5rem' }}>check_circle</span>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>MFA Enabled Successfully!</h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', margin: 0 }}>Backup recovery codes have been generated for your security.</p>
                      </div>
                    </div>

                    <div style={{ background: 'var(--color-warning-bg)', border: '1px solid #ffeeba', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span className="material-symbols-outlined" style={{ color: '#b78103' }}>warning</span>
                      <div>
                        <strong style={{ fontSize: '0.875rem', color: '#856404' }}>Save your recovery backup codes!</strong>
                        <p style={{ fontSize: '0.75rem', color: '#856404', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                          If you lose access to your authenticator app or email, these codes can be used to log in. Each code can be used exactly once. Store them in a secure place.
                        </p>
                      </div>
                    </div>

                    <div style={{ background: '#f8f9fc', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem 1.5rem', fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, letterSpacing: '1px', color: 'var(--color-text)' }}>
                        {backupCodes.map((code, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ color: 'var(--color-text-light)', fontSize: '0.75rem', width: '20px' }}>{idx + 1}.</span>
                            <span>{code}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                        <button
                          onClick={copyBackupCodes}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>content_copy</span>
                          Copy codes
                        </button>
                        <button
                          onClick={downloadBackupCodes}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                          Download TXT
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={handleCompleteMfaSetup}
                        className="btn btn-primary"
                      >
                        Complete Setup
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
