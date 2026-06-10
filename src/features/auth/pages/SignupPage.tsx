import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'

export function SignupPage() {
  return (
    <>
      <PageHeader title="Register your hospital" />
      <EmptyState
        title="Signup form coming soon"
        description="This page will connect to POST /api/v1/auth/signup."
      />
      <p className="auth-footer">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </>
  )
}
