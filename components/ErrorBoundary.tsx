'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    this.props.onError?.(error, errorInfo)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <Card className="max-w-lg w-full bg-white border-red-200 shadow-lg">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-red-100">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-red-900">Something went wrong</CardTitle>
                  <CardDescription className="text-red-700">
                    An unexpected error occurred
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm font-mono text-red-800 break-all">
                    {this.state.error.message}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-600 cursor-pointer">
                        Stack trace
                      </summary>
                      <pre className="mt-2 text-xs text-red-700 overflow-auto max-h-32">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={this.handleReset}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  className="flex-1 gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook-based error boundary wrapper for functional components
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    )
  }
}
