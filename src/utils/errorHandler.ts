/**
 * Error Handler Utility
 * Provides error classification, user-friendly message mapping, and sanitized logging
 * 
 * Requirements: 16.1, 16.2, 16.3, 16.5
 */

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  API = 'API',
  DATA = 'DATA',
  SYSTEM = 'SYSTEM',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Classified error with category and details
 */
export interface ClassifiedError {
  category: ErrorCategory;
  message: string;
  originalError?: Error;
  code?: string;
  statusCode?: number;
  timestamp: Date;
}

/**
 * Error log entry (sanitized for storage)
 */
export interface ErrorLogEntry {
  category: ErrorCategory;
  message: string;
  code?: string;
  statusCode?: number;
  timestamp: Date;
  context?: string;
  platform?: string;
  version?: string;
}

/**
 * Classifies an error into one of the predefined categories
 * 
 * @param error - The error to classify
 * @param context - Optional context about where the error occurred
 * @returns ClassifiedError with category and details
 */
export function classifyError(error: unknown, context?: string): ClassifiedError {
  const timestamp = new Date();
  
  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('dns') ||
      message.includes('offline')
    ) {
      return {
        category: ErrorCategory.NETWORK,
        message: error.message,
        originalError: error,
        timestamp,
      };
    }
    
    // Authentication errors
    if (
      message.includes('token') ||
      message.includes('auth') ||
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      message.includes('401') ||
      message.includes('403') ||
      message.includes('invalid or expired')
    ) {
      return {
        category: ErrorCategory.AUTHENTICATION,
        message: error.message,
        originalError: error,
        timestamp,
      };
    }
    
    // Data errors
    if (
      message.includes('parse') ||
      message.includes('json') ||
      message.includes('invalid data') ||
      message.includes('validation') ||
      message.includes('cache') ||
      message.includes('corrupt')
    ) {
      return {
        category: ErrorCategory.DATA,
        message: error.message,
        originalError: error,
        timestamp,
      };
    }
    
    // System errors
    if (
      message.includes('storage') ||
      message.includes('permission') ||
      message.includes('denied') ||
      message.includes('quota') ||
      message.includes('space')
    ) {
      return {
        category: ErrorCategory.SYSTEM,
        message: error.message,
        originalError: error,
        timestamp,
      };
    }
    
    // API errors (default for errors with status codes or GraphQL errors)
    if (
      message.includes('api') ||
      message.includes('graphql') ||
      message.includes('query') ||
      message.includes('failed to')
    ) {
      return {
        category: ErrorCategory.API,
        message: error.message,
        originalError: error,
        timestamp,
      };
    }
    
    // Unknown error
    return {
      category: ErrorCategory.UNKNOWN,
      message: error.message,
      originalError: error,
      timestamp,
    };
  }
  
  // Handle HTTP response errors
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as any;
    
    if (errorObj.status || errorObj.statusCode) {
      const statusCode = errorObj.status || errorObj.statusCode;
      
      if (statusCode === 401 || statusCode === 403) {
        return {
          category: ErrorCategory.AUTHENTICATION,
          message: errorObj.message || 'Authentication failed',
          statusCode,
          timestamp,
        };
      }
      
      if (statusCode >= 500) {
        return {
          category: ErrorCategory.API,
          message: errorObj.message || 'Server error',
          statusCode,
          timestamp,
        };
      }
      
      if (statusCode >= 400) {
        return {
          category: ErrorCategory.API,
          message: errorObj.message || 'Client error',
          statusCode,
          timestamp,
        };
      }
    }
    
    // GraphQL errors
    if (errorObj.graphQLErrors || errorObj.networkError) {
      if (errorObj.networkError) {
        return {
          category: ErrorCategory.NETWORK,
          message: errorObj.networkError.message || 'Network error',
          timestamp,
        };
      }
      
      return {
        category: ErrorCategory.API,
        message: errorObj.message || 'GraphQL error',
        timestamp,
      };
    }
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return classifyError(new Error(error), context);
  }
  
  // Unknown error type
  return {
    category: ErrorCategory.UNKNOWN,
    message: 'An unknown error occurred',
    timestamp,
  };
}

/**
 * Maps an error to a user-friendly message with actionable guidance
 * 
 * @param classifiedError - The classified error
 * @returns User-friendly error message
 */
export function mapErrorToUserMessage(classifiedError: ClassifiedError): string {
  switch (classifiedError.category) {
    case ErrorCategory.NETWORK:
      return 'Unable to connect to the network. Please check your internet connection and try again.';
    
    case ErrorCategory.AUTHENTICATION:
      if (classifiedError.message.includes('expired')) {
        return 'Your API token has expired. Please log in again with a valid token.';
      }
      if (classifiedError.message.includes('invalid')) {
        return 'Your API token is invalid. Please check your token and try again.';
      }
      if (classifiedError.statusCode === 403) {
        return 'Your API token does not have sufficient permissions. Please check your token permissions in Cloudflare.';
      }
      return 'Authentication failed. Please check your API token and try again.';
    
    case ErrorCategory.API:
      if (classifiedError.statusCode && classifiedError.statusCode >= 500) {
        return 'Cloudflare service is temporarily unavailable. Please try again later.';
      }
      if (classifiedError.message.includes('zone')) {
        return 'The requested zone was not found. Please check your zone selection.';
      }
      if (classifiedError.message.includes('query')) {
        return 'Failed to retrieve data from Cloudflare. Please try again.';
      }
      return 'An error occurred while communicating with Cloudflare. Please try again.';
    
    case ErrorCategory.DATA:
      if (classifiedError.message.includes('cache')) {
        return 'Cached data is corrupted. The app will fetch fresh data.';
      }
      if (classifiedError.message.includes('parse')) {
        return 'Failed to process the data. Please try refreshing.';
      }
      return 'Data validation failed. Please try refreshing the data.';
    
    case ErrorCategory.SYSTEM:
      if (classifiedError.message.includes('storage') || classifiedError.message.includes('space')) {
        return 'Insufficient storage space. Please free up some space and try again.';
      }
      if (classifiedError.message.includes('permission')) {
        return 'Permission denied. Please check app permissions in your device settings.';
      }
      return 'A system error occurred. Please restart the app and try again.';
    
    case ErrorCategory.UNKNOWN:
    default:
      return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }
}

