/**
 * Error Handler Usage Examples
 * Demonstrates how to integrate the error handler into services and components
 */

import {
  handleError,
  classifyError,
  mapErrorToUserMessage,
  isRetryableError,
  calculateRetryDelay,
  ErrorCategory,
} from './errorHandler';

/**
 * Example 1: Basic error handling in a service
 */
export async function fetchDataWithErrorHandling() {
  try {
    const response = await fetch('https://api.example.com/data');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    // Use handleError to get user-friendly message and log the error
    const { userMessage, classifiedError } = handleError(error, 'fetchData');
    
    // Return error info to the caller
    return {
      success: false,
      error: userMessage,
      category: classifiedError.category,
    };
  }
}

/**
 * Example 2: Error handling with retry logic
 */
export async function fetchWithRetry(
  url: string,
  maxRetries: number = 3
): Promise<any> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      const classified = classifyError(error, 'fetchWithRetry');
      
      // Check if error is retryable
      if (!isRetryableError(classified)) {
        // Don't retry authentication or data errors
        const { userMessage } = handleError(error, 'fetchWithRetry');
        throw new Error(userMessage);
      }
      
      // If not the last attempt, wait before retrying
      if (attempt < maxRetries - 1) {
        const delay = calculateRetryDelay(attempt);
        console.log(`Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed
  const { userMessage } = handleError(lastError, 'fetchWithRetry');
  throw new Error(userMessage);
}

/**
 * Example 3: Error handling in React component
 */
export function useDataFetchingExample() {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch data...
      const response = await fetch('https://api.example.com/data');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      // Use handleError to get user-friendly message
      const { userMessage } = handleError(err, 'fetchData');
      setError(userMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return { fetchData, error, loading };
}

/**
 * Example 4: Custom error handling based on category
 */
export async function handleApiCall(apiFunction: () => Promise<any>) {
  try {
    return await apiFunction();
  } catch (error) {
    const classified = classifyError(error, 'apiCall');
    
    switch (classified.category) {
      case ErrorCategory.AUTHENTICATION:
        // Clear token and redirect to login
        console.log('Authentication failed, redirecting to login...');
        // await AuthManager.removeToken();
        // navigation.navigate('Login');
        break;
        
      case ErrorCategory.NETWORK:
        // Try to load from cache
        console.log('Network error, attempting to load from cache...');
        // return await CacheManager.getData(cacheKey);
        break;
        
      case ErrorCategory.DATA:
        // Clear corrupted cache
        console.log('Data error, clearing cache...');
        // await CacheManager.clearCache();
        break;
        
      default:
        // Show generic error message
        const userMessage = mapErrorToUserMessage(classified);
        console.error(userMessage);
    }
    
    throw error;
  }
}

/**
 * Example 5: Logging errors with context
 */
export async function performCriticalOperation(userId: string, data: any) {
  try {
    // Perform operation...
    return { success: true };
  } catch (error) {
    // Log with context (userId will be sanitized if it looks like a token)
    const { userMessage, classifiedError } = handleError(
      error,
      `performCriticalOperation for user ${userId}`
    );
    
    // Show error to user
    console.error(userMessage);
    
    // Additional handling based on error type
    if (classifiedError.category === ErrorCategory.SYSTEM) {
      // System errors might need special attention
      console.error('System error detected, may need manual intervention');
    }
    
    return { success: false, error: userMessage };
  }
}

/**
 * Example 6: Wrapping existing service methods
 */
export class EnhancedGraphQLClient {
  async queryWithErrorHandling(query: string, variables: any) {
    try {
      // Perform GraphQL query...
      const result = await this.executeQuery(query, variables);
      return { success: true, data: result };
    } catch (error) {
      const { userMessage, classifiedError } = handleError(error, 'GraphQL query');
      
      return {
        success: false,
        error: userMessage,
        category: classifiedError.category,
        retryable: isRetryableError(classifiedError),
      };
    }
  }
  
  private async executeQuery(query: string, variables: any): Promise<any> {
    // Actual query implementation
    throw new Error('Not implemented');
  }
}

/**
 * Example 7: Error boundary helper
 */
export function createErrorBoundaryHandler() {
  return (error: Error, errorInfo: any) => {
    const { userMessage, classifiedError } = handleError(
      error,
      `React Error Boundary: ${errorInfo.componentStack}`
    );
    
    // Log to error tracking service
    console.error('Error Boundary caught error:', {
      message: userMessage,
      category: classifiedError.category,
      componentStack: errorInfo.componentStack,
    });
    
    // Could send to Sentry or other error tracking service
    // Sentry.captureException(error, { contexts: { react: errorInfo } });
  };
}

// Note: React import is just for type reference in examples
declare const React: any;
