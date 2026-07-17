import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { authService } from '@/api/services/auth'
import { usersService } from '@/api/services/users'
import { useAuth } from '@/hooks/useAuth'
import { getDefaultRoute } from '@/lib/roles'
import { getRolesFromToken } from '@/lib/token'

type ApiErrorLike = {
  response?: {
    status?: number
    data?: {
      detail?: unknown
      message?: string
    }
  }
}

function getApiErrorMessage(err: unknown): string {
  const apiError = err as ApiErrorLike
  const detail = apiError?.response?.data?.detail
  if (typeof detail === 'string') {
    if (detail.includes('Keycloak error') && detail.includes('{')) {
      try {
        const jsonStr = detail.substring(detail.indexOf('{'))
        const parsed = JSON.parse(jsonStr)
        if (parsed.error_description) return parsed.error_description
        if (parsed.error) return parsed.error
      } catch {
        // Fall back to the raw string below.
      }
    }
    return detail
  }
  if (typeof detail === 'object' && detail !== null && 'message' in detail) {
    const message = (detail as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  if (typeof apiError?.response?.data?.message === 'string') return apiError.response.data.message
  return ''
}

interface Feature {
  title: string
}

const features: Feature[] = [
  { title: 'Real-time Patient Monitoring' },
  { title: 'Integrated Electronic Health Records' },
  { title: 'Secure Clinical Documentation' },
  { title: 'Streamlined Ward Management' },
]

export function HospitalLoginPage() {
  const navigate = useNavigate()
  const { setTokens, setUser, clearAuth } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeSlide, setActiveSlide] = useState(0)
  const [resetKey, setResetKey] = useState(0)
  const [imgFailed, setImgFailed] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)

  useEffect(() => {
    // Check if account is locked
    const attempts = parseInt(localStorage.getItem('login_failed_attempts') || '0', 10)
    setFailedAttempts(attempts)
    if (attempts >= 5) {
      navigate('/account-locked')
    }
  }, [navigate])

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 4)
    }, 4000)
    return () => clearInterval(timer)
  }, [resetKey])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const tokens = await authService.login({ username, password }) as any
      
      // Clear failed attempts upon successful login
      localStorage.removeItem('login_failed_attempts')
      setFailedAttempts(0)
      
      setTokens(tokens.access_token, tokens.refresh_token)

      let user
      try {
        user = await usersService.getMe()
      } catch (profileErr: unknown) {
        clearAuth()
        setError(getApiErrorMessage(profileErr) || 'Login succeeded, but your profile could not be loaded.')
        toast.error('Login succeeded, but profile loading failed.')
        return
      }

      setUser(user)
      toast.success('Welcome back!')
      navigate(getDefaultRoute(getRolesFromToken(tokens.access_token)))
    } catch (err: unknown) {
      const apiMessage = getApiErrorMessage(err)
      if (apiMessage.toLowerCase().includes('not fully set up') || apiMessage.toLowerCase().includes('setup')) {
        toast.info('First-time login: Redirecting to establish your secure password.')
        navigate('/first-login-change-password', { state: { username, tempPassword: password } })
        return
      }

      const apiError = err as ApiErrorLike
      const isRateLimited = apiError?.response?.status === 429
      const detail = apiError?.response?.data?.detail
      
      let attemptsRemaining: number | undefined = undefined
      if (typeof detail === 'object' && detail !== null && 'attempts_remaining' in detail) {
        attemptsRemaining = (detail as { attempts_remaining?: unknown }).attempts_remaining as number
      }
      
      let nextAttempts = failedAttempts + 1
      if (isRateLimited || attemptsRemaining === 0) {
        nextAttempts = 5
      } else if (attemptsRemaining !== undefined) {
        nextAttempts = 5 - attemptsRemaining
      }
      
      localStorage.setItem('login_failed_attempts', nextAttempts.toString())
      setFailedAttempts(nextAttempts)
      
      if (nextAttempts >= 5) {
        setError('Too many login attempts. Account locked.')
        toast.error('Too many login attempts. Account locked.')
        navigate('/account-locked')
      } else {
        const apiMessage =
          typeof detail === 'object' && detail !== null && 'message' in detail
            ? (detail as { message?: unknown }).message
            : getApiErrorMessage(err)
        const message = typeof apiMessage === 'string' && apiMessage.trim()
          ? apiMessage
          : 'Invalid username or password. Please try again.'
        setError(message)
        toast.error(message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSlide = (idx: number) => {
    setActiveSlide(idx)
    setResetKey((prev) => prev + 1)
  }

  const inputErrorStyle = error ? { borderColor: 'var(--color-error)' } : {}

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white">
      <style>{`
        @keyframes progressFill {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-progress-fill {
          animation: progressFill 4000ms linear forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 300ms ease-out forwards;
        }
        .dashboard-preview-container {
          perspective: 1000px;
        }
        .dashboard-preview {
          transform: rotateY(-5deg) rotateX(2deg);
          box-shadow: -20px 20px 60px rgba(0,0,0,0.3);
        }
      `}</style>

      <section className="flex-1 flex flex-col justify-between p-8 md:p-12 lg:p-20 xl:p-32 bg-white" data-purpose="login-form-container">
        <div className="max-w-md w-full mx-auto flex flex-col justify-between h-full">
          <div className="mb-12">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded flex items-center justify-center text-white shrink-0">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </div>
              <span className="text-2xl font-bold font-display tracking-tight ml-1 text-[#191c1e]">HPMS Clinical</span>
            </div>
          </div>

          <div className="w-full">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 font-display text-[#191c1e]">Hospital Portal Login</h1>
              <p className="text-gray-500 text-sm">Enter your hospital admin credentials to access your secure portal.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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
                    <strong>Access Denied:</strong> {error} {5 - failedAttempts} attempts remaining before account lock.
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-[#191c1e]" htmlFor="username">Username</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </span>
                  <input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={inputErrorStyle}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-secondary/60 text-[#191c1e] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-[#191c1e]" htmlFor="password">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="........"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={inputErrorStyle}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-secondary/60 text-[#191c1e] text-sm"
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

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center cursor-pointer select-none">
                  <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary mr-2" />
                  <span className="text-gray-500">Remember this device</span>
                </label>
                <Link to="/forgot-password" className="text-primary font-semibold hover:underline">Forgot password</Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-[#0040a2] text-white py-3 rounded font-semibold transition-colors shadow-sm disabled:opacity-60"
              >
                {loading ? 'Logging in...' : 'Log in'}
              </button>
            </form>
          </div>

          <div className="mt-12 text-center md:text-left">
            <p className="text-xs text-gray-400">
              By accessing this portal, you agree to the Hospital Security Policy and{' '}
              <a href="#" onClick={(e) => e.preventDefault()} className="underline hover:text-gray-600">Terms of Use</a>.
            </p>
          </div>
        </div>
      </section>

      <section className="flex-1 text-white p-8 md:p-12 lg:p-20 relative overflow-hidden flex flex-col items-center justify-center bg-primary" data-purpose="marketing-panel">
        <div className="absolute inset-0 bg-primary overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-blue-700 to-blue-900"></div>
          <svg className="absolute w-[150%] h-[150%] -top-[25%] -left-[25%] opacity-50 blur-3xl" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,1000 C300,800 400,200 1000,0 L1000,1000 Z" fill="#003d9b"></path>
            <path d="M0,1000 C200,600 600,400 1000,200 L1000,1000 Z" fill="#0040a2"></path>
            <path d="M0,1000 C100,400 800,200 1000,400 L1000,1000 Z" fill="#0052cc"></path>
          </svg>
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path className="animate-pulse" d="M0 50 L20 50 L25 30 L35 70 L40 50 L60 50 L65 20 L75 80 L80 50 L100 50" fill="none" stroke="white" strokeWidth="0.5"></path>
            </svg>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-2xl">
          <div className="mb-12 bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-xl relative overflow-hidden shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-6 tracking-tight text-white drop-shadow-md">HPMS Clinical: Integrated Patient Care &amp; Hospital Management</h2>
            <p className="text-blue-100 text-lg mb-8 leading-relaxed">Empowering healthcare professionals with real-time data and streamlined clinical workflows.</p>

            <div className="grid grid-cols-2 gap-8 relative">
              {features.map((feature, idx) => {
                const isActive = activeSlide === idx
                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectSlide(idx)}
                    className={`flex items-center gap-3 cursor-pointer transition-all duration-300 ${
                      isActive ? 'opacity-100 scale-[1.02]' : 'opacity-50 hover:opacity-75'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      isActive ? 'bg-blue-300 shadow-[0_0_8px_rgba(147,197,253,0.8)]' : 'bg-white/40'
                    }`} />
                    <span className="text-sm font-medium tracking-wide text-white">{feature.title}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="dashboard-preview-container bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl">
            <div className="dashboard-preview bg-white rounded-lg p-1 border-4 border-white/20 overflow-hidden shadow-2xl">
              {!imgFailed ? (
                <img
                  alt="Dashboard Preview"
                  className="rounded w-full h-auto block"
                  src="https://lh3.googleusercontent.com/aida/AP1WRLsO98q10aR6FG7iJzaPc145e9cUkunjjqWY4JnEKXyoxjq2cvE-sLKH3JMfNmqGQdPRz2bAHrY-k3M4N6pEezjjea_Cui7qm8TmI1XjKjeDJmncPvTiunLt7-9pe_8kA_hx34e-GRsvcNNIV7mq8j13KYvmhaD0Padcy7p_3MGxDli7jOd50XHmuBy-TWw8-6mQeBzQFa6HwYcw1NI7D0Jnmjw5DUmmr8sN8sJJfagiMDIiTv3du0hQHC8"
                  onError={() => setImgFailed(true)}
                />
              ) : (
                <DashboardMockup activeSlide={activeSlide} />
              )}
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-white/10 flex justify-center gap-4">
            {features.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSlide(idx)}
                className="w-16 h-1 bg-white/20 rounded-full overflow-hidden relative cursor-pointer focus:outline-none focus:ring-1 focus:ring-white"
                aria-label={`Go to slide ${idx + 1}`}
              >
                <div
                  key={`${idx}-${activeSlide === idx}-${resetKey}`}
                  className="absolute top-0 left-0 h-full bg-white rounded-full"
                  style={{
                    width: activeSlide === idx ? '0%' : activeSlide > idx ? '100%' : '0%',
                    animation: activeSlide === idx ? 'progressFill 4000ms linear forwards' : undefined
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

const DashboardMockup: React.FC<{ activeSlide: number }> = ({ activeSlide }) => {
  return (
    <div className="w-full aspect-[512/286] bg-[#f8f9fb] flex flex-col text-slate-800 text-[10px] select-none p-2 font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2 shrink-0">
        <div className="flex items-center gap-1.5 font-bold text-primary">
          <span className="material-symbols-outlined text-[12px]">local_hospital</span>
          <span>Muhimbili Portal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-3 bg-slate-200 rounded-full shrink-0" />
          <div className="w-3 h-3 bg-primary rounded-full shrink-0" />
        </div>
      </div>

      <div className="flex gap-2 flex-1 min-h-0">
        <div className="w-16 border-r border-slate-200 pr-1.5 flex flex-col gap-1 shrink-0">
          <div className="h-2.5 bg-primary/10 rounded" />
          <div className="h-2.5 bg-slate-200 rounded" />
          <div className="h-2.5 bg-slate-200 rounded" />
          <div className="h-2.5 bg-slate-200 rounded" />
        </div>

        <div className="flex-1 flex flex-col gap-2 min-h-0">
          {activeSlide === 0 && (
            <div className="flex flex-col gap-2 flex-1 animate-fadeIn">
              <span className="font-bold text-slate-600">Real-time Patient Vitals</span>
              <div className="grid grid-cols-3 gap-1.5 shrink-0">
                <div className="bg-white p-1 rounded border border-slate-200 flex flex-col gap-0.5 shadow-sm">
                  <span className="text-[7px] text-slate-400">Heart Rate</span>
                  <span className="font-bold text-success text-[8px]">78 BPM</span>
                </div>
                <div className="bg-white p-1 rounded border border-slate-200 flex flex-col gap-0.5 shadow-sm">
                  <span className="text-[7px] text-slate-400">SpO2</span>
                  <span className="font-bold text-primary text-[8px]">98%</span>
                </div>
                <div className="bg-white p-1 rounded border border-slate-200 flex flex-col gap-0.5 shadow-sm">
                  <span className="text-[7px] text-slate-400">Temp</span>
                  <span className="font-bold text-[#FFAB00] text-[8px]">36.8 °C</span>
                </div>
              </div>
              <div className="flex-1 bg-white rounded border border-slate-200 p-1.5 relative overflow-hidden shadow-sm flex items-center justify-center">
                <svg className="w-full h-8 stroke-success" viewBox="0 0 100 20" fill="none" strokeWidth="1">
                  <path d="M0 10 L10 10 L15 10 L18 2 L22 18 L25 10 L35 10 L40 10 L43 2 L47 18 L50 10 L70 10 L73 5 L76 15 L78 10 L100 10" />
                </svg>
              </div>
            </div>
          )}

          {activeSlide === 1 && (
            <div className="flex flex-col gap-1.5 flex-1 animate-fadeIn">
              <span className="font-bold text-slate-600">Electronic Health Records</span>
              <div className="flex-1 bg-white rounded border border-slate-200 p-1.5 shadow-sm flex flex-col gap-1">
                <div className="flex justify-between border-b border-slate-100 pb-0.5">
                  <span className="font-semibold">Patient</span>
                  <span className="text-slate-400">Status</span>
                </div>
                <div className="flex justify-between items-center text-[7px]">
                  <span>John Doe (Male, 45)</span>
                  <span className="bg-success/10 text-success px-1 rounded-full text-[6px]">Stable</span>
                </div>
                <div className="flex justify-between items-center text-[7px]">
                  <span>Mary Smith (Female, 32)</span>
                  <span className="bg-[#FFAB00]/10 text-[#FFAB00] px-1 rounded-full text-[6px]">In Consultation</span>
                </div>
                <div className="flex justify-between items-center text-[7px]">
                  <span>David Cole (Male, 61)</span>
                  <span className="bg-error/10 text-error px-1 rounded-full text-[6px]">Critical</span>
                </div>
              </div>
            </div>
          )}

          {activeSlide === 2 && (
            <div className="flex flex-col gap-1.5 flex-1 animate-fadeIn">
              <span className="font-bold text-slate-600">Clinical Documentation</span>
              <div className="flex-1 bg-white rounded border border-slate-200 p-1.5 shadow-sm flex flex-col gap-1">
                <span className="font-semibold text-slate-500 text-[8px]">New Consultation Report</span>
                <div className="w-full h-2 bg-slate-100 rounded" />
                <div className="w-[80%] h-2 bg-slate-100 rounded" />
                <div className="w-[90%] h-2 bg-slate-100 rounded" />
                <div className="flex justify-end mt-auto">
                  <div className="bg-primary text-white text-[6px] px-1.5 py-0.5 rounded font-semibold">Save Entry</div>
                </div>
              </div>
            </div>
          )}

          {activeSlide === 3 && (
            <div className="flex flex-col gap-1.5 flex-1 animate-fadeIn">
              <span className="font-bold text-slate-600">Ward Occupancy Overview</span>
              <div className="flex-1 grid grid-cols-4 gap-1">
                {Array.from({ length: 8 }).map((_, i) => {
                  const status = i % 3 === 0 ? 'occupied' : i % 3 === 1 ? 'maintenance' : 'empty'
                  return (
                    <div
                      key={i}
                      className={`rounded p-1 border flex flex-col items-center justify-center gap-0.5 shadow-sm ${
                        status === 'occupied'
                          ? 'bg-primary/5 border-primary/20 text-primary font-bold'
                          : status === 'maintenance'
                          ? 'bg-[#FFAB00]/5 border-[#FFAB00]/20 text-[#FFAB00] font-bold'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}
                    >
                      <span className="text-[6px]">Bed {i + 1}</span>
                      <span className="material-symbols-outlined text-[10px]">
                        {status === 'occupied' ? 'bed' : 'check_circle'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
