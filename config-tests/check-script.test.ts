/**
 * CONSTRAINTS.md › «Dónde corre cada cosa»: `npm run check` = lint + tsc + Jest con cobertura +
 * floor-guard. If a piece is dropped from the script, or lint stops covering the whole project
 * (`expo lint` alone skips scripts/ and config-tests/), this goes red.
 */
import fs from 'node:fs';
import path from 'node:path';

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};
const steps = pkg.scripts.check.split('&&').map((s) => s.trim());

test('check chains every piece with && (one failure fails the whole check)', () => {
  expect(steps).toEqual([
    'npm run floor-guard',
    'npm run typecheck',
    'npm run lint',
    'npm run test:coverage',
  ]);
  expect(pkg.scripts.check).not.toMatch(/;|\|\||--passWithNoTests|exit 0/);
});

test('each piece runs the real tool over the whole project', () => {
  expect(pkg.scripts['floor-guard']).toBe('node scripts/floor-guard.mjs');
  expect(pkg.scripts.typecheck).toBe('tsc --noEmit && tsc --noEmit -p config-tests');
  expect(pkg.scripts.lint).toBe('eslint .');
  expect(pkg.scripts['test:coverage']).toBe('jest --coverage');
});
