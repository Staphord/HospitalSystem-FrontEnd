import type { ReactNode } from 'react'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { AuthProvider } from '@/app/providers/AuthProvider'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  )
}
