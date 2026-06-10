import { EmptyState } from '@/components/ui/EmptyState'

export function ResetPasswordPage() {
  return (
    <EmptyState
      title="Set a new password"
      description="This page will connect to POST /api/v1/auth/password-reset/confirm."
    />
  )
}
