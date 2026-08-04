import { AppProviders } from '@/app/providers/AppProviders'
import { AppRouter } from '@/app/router'
import { ErrorBoundary } from '@/app/router/RootErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </ErrorBoundary>
  )
}

