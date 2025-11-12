'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logErrorBoundary } from '@/lib/logger';
import { ErrorFallback } from './ErrorFallback';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | string | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error | string): Partial<State> {
    return {
      hasError: true,
      error: error instanceof Error ? error : new Error(String(error)),
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service
    logErrorBoundary(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      if (this.state.error) {
        // Convert error to Error type if it's a string
        const errorObj = this.state.error instanceof Error 
          ? this.state.error 
          : new Error(String(this.state.error));
        
        return (
          <ErrorFallback
            error={errorObj}
            resetErrorBoundary={this.handleReset}
          />
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
          <Card className="max-w-2xl w-full shadow-2xl border-0">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-t-lg">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-red-500 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Something went wrong
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    We&apos;re sorry, but something unexpected happened
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error ? (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Error Details (Development Only):
                  </p>
                  <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto max-h-48 font-mono whitespace-pre-wrap break-words">
                    {(() => {
                      const error = this.state.error;
                      if (!error) return 'Unknown error';
                      if (typeof error === 'string') return error;
                      // TypeScript type guard: after string check, error must be Error
                      const errorObj = error as Error;
                      return errorObj instanceof Error ? errorObj.toString() : String(errorObj);
                    })()}
                    {this.state.errorInfo?.componentStack ? (
                      <div className="mt-2 text-gray-600 dark:text-gray-400">
                        {this.state.errorInfo.componentStack}
                      </div>
                    ) : null}
                  </pre>
                </div>
              ) : null}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleReset}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 font-semibold"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                If the problem persists, please contact support
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

