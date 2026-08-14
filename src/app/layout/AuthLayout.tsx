import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-bg)',
      color: 'var(--color-text)',
      fontFamily: 'var(--font-body)',
      padding: '2rem 1rem',
    }}>
      <div className="auth-card" style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        boxShadow: '0px 4px 12px rgba(9, 30, 66, 0.08)',
        padding: '2.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        <Outlet />
      </div>
    </div>
  )
}
