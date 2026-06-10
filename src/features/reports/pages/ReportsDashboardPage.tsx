import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'

export function ReportsDashboardPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Hospital analytics — census, revenue, wait times, and occupancy."
      />
      <EmptyState
        title="Reports dashboard coming soon"
        description="Connects to /api/v1/reports/* via api-gateway → report-service."
      />
    </>
  )
}
