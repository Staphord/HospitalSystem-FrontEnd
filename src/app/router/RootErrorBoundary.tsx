import { Component, type ReactNode, useState } from 'react'
import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Class-based ErrorBoundary component for React subtree wrapping.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallbackDisplay
          error={this.state.error}
          onReset={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Route error boundary component for React Router's errorElement
 */
export function RootErrorBoundary() {
  const routeError = useRouteError()
  return <ErrorFallbackDisplay error={routeError} />
}

function ErrorFallbackDisplay({ error, onReset }: { error: unknown; onReset?: () => void }) {
  const navigate = useNavigate()
  const [showDetails, setShowDetails] = useState(false)

  let title = 'Clinical View Error'
  let message = 'An unexpected error occurred while loading this section of the hospital system.'
  let stack = ''

  if (isRouteErrorResponse(error)) {
    title = `HTTP ${error.status}: ${error.statusText}`
    message = typeof error.data === 'string' ? error.data : 'Page request failed.'
  } else if (error instanceof Error) {
    message = error.message
    stack = error.stack || ''
  } else if (typeof error === 'string') {
    message = error
  } else if (error && typeof error === 'object' && 'message' in error) {
    message = String((error as { message: unknown }).message)
  }

  const handleRetry = () => {
    if (onReset) {
      onReset()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-md md:p-xl bg-surface-container-lowest text-on-surface">
      <div className="max-w-xl w-full bg-white border border-border-subtle rounded-2xl shadow-xl p-xl md:p-2xl flex flex-col gap-lg">
        <div className="flex items-center gap-md">
          <div className="w-12 h-12 rounded-xl bg-error/10 text-error flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[28px]">
              warning
            </span>
          </div>
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface m-0 font-bold">
              {title}
            </h2>
            <p className="font-body-sm text-body-sm text-outline m-0 mt-xs">
              System Error Diagnostics &amp; Recovery
            </p>
          </div>
        </div>

        <div className="bg-error-container/10 border border-error/20 p-md rounded-xl text-error text-body-md font-medium">
          {message}
        </div>

        <p className="font-body-md text-body-md text-outline m-0 leading-relaxed">
          Don't worry — your session and patient records are safe. You can retry loading this component or navigate back to your dashboard.
        </p>

        <div className="flex flex-wrap items-center gap-md pt-sm border-t border-border-subtle">
          <button
            type="button"
            onClick={handleRetry}
            className="flex-1 min-w-[140px] bg-primary hover:bg-[#0040a2] text-white px-lg py-md rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-xs cursor-pointer border-0 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Try Again
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex-1 min-w-[140px] bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-lg py-md rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-xs cursor-pointer border border-border-subtle"
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            Return to Dashboard
          </button>
        </div>

        {stack && (
          <div className="pt-xs">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-outline hover:text-on-surface flex items-center gap-xs cursor-pointer bg-transparent border-0 p-0"
            >
              <span className="material-symbols-outlined text-[16px]">
                {showDetails ? 'expand_less' : 'expand_more'}
              </span>
              {showDetails ? 'Hide Technical Diagnostics' : 'View Technical Diagnostics'}
            </button>
            {showDetails && (
              <pre className="mt-sm p-md bg-slate-900 text-slate-200 text-xs rounded-lg overflow-x-auto max-h-48 font-mono leading-normal select-all whitespace-pre-wrap">
                {stack}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
