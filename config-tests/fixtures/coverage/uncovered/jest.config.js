// Fixture project: reuses the REAL domain thresholds from jest.domain-coverage.js.
const { domainCoverageThreshold } = require('../../../../jest.domain-coverage');

/** @type {import('jest').Config} */
module.exports = {
  rootDir: __dirname,
  preset: 'jest-expo',
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts'],
  coverageReporters: ['text-summary'],
  coverageDirectory: '<rootDir>/../../../../coverage/fixtures',
  coverageThreshold: domainCoverageThreshold(__dirname),
};
