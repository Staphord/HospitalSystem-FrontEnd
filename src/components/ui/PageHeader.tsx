import { useLocation } from 'react-router-dom'

interface PageHeaderProps {
  title: string
  description?: string
  forceShowTitle?: boolean
}

export function PageHeader({ title, description, forceShowTitle = false }: PageHeaderProps) {
  const location = useLocation()
  const isAuthPage =
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/register') ||
    location.pathname.startsWith('/signup')

  const showTitle = forceShowTitle || isAuthPage

  return (
    <div className="page-header" style={{ marginBottom: '1rem' }}>
      {showTitle && <h2 style={{ margin: '0 0 0.5rem 0' }}>{title}</h2>}
      {description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>{description}</p>}
    </div>
  )
}
