import { useAuth } from '@/hooks/useAuth'

export function useImpersonation() {
  const { isImpersonating, isReadOnly } = useAuth()

  return {
    isImpersonating,
    isReadOnly,
    canWrite: !isReadOnly,
  }
}
