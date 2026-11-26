// Jest 30 + jest-expo (https://docs.expo.dev/develop/unit-testing/).
const { domainCoverageThreshold } = require('./jest.domain-coverage');

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/config-tests/fixtures/'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}', '!**/*.d.ts'],
  coverageThreshold: domainCoverageThreshold(__dirname),
};
