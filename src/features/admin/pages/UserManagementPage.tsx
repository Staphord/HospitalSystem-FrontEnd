import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'

export function UserManagementPage() {
  return (
    <>
      <PageHeader
        title="User management"
        description="Create and manage staff accounts for your hospital."
      />
      <EmptyState
        title="User table coming soon"
        description="Connects to GET /api/v1/users via api-gateway → admin-service."
      />
    </>
  )
}
