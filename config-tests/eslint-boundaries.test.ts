/**
 * CONSTRAINTS.md §2 «Arquitectura» and ADR 0006: module boundaries and domain purity.
 * config-tests/fixtures/boundaries is a tiny project linted with the REAL eslint.config.js.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = path.join(__dirname, '..');
const fixture = path.join(__dirname, 'fixtures', 'boundaries');
const eslintBin = path.join(root, 'node_modules', 'eslint', 'bin', 'eslint.js');

type LintMessage = { ruleId: string | null; severity: number; message: string };
type LintResult = { filePath: string; messages: LintMessage[] };

let results: Map<string, LintMessage[]>;

beforeAll(() => {
  const run = spawnSync(process.execPath, [eslintBin, '--format', 'json', '.'], {
    cwd: fixture,
    encoding: 'utf8',
  });
  if (run.status === 2) {
    throw new Error(`ESLint crashed: ${run.stderr}`);
  }
  const parsed = JSON.parse(run.stdout) as LintResult[];
  results = new Map(
    parsed.map((r) => [path.relative(fixture, r.filePath).split(path.sep).join('/'), r.messages]),
  );
});

function errorRules(file: string) {
  const messages = results.get(file);
  if (messages === undefined) {
    throw new Error(`ESLint did not lint ${file}`);
  }
  return messages.filter((m) => m.severity === 2).map((m) => m.ruleId);
}

jest.setTimeout(120_000);

test.each([
  ['src/modules/weather/data/importsForbiddenModule.ts', 'boundaries/dependencies'],
  ['src/modules/weather/data/importsForbiddenModuleAlias.ts', 'boundaries/dependencies'],
  ['src/modules/laundry/data/importsInternalFile.ts', 'boundaries/dependencies'],
  ['src/modules/laundry/data/importsInternalFileAlias.ts', 'boundaries/dependencies'],
  ['app/importsInternalFile.tsx', 'boundaries/dependencies'],
  ['src/modules/wardrobe/domain/importsReact.ts', 'no-restricted-imports'],
  ['src/modules/wardrobe/domain/importsExpo.ts', 'no-restricted-imports'],
  ['src/modules/wardrobe/domain/importsUi.ts', 'no-restricted-imports'],
  ['src/modules/wardrobe/domain/importsData.ts', 'no-restricted-imports'],
  ['src/utils/unknownFile.ts', 'boundaries/no-unknown-files'],
])('%s fails with %s', (file, ruleId) => {
  expect(errorRules(file)).toContain(ruleId);
});

test.each([
  'src/modules/laundry/data/cleanAllowedImports.ts',
  'src/modules/wardrobe/ui/cleanSameModule.ts',
  'app/cleanRoute.tsx',
  'src/modules/wardrobe/index.ts',
  'src/modules/wardrobe/domain/garment.ts',
])('%s passes', (file) => {
  expect(errorRules(file)).toEqual([]);
});
