// Jest 30 + jest-expo (https://docs.expo.dev/develop/unit-testing/).
// Coverage thresholds come from CONSTRAINTS.md §2 («Cobertura de dominio»).
// Do not lower them to make a change pass.
const fs = require('node:fs');
const path = require('node:path');

const DOMAIN_GLOB = 'src/modules/*/domain/**/*.{ts,tsx}';

/**
 * Per-file thresholds for pure domain logic under `rootDir`.
 *
 * Two Jest 30 behaviours (read in @jest/reporters, 2026-11-26) shape this:
 * - a glob key is resolved against the process cwd, not `rootDir`, so the key is made absolute;
 * - a glob that matches no file makes Jest fail ("Coverage data ... was not found"), so the
 *   key is only added once the domain has files. config-tests/jest-coverage.test.ts proves both.
 */
function domainCoverageThreshold(rootDir) {
  const files = fs
    .globSync(DOMAIN_GLOB, { cwd: rootDir })
    .filter((file) => !/\.test\.tsx?$/.test(file));
  if (files.length === 0) {
    return {};
  }
  return { [path.join(rootDir, DOMAIN_GLOB)]: { lines: 90, branches: 85 } };
}

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/config-tests/fixtures/'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}', '!**/*.d.ts'],
  coverageThreshold: domainCoverageThreshold(__dirname),
};

module.exports.domainCoverageThreshold = domainCoverageThreshold;
