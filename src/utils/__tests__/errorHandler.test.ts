/**
 * Error Handler Unit Tests
 * Tests for error classification, message mapping, and sanitization
 */

import {
  classifyError,
  mapErrorToUserMessage,
  sanitizeSensitiveData,
  createErrorLog,
  handleError,
  isRetryableError,
  calculateRetryDelay,
  ErrorCategory,
} from '../errorHandler';

describe('errorHandler', () => {
  describe('classifyError', () => {
    it('should classify network errors correctly', () => {
      const error = new Error('Network request failed');
      const classified = classifyError(error);
      
      expect(classified.category).toBe(ErrorCategory.NETWORK);
      expect(classified.message).toBe('Network request failed');
      expect(classified.originalError).toBe(error);
    });

    it('should classify authentication errors correctly', () => {
      const error = new Error('Token is invalid or expired');
      const classified = classifyError(error);
      
      expect(classified.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(classified.message).toContain('invalid or expired');
    });

    it('should classify 401 status as authentication error', () => {
      const error = { status: 401, message: 'Unauthorized' };
      const classified = classifyError(error);
      
      expect(classified.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(classified.statusCode).toBe(401);
    });

    it('should classify 403 status as authentication error', () => {
      const error = { statusCode: 403, message: 'Forbidden' };
      const classified = classifyError(error);
      
      expect(classified.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(classified.statusCode).toBe(403);
    });

    it('should classify API errors correctly', () => {
      const error = new Error('Failed to query traffic metrics');
      const classified = classifyError(error);
      
      expect(classified.category).toBe(ErrorCategory.API);
    });

    it('should classify 5xx status as API error', () => {
      const error = { status: 500, message: 'Internal Server Error' };
      const classified = classifyError(error);
      
      expect(classified.category).toBe(ErrorCategory.API);
      expect(classified.statusCode).toBe(500);
    });

    it('should classify data errors correctly', () => {
      const error = new Error('Failed to parse JSON data');
      const classified = classifyError(error);
      
      expect(classified.category).toBe(ErrorCategory.DATA);
    });

    it('should classify system errors correctly', () => {
      const error = new Error('Storage permission denied');
      const classified = classifyError(error);
      
      expect(classified.category).toBe(ErrorCategory.SYSTEM);
    });

    it('should classify unknown errors', () => {
      const error = new Error('Something went wrong');
      const classified = classifyError(error);
      
      expect(classified.category).toBe(ErrorCategory.UNKNOWN);
    });

    it('should handle string errors', () => {
      const classified = classifyError('Network timeout');
      
      expect(classified.category).toBe(ErrorCategory.NETWORK);
      expect(classified.message).toBe('Network timeout');
    });

    it('should handle GraphQL errors', () => {
      const error = {
        graphQLErrors: [{ message: 'Query failed' }],
        message: 'GraphQL error',
      };
      const classified = classifyError(error);
      
      expect(classified.category).toBe(ErrorCategory.API);
    });

    it('should include timestamp', () => {
      const before = new Date();
      const classified = classifyError(new Error('Test'));
      const after = new Date();
      
      expect(classified.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(classified.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('mapErrorToUserMessage', () => {
    it('should map network errors to user-friendly message', () => {
      const classified = classifyError(new Error('Network request failed'));
      const message = mapErrorToUserMessage(classified);
      
      expect(message).toContain('network');
      expect(message).toContain('internet connection');
    });

    it('should map authentication errors to user-friendly message', () => {
      const classified = classifyError(new Error('Token is invalid'));
      const message = mapErrorToUserMessage(classified);
      
      expect(message).toContain('token');
      expect(message).toContain('invalid');
    });

    it('should map expired token errors specifically', () => {
      const classified = classifyError(new Error('Token has expired'));
      const message = mapErrorToUserMessage(classified);
      
      expect(message).toContain('expired');
      expect(message).toContain('log in again');
    });

    it('should map 403 errors to permission message', () => {
      const classified = classifyError({ statusCode: 403, message: 'Forbidden' });
      const message = mapErrorToUserMessage(classified);
      
      expect(message).toContain('permissions');
      expect(message).toContain('Cloudflare');
    });

    it('should map 5xx API errors to service unavailable message', () => {
      const classified = classifyError({ status: 500, message: 'Server error' });
      const message = mapErrorToUserMessage(classified);
      
      expect(message).toContain('temporarily unavailable');
      expect(message).toContain('try again later');
    });

    it('should map zone errors specifically', () => {
      const classified = classifyError(new Error('Failed to fetch zone data'));
      const message = mapErrorToUserMessage(classified);
      
      expect(message).toContain('zone');
    });

    it('should map cache data errors', () => {
      const classified = classifyError(new Error('Cache data is corrupted'));
      const message = mapErrorToUserMessage(classified);
      
      expect(message).toContain('cache');
      expect(message).toContain('corrupted');
    });

    it('should map storage errors', () => {
      const classified = classifyError(new Error('Insufficient storage space'));
      const message = mapErrorToUserMessage(classified);
      
      expect(message).toContain('storage');
      expect(message).toContain('free up');
    });

    it('should map permission errors', () => {
      const classified = classifyError(new Error('Permission denied'));
      const message = mapErrorToUserMessage(classified);
      
      expect(message).toContain('Permission');
      expect(message).toContain('settings');
    });

    it('should provide generic message for unknown errors', () => {
      const classified = classifyError(new Error('Random error'));
      const message = mapErrorToUserMessage(classified);
      
      expect(message).toContain('unexpected error');
      expect(message).toContain('try again');
    });

    it('should return different messages for different error types', () => {
      const networkError = classifyError(new Error('Network failed'));
      const authError = classifyError(new Error('Token invalid'));
      
      const networkMessage = mapErrorToUserMessage(networkError);
      const authMessage = mapErrorToUserMessage(authError);
      
      expect(networkMessage).not.toBe(authMessage);
    });
  });

  describe('sanitizeSensitiveData', () => {
    it('should redact API tokens from strings', () => {
      const data = 'Token: abc123def456ghi789jkl012mno345pqr678stu901vwx234yz';
      const sanitized = sanitizeSensitiveData(data);
      
      expect(sanitized).not.toContain('abc123def456');
      expect(sanitized).toContain('[REDACTED_TOKEN]');
    });

    it('should redact Bearer tokens', () => {
      const data = 'Authorization: Bearer abc123def456ghi789jkl012mno345pqr678';
      const sanitized = sanitizeSensitiveData(data);
      
      expect(sanitized).toContain('Bearer [REDACTED]');
      expect(sanitized).not.toContain('abc123def456');
    });

    it('should redact Authorization headers', () => {
      const data = 'Authorization: abc123def456ghi789';
      const sanitized = sanitizeSensitiveData(data);
      
      expect(sanitized).toContain('[REDACTED]');
      expect(sanitized).not.toContain('abc123def456');
    });

    it('should redact passwords', () => {
      const data = 'password: mySecretPassword123';
      const sanitized = sanitizeSensitiveData(data);
      
      expect(sanitized).toContain('[REDACTED]');
      expect(sanitized).not.toContain('mySecretPassword123');
    });

    it('should redact email addresses', () => {
      const data = 'User email: user@example.com';
      const sanitized = sanitizeSensitiveData(data);
      
      expect(sanitized).toContain('[REDACTED_EMAIL]');
      expect(sanitized).not.toContain('user@example.com');
    });

    it('should redact sensitive keys in objects', () => {
      const data = {
        username: 'john',
        token: 'abc123def456',
        password: 'secret',
        apiKey: 'key123',
      };
      const sanitized = sanitizeSensitiveData(data);
      
      expect(sanitized.username).toBe('john');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.apiKey).toBe('[REDACTED]');
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          name: 'John',
          credentials: {
            token: 'abc123',
            secret: 'xyz789',
          },
        },
      };
      const sanitized = sanitizeSensitiveData(data);
      
      expect(sanitized.user.name).toBe('John');
      expect(sanitized.user.credentials.token).toBe('[REDACTED]');
      expect(sanitized.user.credentials.secret).toBe('[REDACTED]');
    });

    it('should handle arrays', () => {
      const data = ['public', 'token:abc123', 'password:secret'];
      const sanitized = sanitizeSensitiveData(data);
      
      expect(sanitized[0]).toBe('public');
      expect(sanitized[1]).toContain('[REDACTED]');
      expect(sanitized[2]).toContain('[REDACTED]');
    });

    it('should not modify non-sensitive data', () => {
      const data = 'This is a normal message without sensitive info';
      const sanitized = sanitizeSensitiveData(data);
      
      expect(sanitized).toBe(data);
    });

    it('should handle null and undefined', () => {
      expect(sanitizeSensitiveData(null)).toBe(null);
      expect(sanitizeSensitiveData(undefined)).toBe(undefined);
    });

    it('should handle numbers and booleans', () => {
      expect(sanitizeSensitiveData(123)).toBe(123);
      expect(sanitizeSensitiveData(true)).toBe(true);
    });
  });

  describe('createErrorLog', () => {
    it('should create sanitized error log entry', () => {
      const error = new Error('Token abc123def456ghi789jkl012mno345pqr678 is invalid');
      const classified = classifyError(error);
      const log = createErrorLog(classified, 'login', 'iOS', '1.0.0');
      
      expect(log.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(log.message).not.toContain('abc123def456');
      expect(log.message).toContain('[REDACTED_TOKEN]');
      expect(log.context).toBe('login');
      expect(log.platform).toBe('iOS');
      expect(log.version).toBe('1.0.0');
      expect(log.timestamp).toBeDefined();
    });

    it('should include status code if present', () => {
      const error = { status: 401, message: 'Unauthorized' };
      const classified = classifyError(error);
      const log = createErrorLog(classified);
      
      expect(log.statusCode).toBe(401);
    });

    it('should sanitize context', () => {
      const error = new Error('API error');
      const classified = classifyError(error);
      const log = createErrorLog(
        classified,
        'Calling API with token abc123def456ghi789jkl012mno345pqr678'
      );
      
      expect(log.context).not.toContain('abc123def456');
      expect(log.context).toContain('[REDACTED_TOKEN]');
    });

    it('should handle optional parameters', () => {
      const error = new Error('Test error');
      const classified = classifyError(error);
      const log = createErrorLog(classified);
      
      expect(log.context).toBeUndefined();
      expect(log.platform).toBeUndefined();
      expect(log.version).toBeUndefined();
    });
  });

  describe('handleError', () => {
    it('should return user message and classified error', () => {
      const error = new Error('Network request failed');
      const result = handleError(error, 'fetchData');
      
      expect(result.userMessage).toBeDefined();
      expect(result.classifiedError).toBeDefined();
      expect(result.classifiedError.category).toBe(ErrorCategory.NETWORK);
      expect(result.userMessage).toContain('network');
    });

    it('should handle different error types', () => {
      const networkError = handleError(new Error('Network failed'));
      const authError = handleError(new Error('Token invalid'));
      
      expect(networkError.classifiedError.category).toBe(ErrorCategory.NETWORK);
      expect(authError.classifiedError.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(networkError.userMessage).not.toBe(authError.userMessage);
    });
  });

  describe('isRetryableError', () => {
    it('should mark network errors as retryable', () => {
      const error = classifyError(new Error('Network timeout'));
      expect(isRetryableError(error)).toBe(true);
    });

    it('should mark 5xx API errors as retryable', () => {
      const error = classifyError({ status: 500, message: 'Server error' });
      expect(isRetryableError(error)).toBe(true);
    });

    it('should not mark 4xx API errors as retryable', () => {
      const error = classifyError({ status: 404, message: 'Not found' });
      expect(isRetryableError(error)).toBe(false);
    });

    it('should not mark authentication errors as retryable', () => {
      const error = classifyError(new Error('Token invalid'));
      expect(isRetryableError(error)).toBe(false);
    });

    it('should not mark data errors as retryable', () => {
      const error = classifyError(new Error('Parse error'));
      expect(isRetryableError(error)).toBe(false);
    });

    it('should not mark system errors as retryable', () => {
      const error = classifyError(new Error('Storage full'));
      expect(isRetryableError(error)).toBe(false);
    });

    it('should not mark unknown errors as retryable', () => {
      const error = classifyError(new Error('Random error'));
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('calculateRetryDelay', () => {
    it('should calculate exponential backoff correctly', () => {
      expect(calculateRetryDelay(0)).toBe(1000); // 1s
      expect(calculateRetryDelay(1)).toBe(2000); // 2s
      expect(calculateRetryDelay(2)).toBe(4000); // 4s
      expect(calculateRetryDelay(3)).toBe(8000); // 8s
    });

    it('should use custom base delay', () => {
      expect(calculateRetryDelay(0, 500)).toBe(500);
      expect(calculateRetryDelay(1, 500)).toBe(1000);
      expect(calculateRetryDelay(2, 500)).toBe(2000);
    });

    it('should handle attempt 0', () => {
      expect(calculateRetryDelay(0)).toBe(1000);
    });
  });
});
