// Jest setup file
// Add any global test setup here

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Suppress console.log in tests
  log: jest.fn(),
  // Keep error and warn for debugging
  error: console.error,
  warn: console.warn,
};
