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

// Configure fast-check for property-based testing
// Set default number of runs for property tests
if (typeof global.fc !== 'undefined') {
  global.fc.configureGlobal({
    numRuns: 100, // Run each property test 100 times by default
    verbose: false,
  });
}
