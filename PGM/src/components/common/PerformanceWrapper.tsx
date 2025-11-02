import React, { memo, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface PerformanceWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  memo?: boolean;
}

const DefaultFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin" />
    <span className="ml-2">Loading...</span>
  </div>
);

export const PerformanceWrapper: React.FC<PerformanceWrapperProps> = memo(({ 
  children, 
  fallback = <DefaultFallback />,
  memo: useMemo = true 
}) => {
  if (useMemo) {
    return (
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    );
  }

  return <>{children}</>;
});

PerformanceWrapper.displayName = 'PerformanceWrapper';

// Higher-order component for memoization
export const withPerformance = <P extends object>(
  Component: React.ComponentType<P>,
  displayName?: string
) => {
  const MemoizedComponent = memo(Component);
  MemoizedComponent.displayName = displayName || Component.displayName || Component.name;
  return MemoizedComponent;
};

// Hook for performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  React.useEffect(() => {
    const start = performance.now();
    
    return () => {
      const end = performance.now();
      const duration = end - start;
      
      if (duration > 100) { // Log if component takes more than 100ms
        console.warn(`Performance: ${componentName} took ${duration.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
};




