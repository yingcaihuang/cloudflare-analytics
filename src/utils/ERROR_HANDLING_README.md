# Error Handling System

## Overview

The error handling system provides a comprehensive solution for classifying, mapping, logging, and handling errors throughout the Cloudflare Analytics application. It ensures consistent error handling, user-friendly error messages, and secure logging without exposing sensitive information.

## Features

- **Error Classification**: Automatically categorizes errors into predefined types
- **User-Friendly Messages**: Maps technical errors to actionable user messages
- **Sensitive Data Sanitization**: Removes API tokens, passwords, and other sensitive data from logs
- **Retry Logic**: Determines which errors are retryable and calculates backoff delays
- **Comprehensive Logging**: Logs errors with context while maintaining security

## Error Categories

The system classifies errors into the following categories:

1. **NETWORK**: Connection issues, timeouts, DNS failures
2. **AUTHENTICATION**: Invalid/expired tokens, permission issues
3. **API**: GraphQL errors, server errors, API failures
4. **DATA**: Parse errors, validation failures, corrupted cache
5. **SYSTEM**: Storage issues, permission denials, system-level errors
6. **UNKNOWN**: Unclassified errors

## Core Functions

### `classifyError(error, context?)`

Classifies an error into one of the predefined categories.

```typescript
import { classifyError } from './utils/errorHandler';

const error = new Error('Network request failed');
const classified = classifyError(error, 'fetchData');

console.log(classified.category); // ErrorCategory.NETWORK
console.log(classified.message); // 'Network request failed'
console.log(classified.timestamp); // Date object
```

### `mapErrorToUserMessage(classifiedError)`

Converts a classified error into a user-friendly message with actionable guidance.

```typescript
import { classifyError, mapErrorToUserMessage } from './utils/errorHandler';

const error = new Error('Token is invalid or expired');
const classified = classifyError(error);
const userMessage = mapErrorToUserMessage(classified);

console.log(userMessage);
// "Your API token has expired. Please log in again with a valid token."
```

### `handleError(error, context?)`

Convenience function that classifies, maps, and logs an error in one call.

```typescript
import { handleError } from './utils/errorHandler';

try {
  await fetchData();
} catch (error) {
  const { userMessage, classifiedError } = handleError(error, 'fetchData');
  
  // Show userMessage to the user
  setError(userMessage);
  
  // Use classifiedError for additional logic
  if (classifiedError.category === ErrorCategory.AUTHENTICATION) {
    // Redirect to login
  }
}
```

### `sanitizeSensitiveData(data)`

Removes sensitive information from strings or objects.

```typescript
import { sanitizeSensitiveData } from './utils/errorHandler';

const message = 'Failed with token: abc123def456ghi789jkl012mno345pqr678';
const sanitized = sanitizeSensitiveData(message);

console.log(sanitized);
// "Failed with token: [REDACTED_TOKEN]"
```

### `isRetryableError(classifiedError)`

Determines if an error should trigger a retry.

```typescript
import { classifyError, isRetryableError } from './utils/errorHandler';

const error = new Error('Network timeout');
const classified = classifyError(error);

if (isRetryableError(classified)) {
  // Retry the operation
}
```

### `calculateRetryDelay(attemptNumber, baseDelay?)`

Calculates exponential backoff delay for retries.

```typescript
import { calculateRetryDelay } from './utils/errorHandler';

const delay1 = calculateRetryDelay(0); // 1000ms (1s)
const delay2 = calculateRetryDelay(1); // 2000ms (2s)
const delay3 = calculateRetryDelay(2); // 4000ms (4s)
```

## Usage Examples

### Basic Error Handling in Services

```typescript
import { handleError } from './utils/errorHandler';

async function fetchTrafficMetrics(params) {
  try {
    const data = await GraphQLClient.queryTrafficMetrics(params);
    return { success: true, data };
  } catch (error) {
    const { userMessage, classifiedError } = handleError(error, 'fetchTrafficMetrics');
    return { success: false, error: userMessage };
  }
}
```

### Error Handling with Retry Logic

```typescript
import { classifyError, isRetryableError, calculateRetryDelay, handleError } from './utils/errorHandler';

async function fetchWithRetry(url, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      lastError = error;
      const classified = classifyError(error);
      
      if (!isRetryableError(classified)) {
        throw error; // Don't retry
      }
      
      if (attempt < maxRetries - 1) {
        const delay = calculateRetryDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  const { userMessage } = handleError(lastError);
  throw new Error(userMessage);
}
```

### Error Handling in React Hooks

```typescript
import { useState } from 'react';
import { handleError } from './utils/errorHandler';

function useDataFetching() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiCall();
      return data;
    } catch (err) {
      const { userMessage } = handleError(err, 'fetchData');
      setError(userMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return { fetchData, error, loading };
}
```

