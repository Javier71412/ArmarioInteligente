/**
 * CONSTRAINTS.md §2 «Cobertura de dominio»: proves the threshold really blocks.
 * Each fixture is a tiny Jest project that reuses the real thresholds from jest.domain-coverage.js.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const fixtures = path.join(__dirname, 'fixtures', 'coverage');
const jestBin = require.resolve('jest/bin/jest');

function runFixture(name: string) {
  const result = spawnSync(
    process.execPath,
    [jestBin, '--config', path.join(fixtures, name, 'jest.config.js'), '--ci'],
    {
      encoding: 'utf8',
    },
  );
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

jest.setTimeout(120_000);

test('fails when a domain file is below the coverage threshold', () => {
  const { status, output } = runFixture('uncovered');
  expect(status).toBe(1);
  expect(output).toMatch(/Coverage for lines \(0%\) does not meet/);
  expect(output).toMatch(/Coverage for branches \(0%\) does not meet/);
});

test('passes when the domain file is fully tested', () => {
  const { status, output } = runFixture('covered');
  expect(output).not.toMatch(/does not meet|was not found/);
  expect(status).toBe(0);
});

test('passes while the domain has no files yet', () => {
  const { status, output } = runFixture('empty-domain');
  expect(output).not.toMatch(/does not meet|was not found/);
  expect(status).toBe(0);
});

test('fails when the Jest config itself is broken', () => {
  const { status, output } = runFixture('broken');
  expect(status).not.toBe(0);
  expect(output).toMatch(/broken jest config fixture/);
});
