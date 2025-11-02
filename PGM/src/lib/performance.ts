/**
 * Performance Monitoring System
 * 
 * Industry-level performance monitoring with metrics collection,
 * performance budgets, and optimization recommendations
 */

import { logger, logPerformanceMetric } from './logger';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  context?: Record<string, any>;
}

export interface PerformanceBudget {
  name: string;
  threshold: number;
  unit: string;
  severity: 'warning' | 'error';
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  violations: PerformanceViolation[];
  recommendations: string[];
  timestamp: string;
}

export interface PerformanceViolation {
  metric: string;
  actual: number;
  threshold: number;
  severity: 'warning' | 'error';
  message: string;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private budgets: PerformanceBudget[] = [];
  private observers: PerformanceObserver[] = [];

  private constructor() {
    this.initializeBudgets();
    this.setupObservers();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Initialize performance budgets
   */
  private initializeBudgets(): void {
    this.budgets = [
      {
        name: 'first-contentful-paint',
        threshold: 2000,
        unit: 'ms',
        severity: 'warning',
      },
      {
        name: 'largest-contentful-paint',
        threshold: 2500,
        unit: 'ms',
        severity: 'error',
      },
      {
        name: 'first-input-delay',
        threshold: 100,
        unit: 'ms',
        severity: 'warning',
      },
      {
        name: 'cumulative-layout-shift',
        threshold: 0.1,
        unit: 'score',
        severity: 'error',
      },
      {
        name: 'time-to-interactive',
        threshold: 3000,
        unit: 'ms',
        severity: 'warning',
      },
    ];
  }

  /**
   * Setup performance observers
   */
  private setupObservers(): void {
    if (typeof window === 'undefined') return;

    // Observe navigation timing
    if ('PerformanceObserver' in window) {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordMetric(entry.name, entry.duration, 'ms');
        });
      });

      try {
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (error) {
        logger.warn('Failed to observe navigation timing', { action: 'performance_observer' });
      }

      // Observe paint timing
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordMetric(entry.name, entry.startTime, 'ms');
        });
      });

      try {
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);
      } catch (error) {
        logger.warn('Failed to observe paint timing', { action: 'performance_observer' });
      }

      // Observe largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('largest-contentful-paint', lastEntry.startTime, 'ms');
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        logger.warn('Failed to observe LCP', { action: 'performance_observer' });
      }

      // Observe first input delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric('first-input-delay', entry.processingStart - entry.startTime, 'ms');
        });
      });

      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (error) {
        logger.warn('Failed to observe FID', { action: 'performance_observer' });
      }

      // Observe layout shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.recordMetric('cumulative-layout-shift', clsValue, 'score');
      });

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        logger.warn('Failed to observe CLS', { action: 'performance_observer' });
      }
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, unit: string, context?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      context,
    };

    this.metrics.push(metric);
    logPerformanceMetric(name, value, context);

    // Check against budgets
    this.checkBudget(metric);
  }

  /**
   * Check metric against performance budget
   */
  private checkBudget(metric: PerformanceMetric): void {
    const budget = this.budgets.find(b => b.name === metric.name);
    if (!budget) return;

    if (metric.value > budget.threshold) {
      const violation: PerformanceViolation = {
        metric: metric.name,
        actual: metric.value,
        threshold: budget.threshold,
        severity: budget.severity,
        message: `${metric.name} exceeded budget: ${metric.value}${metric.unit} > ${budget.threshold}${budget.unit}`,
      };

      logger.warn(`Performance budget violation: ${violation.message}`, {
        action: 'performance_violation',
      }, {
        metric: metric.name,
        actual: metric.value,
        threshold: budget.threshold,
        severity: budget.severity,
      });
    }
  }

  /**
   * Measure function execution time
   */
  measureFunction<T>(name: string, fn: () => T, context?: Record<string, any>): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    this.recordMetric(name, duration, 'ms', context);
    return result;
  }

  /**
   * Measure async function execution time
   */
  async measureAsyncFunction<T>(
    name: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    this.recordMetric(name, duration, 'ms', context);
    return result;
  }

  /**
   * Get performance report
   */
  getReport(): PerformanceReport {
    const violations: PerformanceViolation[] = [];
    const recommendations: string[] = [];

    // Check all metrics against budgets
    this.metrics.forEach(metric => {
      const budget = this.budgets.find(b => b.name === metric.name);
      if (budget && metric.value > budget.threshold) {
        violations.push({
          metric: metric.name,
          actual: metric.value,
          threshold: budget.threshold,
          severity: budget.severity,
          message: `${metric.name} exceeded budget`,
        });
      }
    });

    // Generate recommendations
    if (violations.some(v => v.metric === 'largest-contentful-paint')) {
      recommendations.push('Optimize images and reduce render-blocking resources');
    }
    if (violations.some(v => v.metric === 'first-input-delay')) {
      recommendations.push('Reduce JavaScript execution time and optimize event handlers');
    }
    if (violations.some(v => v.metric === 'cumulative-layout-shift')) {
      recommendations.push('Add size attributes to images and avoid inserting content above existing content');
    }

    return {
      metrics: [...this.metrics],
      violations,
      recommendations,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Cleanup observers
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Performance decorators
export function measurePerformance(name: string, context?: Record<string, any>) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = function (...args: any[]) {
      return performanceMonitor.measureFunction(
        `${target.constructor.name}.${propertyName}`,
        () => method.apply(this, args),
        context
      );
    };
  };
}

export function measureAsyncPerformance(name: string, context?: Record<string, any>) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measureAsyncFunction(
        `${target.constructor.name}.${propertyName}`,
        () => method.apply(this, args),
        context
      );
    };
  };
}

// Utility functions
export const measurePageLoad = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    performanceMonitor.recordMetric('dom-content-loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart, 'ms');
    performanceMonitor.recordMetric('load-complete', navigation.loadEventEnd - navigation.loadEventStart, 'ms');
    performanceMonitor.recordMetric('time-to-interactive', navigation.domInteractive - navigation.fetchStart, 'ms');
  });
};

export const measureResourceTiming = () => {
  if (typeof window === 'undefined') return;

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  resources.forEach((resource) => {
    performanceMonitor.recordMetric(`resource-${resource.name}`, resource.duration, 'ms', {
      type: resource.initiatorType,
      size: resource.transferSize,
    });
  });
};
