/**
 * Jest Configuration - Coverage Report Enhancement
 * Generates detailed HTML and LCOV coverage reports
 */

module.exports = {
  // ... existing config ...
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/renderer/**', // Exclude React components from coverage
    '!src/preload.js',
    '!src/main/index.ts', // Entry point
    'src/main/services/**',
    'src/shared/**',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
  ],
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
    'json-summary',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/main/services/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
}
