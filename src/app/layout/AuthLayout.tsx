import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-card">
        <h1 className="auth-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <span>🏥</span>
          <span>Hospital PMS</span>
        </h1>
        <Outlet />
      </div>
    </div>
  )
}
