import type { Config } from 'jest';

const config: Config = {
  // Use ts-jest for TypeScript
  preset: 'ts-jest',

  // Node runtime (Lambda compatible)
  testEnvironment: 'node',

  // Where Jest looks for tests
  roots: ['<rootDir>/services'],

  // Match test files
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],

  // Transform TypeScript → JavaScript
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },

  // File extensions Jest can resolve
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Coverage (optional but thesis-friendly)
  collectCoverage: true,
  collectCoverageFrom: [
    'services/**/*.ts',
    '!services/**/index.ts'
  ],

  // Ignore build artifacts
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],

  // Clear mocks between tests
  clearMocks: true
};

export default config;
