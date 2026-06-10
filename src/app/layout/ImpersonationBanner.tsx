import { useImpersonation } from '@/hooks/useImpersonation'

export function ImpersonationBanner() {
  const { isImpersonating } = useImpersonation()

  if (!isImpersonating) return null

  return (
    <div className="impersonation-banner">
      You are viewing this hospital in read-only mode.
    </div>
  )
}
