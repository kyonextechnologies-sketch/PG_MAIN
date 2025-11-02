/**
 * Logging System
 * 
 * Industry-level logging with different levels, structured logging,
 * and integration with monitoring services
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

class Logger {
  private static instance: Logger;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context, metadata);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context, metadata);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context, metadata);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: LogContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, {
      ...metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  /**
   * Log fatal error message
   */
  fatal(message: string, error?: Error, context?: LogContext, metadata?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, context, {
      ...metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    metadata?: Record<string, any>
  ): void {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      metadata,
    };

    // Console logging for development
    if (this.isDevelopment) {
      this.logToConsole(logEntry);
    }

    // Send to external logging service in production
    if (!this.isDevelopment) {
      this.sendToLoggingService(logEntry);
    }
  }

  /**
   * Console logging with colors and formatting
   */
  private logToConsole(entry: LogEntry): void {
    const { level, message, timestamp, context, metadata, error } = entry;
    
    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.FATAL]: '\x1b[35m', // Magenta
    };

    const reset = '\x1b[0m';
    const color = colors[level] || '';
    
    const contextStr = context ? ` [${Object.entries(context).map(([k, v]) => `${k}=${v}`).join(', ')}]` : '';
    const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
    const errorStr = error ? `\n${error.stack}` : '';

    console.log(
      `${color}[${timestamp}] ${level.toUpperCase()}:${reset} ${message}${contextStr}${metadataStr}${errorStr}`
    );
  }

  /**
   * Send to external logging service
   */
  private sendToLoggingService(entry: LogEntry): void {
    // Implement integration with your preferred logging service
    // Examples: Sentry, LogRocket, DataDog, CloudWatch, etc.
    
    // For now, we'll use a simple approach
    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL) {
      // Send critical errors to monitoring service
      this.sendToMonitoringService(entry);
    }
  }

  /**
   * Send to monitoring service (implement based on your choice)
   */
  private sendToMonitoringService(entry: LogEntry): void {
    // Example implementation for Sentry
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(new Error(entry.message), {
        level: entry.level,
        tags: entry.context,
        extra: entry.metadata,
      });
    }
  }

  /**
   * Create a child logger with default context
   */
  child(defaultContext: LogContext): Logger {
    const childLogger = new Logger();
    const originalLog = childLogger.log.bind(childLogger);
    
    childLogger.log = (level: LogLevel, message: string, context?: LogContext, metadata?: Record<string, any>) => {
      const mergedContext = { ...defaultContext, ...context };
      originalLog(level, message, mergedContext, metadata);
    };
    
    return childLogger;
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Utility functions for common logging patterns
export const logUserAction = (action: string, userId: string, metadata?: Record<string, any>) => {
  logger.info(`User action: ${action}`, { userId, action }, metadata);
};

export const logError = (error: Error, context?: LogContext, metadata?: Record<string, any>) => {
  logger.error(`Error occurred: ${error.message}`, error, context, metadata);
};

export const logPerformanceMetric = (operation: string, duration: number, metadata?: Record<string, any>) => {
  logger.info(`Performance: ${operation}`, { action: 'performance' }, { ...metadata, duration });
};

export const logSecurity = (event: string, context?: LogContext, metadata?: Record<string, any>) => {
  logger.warn(`Security event: ${event}`, { ...context, action: 'security' }, metadata);
};

// Performance monitoring decorator
export function logPerformance(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const start = performance.now();
    const result = await method.apply(this, args);
    const duration = performance.now() - start;
    
    logPerformanceMetric(`${target.constructor.name}.${propertyName}`, duration);
    
    return result;
  };
}

// Error boundary logging
export const logErrorBoundary = (error: Error, errorInfo: any) => {
  logger.error('React Error Boundary caught error', error, {
    component: 'ErrorBoundary',
    action: 'error_boundary',
  }, {
    errorInfo,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  });
};
