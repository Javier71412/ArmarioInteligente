/**
 * CONSTRAINTS.md §0 «Suelo»: every trap file in eslint-fixtures/ must fail with its rule,
 * the clean files must pass, inline disables have no effect, and a broken config fails.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = path.join(__dirname, '..');
const eslintBin = path.join(root, 'node_modules', 'eslint', 'bin', 'eslint.js');

type LintMessage = { ruleId: string | null; severity: number; message: string };
type LintResult = { filePath: string; messages: LintMessage[] };

function runEslint(args: string[]) {
  const result = spawnSync(process.execPath, [eslintBin, ...args], { cwd: root, encoding: 'utf8' });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

let results: Map<string, LintMessage[]>;

beforeAll(() => {
  const { stdout } = runEslint(['--no-ignore', '--format', 'json', 'eslint-fixtures']);
  const parsed = JSON.parse(stdout) as LintResult[];
  results = new Map(parsed.map((r) => [path.basename(r.filePath), r.messages]));
});

function errorsOf(file: string) {
  const messages = results.get(file);
  if (messages === undefined) {
    throw new Error(`ESLint did not lint ${file}`);
  }
  return messages.filter((m) => m.severity === 2);
}

jest.setTimeout(120_000);

test.each([
  ['ts-ignore.ts', '@typescript-eslint/ban-ts-comment'],
  ['ts-nocheck.ts', '@typescript-eslint/ban-ts-comment'],
  ['ts-expect-error-no-description.ts', '@typescript-eslint/ban-ts-comment'],
  ['explicit-any.ts', '@typescript-eslint/no-explicit-any'],
  ['empty-catch.ts', 'no-empty'],
  ['inline-disable.ts', '@typescript-eslint/no-explicit-any'],
  ['inline-disable-file.ts', '@typescript-eslint/no-explicit-any'],
])('%s fails with %s', (file, ruleId) => {
  expect(errorsOf(file).map((m) => m.ruleId)).toContain(ruleId);
});

test.each(['clean.ts', 'ts-expect-error-with-description.ts'])('%s passes', (file) => {
  expect(errorsOf(file)).toEqual([]);
});

test('the project itself lints clean (fixtures are ignored)', () => {
  const { status, stdout, stderr } = runEslint(['.']);
  expect(`${stdout}${stderr}`).toBe('');
  expect(status).toBe(0);
});

test('a broken ESLint config exits with 2', () => {
  const { status, stderr } = runEslint([
    '--config',
    'config-tests/fixtures/eslint/broken.config.js',
    'eslint-fixtures/clean.ts',
  ]);
  expect(stderr).toMatch(/broken eslint config fixture/);
  expect(status).toBe(2);
});
