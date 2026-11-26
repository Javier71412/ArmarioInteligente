// Domain coverage bar from CONSTRAINTS.md §2 («Cobertura de dominio»).
// Do not lower these numbers to make a change pass.
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

module.exports = { domainCoverageThreshold };
