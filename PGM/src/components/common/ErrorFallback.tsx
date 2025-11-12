'use client';

import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="max-w-2xl w-full shadow-2xl border-0">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-500 rounded-lg">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Something went wrong
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {error.message || 'An unexpected error occurred'}
              </p>
            </div>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto max-h-48 font-mono">
                {error.stack}
              </pre>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={resetErrorBoundary}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/';
                }
              }}
              className="flex-1 border-2 border-gray-300 hover:border-gray-400 font-semibold"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

