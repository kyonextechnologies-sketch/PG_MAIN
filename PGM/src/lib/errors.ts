/**
 * Error Handling System
 * 
 * Industry-level error handling with proper error codes,
 * logging, and user-friendly messages
 */

export enum ErrorCode {
  // Authentication Errors
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Validation Errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Business Logic Errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  
  // System Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  
  // Electricity Specific Errors
  ELECTRICITY_SETTINGS_NOT_FOUND = 'ELECTRICITY_SETTINGS_NOT_FOUND',
  INVALID_METER_READING = 'INVALID_METER_READING',
  OCR_PROCESSING_FAILED = 'OCR_PROCESSING_FAILED',
  BILL_CALCULATION_FAILED = 'BILL_CALCULATION_FAILED',
}

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  stack?: string;
  userId?: string;
  requestId?: string;
}

export class CustomError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, any>;
  public readonly timestamp: string;
  public readonly userId?: string;
  public readonly requestId?: string;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, any>,
    userId?: string,
    requestId?: string
  ) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.userId = userId;
    this.requestId = requestId;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
  }

  toJSON(): AppError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
      userId: this.userId,
      requestId: this.requestId,
    };
  }
}

/**
 * Error factory for creating standardized errors
 */
export class ErrorFactory {
  static authentication(message: string, details?: Record<string, any>): CustomError {
    return new CustomError(ErrorCode.AUTHENTICATION_FAILED, message, details);
  }

  static unauthorized(message: string = 'Unauthorized access', details?: Record<string, any>): CustomError {
    return new CustomError(ErrorCode.UNAUTHORIZED_ACCESS, message, details);
  }

  static validation(message: string, details?: Record<string, any>): CustomError {
    return new CustomError(ErrorCode.VALIDATION_FAILED, message, details);
  }

  static notFound(resource: string, details?: Record<string, any>): CustomError {
    return new CustomError(ErrorCode.RESOURCE_NOT_FOUND, `${resource} not found`, details);
  }

  static internal(message: string = 'Internal server error', details?: Record<string, any>): CustomError {
    return new CustomError(ErrorCode.INTERNAL_SERVER_ERROR, message, details);
  }

  static electricity(message: string, details?: Record<string, any>): CustomError {
    return new CustomError(ErrorCode.ELECTRICITY_SETTINGS_NOT_FOUND, message, details);
  }
}

/**
 * Error handler for consistent error processing
 */
export class ErrorHandler {
  /**
   * Handle and log errors consistently
   */
  static handle(error: unknown, context?: string): AppError {
    let appError: AppError;

    if (error instanceof CustomError) {
      appError = error.toJSON();
    } else if (error instanceof Error) {
      appError = {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: error.message,
        timestamp: new Date().toISOString(),
        stack: error.stack,
      };
    } else {
      appError = {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      };
    }

    // Log error
    this.logError(appError, context);

    return appError;
  }

  /**
   * Log error with appropriate level
   */
  private static logError(error: AppError, context?: string): void {
    const logMessage = {
      ...error,
      context,
      level: this.getLogLevel(error.code),
    };

    if (process.env.NODE_ENV === 'development') {
      console.error(`[${error.code}] ${error.message}`, logMessage);
    } else {
      // In production, send to logging service
      this.sendToLoggingService(logMessage);
    }
  }

  /**
   * Determine log level based on error code
   */
  private static getLogLevel(code: ErrorCode): 'error' | 'warn' | 'info' {
    switch (code) {
      case ErrorCode.INTERNAL_SERVER_ERROR:
      case ErrorCode.DATABASE_ERROR:
      case ErrorCode.NETWORK_ERROR:
        return 'error';
      case ErrorCode.AUTHENTICATION_FAILED:
      case ErrorCode.UNAUTHORIZED_ACCESS:
        return 'warn';
      default:
        return 'info';
    }
  }

  /**
   * Send error to logging service (implement based on your logging solution)
   */
  private static sendToLoggingService(logMessage: any): void {
    // Implement integration with logging service (e.g., Sentry, LogRocket, etc.)
    console.error('Production Error:', logMessage);
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: AppError): string {
    switch (error.code) {
      case ErrorCode.AUTHENTICATION_FAILED:
        return 'Please log in to continue';
      case ErrorCode.UNAUTHORIZED_ACCESS:
        return 'You do not have permission to perform this action';
      case ErrorCode.VALIDATION_FAILED:
        return 'Please check your input and try again';
      case ErrorCode.RESOURCE_NOT_FOUND:
        return 'The requested resource was not found';
      case ErrorCode.INVALID_METER_READING:
        return 'Please provide valid meter readings';
      case ErrorCode.OCR_PROCESSING_FAILED:
        return 'Failed to process meter reading image. Please try again';
      default:
        return 'Something went wrong. Please try again later';
    }
  }
}

/**
 * Async error wrapper for better error handling
 */
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      throw ErrorHandler.handle(error, fn.name);
    }
  };
}

/**
 * Validation error helper
 */
export function createValidationError(
  field: string,
  message: string,
  value?: any
): CustomError {
  return ErrorFactory.validation(`Validation failed for ${field}: ${message}`, {
    field,
    value,
  });
}

