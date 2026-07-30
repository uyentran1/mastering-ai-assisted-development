/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Both roots on purpose: restricting the crawl to tests/ makes jest skip
  // untested src files entirely, which silently inflates the coverage report.
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  collectCoverageFrom: ['src/refactored/**/*.ts'],
};
