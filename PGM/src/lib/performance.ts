/**
 * Performance optimization utilities
 * Includes memoization helpers, lazy loading, and performance monitoring
 */

import { useMemo, useCallback, memo, ComponentType, LazyExoticComponent } from 'react';
import dynamic from 'next/dynamic';

/**
 * Memoize expensive computations
 */
export function useMemoizedValue<T>(factory: () => T, deps: React.DependencyList): T {
  return useMemo(factory, deps);
}

/**
 * Memoize callbacks to prevent unnecessary re-renders
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps) as T;
}

/**
 * Create a memoized component
 */
export function createMemoizedComponent<P extends object>(
  Component: ComponentType<P>,
  displayName?: string
) {
  const Memoized = memo(Component);
  if (displayName) {
    Memoized.displayName = displayName;
  }
  return Memoized;
}

/**
 * Lazy load component with loading fallback
 */
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    loading?: ComponentType;
    ssr?: boolean;
  }
): LazyExoticComponent<ComponentType<P>> {
  return dynamic(importFn, {
    loading: options?.loading,
    ssr: options?.ssr !== false,
  });
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitor(componentName: string) {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return;
  }

  const startTime = performance.now();

  return {
    end: () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`[Performance] ${componentName} rendered in ${duration.toFixed(2)}ms`);
    },
  };
}