/**
 * Sanitizes sensitive information from error messages and objects
 * Removes API tokens, passwords, and other sensitive data
 * 
 * @param data - The data to sanitize (string or object)
 * @returns Sanitized data
 */
export function sanitizeSensitiveData(data: any): any {
  if (typeof data === 'string') {
    // Remove potential API tokens (typically 40+ character alphanumeric strings)
    let sanitized = data.replace(/\b[A-Za-z0-9_-]{40,}\b/g, '[REDACTED_TOKEN]');
    
    // Remove Bearer tokens
    sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9_-]+/gi, 'Bearer [REDACTED]');
    
    // Remove Authorization headers
    sanitized = sanitized.replace(/Authorization:\s*[^\s,}]+/gi, 'Authorization: [REDACTED]');
    
    // Remove password-like patterns
    sanitized = sanitized.replace(/password["\s:=]+[^\s,}"]+/gi, 'password: [REDACTED]');
    
    // Remove email addresses (optional, but good for privacy)
    sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED_EMAIL]');
    
    return sanitized;
  }
  
  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      return data.map(item => sanitizeSensitiveData(item));
    }
    
    const sanitized: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const lowerKey = key.toLowerCase();
        
        // Redact sensitive keys
        if (
          lowerKey.includes('token') ||
          lowerKey.includes('password') ||
          lowerKey.includes('secret') ||
          lowerKey.includes('key') ||
          lowerKey.includes('auth')
        ) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = sanitizeSensitiveData(data[key]);
        }
      }
    }
    return sanitized;
  }
  
  return data;
}

/**
 * Creates a sanitized error log entry
 * 
 * @param classifiedError - The classified error
 * @param context - Optional context about where the error occurred
 * @param platform - Platform information (iOS/Android)
 * @param version - App version
 * @returns Sanitized error log entry
 */
export function createErrorLog(
  classifiedError: ClassifiedError,
  context?: string,
  platform?: string,
  version?: string
): ErrorLogEntry {
  return {
    category: classifiedError.category,
    message: sanitizeSensitiveData(classifiedError.message),
    code: classifiedError.code,
    statusCode: classifiedError.statusCode,
    timestamp: classifiedError.timestamp,
    context: context ? sanitizeSensitiveData(context) : undefined,
    platform,
    version,
  };
}

/**
 * Logs an error with sanitization
 * In production, this would send to a logging service
 * 
 * @param error - The error to log
 * @param context - Optional context
 * @param platform - Platform information
 * @param version - App version
 */
export function logError(
  error: unknown,
  context?: string,
  platform?: string,
  version?: string
): void {
  const classifiedError = classifyError(error, context);
  const logEntry = createErrorLog(classifiedError, context, platform, version);
  
  // In development, log to console
  if (__DEV__) {
    console.error('[Error Log]', {
      ...logEntry,
      // Include original error in dev for debugging
      originalError: classifiedError.originalError,
    });
  }
  
  // In production, this would send to a logging service like Sentry
  // Example: Sentry.captureException(logEntry);
}

/**
 * Handles an error by classifying it, mapping to user message, and logging
 * This is a convenience function that combines all error handling steps
 * 
 * @param error - The error to handle
 * @param context - Optional context
 * @returns Object with user message and classified error
 */
export function handleError(
  error: unknown,
  context?: string
): {
  userMessage: string;
  classifiedError: ClassifiedError;
} {
  const classifiedError = classifyError(error, context);
  const userMessage = mapErrorToUserMessage(classifiedError);
  
  // Log the error
  logError(error, context);
  
  return {
    userMessage,
    classifiedError,
  };
}

/**
 * Determines if an error should trigger a retry
 * 
 * @param classifiedError - The classified error
 * @returns true if the error is retryable
 */
export function isRetryableError(classifiedError: ClassifiedError): boolean {
  switch (classifiedError.category) {
    case ErrorCategory.NETWORK:
      return true;
    case ErrorCategory.API:
      // Retry on 5xx errors, but not 4xx
      return classifiedError.statusCode ? classifiedError.statusCode >= 500 : true;
    case ErrorCategory.AUTHENTICATION:
    case ErrorCategory.DATA:
    case ErrorCategory.SYSTEM:
    case ErrorCategory.UNKNOWN:
    default:
      return false;
  }
}

/**
 * Calculates retry delay using exponential backoff
 * 
 * @param attemptNumber - The current attempt number (0-indexed)
 * @param baseDelay - Base delay in milliseconds (default: 1000)
 * @returns Delay in milliseconds
 */
export function calculateRetryDelay(attemptNumber: number, baseDelay: number = 1000): number {
  return baseDelay * Math.pow(2, attemptNumber);
}
