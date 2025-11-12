/**
 * Analytics and performance monitoring utilities
 * Ready for integration with analytics services
 */

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: number;
}

class Analytics {
  private enabled: boolean;
  private events: AnalyticsEvent[] = [];

  constructor() {
    this.enabled = process.env.NODE_ENV === 'production' && 
                   typeof window !== 'undefined';
  }

  /**
   * Track page view
   */
  pageView(path: string, title?: string) {
    if (!this.enabled) return;
    
    const event: AnalyticsEvent = {
      name: 'page_view',
      properties: {
        path,
        title: title || document.title,
        timestamp: Date.now(),
      },
    };

    this.track(event);
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 [Analytics] Page view:', path);
    }
  }

  /**
   * Track custom event
   */
  trackEvent(name: string, properties?: Record<string, unknown>) {
    if (!this.enabled) return;
    
    const event: AnalyticsEvent = {
      name,
      properties: {
        ...properties,
        timestamp: Date.now(),
      },
    };

    this.track(event);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 [Analytics] Event:', name, properties);
    }
  }

  /**
   * Track user action
   */
  trackAction(action: string, target?: string, value?: unknown) {
    this.trackEvent('user_action', {
      action,
      target,
      value,
    });
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: string) {
    this.trackEvent('error', {
      error_message: error.message,
      error_stack: error.stack,
      context,
    });
  }

  /**
   * Track performance metric
   */
  trackPerformance(metric: string, value: number, unit: string = 'ms') {
    this.trackEvent('performance', {
      metric,
      value,
      unit,
    });
  }

  /**
   * Internal track method
   */
  private track(event: AnalyticsEvent) {
    this.events.push(event);
    
    // In production, send to analytics service
    // Example: Google Analytics, Mixpanel, etc.
    if (this.enabled && typeof window !== 'undefined') {
      // window.gtag?.('event', event.name, event.properties);
      // window.mixpanel?.track(event.name, event.properties);
    }
  }

  /**
   * Get all tracked events (for debugging)
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Clear events
   */
  clearEvents() {
    this.events = [];
  }
}

// Singleton instance
export const analytics = new Analytics();

/**
 * Hook for tracking page views
 */
export function usePageView(path: string, title?: string) {
  React.useEffect(() => {
    analytics.pageView(path, title);
  }, [path, title]);
}

// Add React import for hook
import React from 'react';