### Category-Specific Error Handling

```typescript
import { classifyError, mapErrorToUserMessage, ErrorCategory } from './utils/errorHandler';

async function handleApiCall(apiFunction) {
  try {
    return await apiFunction();
  } catch (error) {
    const classified = classifyError(error);
    
    switch (classified.category) {
      case ErrorCategory.AUTHENTICATION:
        // Clear token and redirect to login
        await AuthManager.removeToken();
        navigation.navigate('Login');
        break;
        
      case ErrorCategory.NETWORK:
        // Try to load from cache
        return await CacheManager.getData(cacheKey);
        
      case ErrorCategory.DATA:
        // Clear corrupted cache
        await CacheManager.clearCache();
        break;
        
      default:
        const userMessage = mapErrorToUserMessage(classified);
        showErrorToast(userMessage);
    }
  }
}
```

## Security Considerations

### Sensitive Data Sanitization

The error handler automatically sanitizes:

- API tokens (40+ character alphanumeric strings)
- Bearer tokens
- Authorization headers
- Passwords
- Email addresses
- Any object keys containing: token, password, secret, key, auth

### Logging Best Practices

1. **Never log raw errors in production** - Always use `handleError()` or `logError()`
2. **Include context** - Provide context about where the error occurred
3. **Use sanitization** - All logged data is automatically sanitized
4. **Platform info** - Include platform and version for debugging

```typescript
import { logError } from './utils/errorHandler';

try {
  await criticalOperation();
} catch (error) {
  logError(error, 'criticalOperation', Platform.OS, appVersion);
}
```

## Error Message Mapping

The system provides specific user-friendly messages for common scenarios:

| Error Type | User Message |
|------------|--------------|
| Network error | "Unable to connect to the network. Please check your internet connection and try again." |
| Invalid token | "Your API token is invalid. Please check your token and try again." |
| Expired token | "Your API token has expired. Please log in again with a valid token." |
| Insufficient permissions | "Your API token does not have sufficient permissions. Please check your token permissions in Cloudflare." |
| Server error (5xx) | "Cloudflare service is temporarily unavailable. Please try again later." |
| Zone not found | "The requested zone was not found. Please check your zone selection." |
| Corrupted cache | "Cached data is corrupted. The app will fetch fresh data." |
| Storage full | "Insufficient storage space. Please free up some space and try again." |
| Permission denied | "Permission denied. Please check app permissions in your device settings." |

## Retry Strategy

### Retryable Errors

- Network errors (always retryable)
- API errors with 5xx status codes

### Non-Retryable Errors

- Authentication errors (401, 403)
- Data validation errors
- System errors (storage, permissions)
- Unknown errors

### Retry Configuration

Default retry strategy:
- Maximum retries: 3
- Base delay: 1000ms (1 second)
- Backoff: Exponential (1s, 2s, 4s)

## Integration with Existing Services

### AuthManager

```typescript
import { handleError, ErrorCategory } from './utils/errorHandler';

async validateToken(token: string) {
  try {
    const response = await fetch('https://api.cloudflare.com/client/v4/zones', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return { valid: true, zones: await response.json() };
  } catch (error) {
    const { userMessage, classifiedError } = handleError(error, 'validateToken');
    return { valid: false, error: userMessage };
  }
}
```

### GraphQLClient

```typescript
import { handleError, isRetryableError, calculateRetryDelay } from './utils/errorHandler';

async queryWithRetry(query, variables, maxRetries = 2) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await this.client.query({ query, variables });
    } catch (error) {
      lastError = error;
      const classified = classifyError(error);
      
      if (!isRetryableError(classified) || attempt === maxRetries) {
        break;
      }
      
      await new Promise(resolve => 
        setTimeout(resolve, calculateRetryDelay(attempt))
      );
    }
  }
  
  const { userMessage } = handleError(lastError, 'GraphQL query');
  throw new Error(userMessage);
}
```

## Testing

The error handler includes comprehensive unit tests covering:

- Error classification for all categories
- User message mapping
- Sensitive data sanitization
- Retry logic
- Edge cases and error conditions

Run tests with:
```bash
npm test -- errorHandler.test.ts
```

## Requirements Satisfied

This implementation satisfies the following requirements:

- **16.1**: Error classification and specific error reason display
- **16.2**: Token permission error detection and messaging
- **16.3**: Network error detection and messaging
- **16.5**: Error logging without sensitive information

## Future Enhancements

- Integration with error tracking services (Sentry, Bugsnag)
- Custom error categories for domain-specific errors
- Error analytics and reporting
- Localization of error messages
- Error recovery suggestions based on error patterns
