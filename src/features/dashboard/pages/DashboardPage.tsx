import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/hooks/useAuth'

export function DashboardPage() {
  const { user, tenantId } = useAuth()

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Welcome, ${user?.full_name || user?.username || 'there'}.`}
      />
      {tenantId && <p className="text-muted">Hospital ID: {tenantId}</p>}
    </>
  )
}
