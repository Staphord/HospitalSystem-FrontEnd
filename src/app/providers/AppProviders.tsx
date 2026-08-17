import type { ReactNode } from 'react'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { DocumentTitleProvider } from '@/app/providers/DocumentTitleProvider'
import { NotificationProvider } from '@/context/NotificationContext'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <DocumentTitleProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </DocumentTitleProvider>
      </AuthProvider>
    </QueryProvider>
  )
}

