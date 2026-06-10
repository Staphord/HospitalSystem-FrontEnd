import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { authService } from '@/api/services/auth'
import { usersService } from '@/api/services/users'
import { useAuth } from '@/hooks/useAuth'
import { getDefaultRoute } from '@/lib/roles'
import { getRolesFromToken } from '@/lib/token'

export function LoginPage() {
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const tokens = await authService.login({ username, password })
      setTokens(tokens.access_token, tokens.refresh_token)
      const user = await usersService.getMe()
      setUser(user)
      toast.success('Welcome back!')
      navigate(getDefaultRoute(getRolesFromToken(tokens.access_token)))
    } catch {
      toast.error('Invalid username or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="form-group">
        <label htmlFor="login-username" style={{ marginBottom: '0.25rem', display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Username</label>
        <input
          id="login-username"
          className="form-control"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoComplete="username"
          placeholder="Enter username"
        />
      </div>

      <div className="form-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
          <label htmlFor="login-password" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Password</label>
          <Link to="/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'none' }}>
            Forgot password?
          </Link>
        </div>
        <div style={{ position: 'relative' }}>
          <input
            id="login-password"
            className="form-control"
            style={{ paddingRight: '2.5rem' }}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
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
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            {showPassword ? '👁️' : '🙈'}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        style={{ width: '100%', padding: '0.625rem', fontSize: '0.875rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '0.5rem' }}
        disabled={loading}
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )
}
