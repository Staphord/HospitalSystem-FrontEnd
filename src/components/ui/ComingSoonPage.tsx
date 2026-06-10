import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'

interface ComingSoonPageProps {
  title: string
  description: string
}

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState title="Coming soon" description={description} />
    </>
  )
}
