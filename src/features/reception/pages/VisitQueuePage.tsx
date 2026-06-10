import { ComingSoonPage } from '@/components/ui/ComingSoonPage'

export function VisitQueuePage() {
  return (
    <ComingSoonPage
      title="Visit queue"
      description="Waiting on GET /api/v1/queue via api-gateway → reception-service."
    />
  )
}
