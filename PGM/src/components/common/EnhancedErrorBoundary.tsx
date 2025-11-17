'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl"
          >
            <Card glow className="border-red-500/30">
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-10 w-10 text-red-500" />
                </div>
                <CardTitle className="text-2xl text-white mb-2">
                  Oops! Something went wrong
                </CardTitle>
                <p className="text-[#a1a1a1]">
                  We encountered an unexpected error. Don't worry, we're on it!
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Error Details (Development Only) */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-4 overflow-auto max-h-60">
                    <p className="text-red-400 font-mono text-sm mb-2">
                      <strong>Error:</strong> {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <pre className="text-[#a1a1a1] font-mono text-xs whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={this.handleReset}
                    className="flex items-center gap-2"
                    magnetic
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                  <Button
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="flex items-center gap-2"
                    magnetic
                  >
                    <Home className="h-4 w-4" />
                    Go Home
                  </Button>
                </div>

                {/* Help Text */}
                <p className="text-center text-sm text-[#737373]">
                  If the problem persists, please contact support at{' '}
                  <a
                    href="mailto:support@staytrack.com"
                    className="text-[#f5c518] hover:underline"
                  >
                    support@staytrack.com
                  </a>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to use error boundary in functional components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return { handleError, resetError };
}

