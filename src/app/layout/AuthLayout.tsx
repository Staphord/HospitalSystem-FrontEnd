import { Outlet, useLocation } from 'react-router-dom'

export function AuthLayout() {
  const { pathname } = useLocation()
  const isHospitalLoginPage = pathname === '/login'

  if (isHospitalLoginPage) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-body)',
      }}>
        <Outlet />
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg)',
      color: 'var(--color-text)',
      fontFamily: 'var(--font-body)'
    }}>
      {/* Top Bar Header */}
      <header style={{
        height: '64px',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '24px' }}>
            local_hospital
          </span>
          <span style={{
            fontFamily: 'var(--font-headline)',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--color-primary)',
            letterSpacing: '-0.02em'
          }}>
            Hospital Patient Flow System
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            className="material-symbols-outlined" 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--color-text-light)', 
              cursor: 'pointer',
              fontSize: '20px',
              padding: '0.5rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            help_outline
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
      </main>

      {/* Global Footer */}
      <footer style={{
        backgroundColor: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        padding: '1.5rem 2rem',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
          © {new Date().getFullYear()} Hospital Patient Flow System. All rights reserved.
        </span>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <a href="#" style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="#" style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', textDecoration: 'none' }}>Terms of Service</a>
          <a href="#" style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', textDecoration: 'none' }}>Contact Support</a>
        </div>
      </footer>
    </div>
  )
}
