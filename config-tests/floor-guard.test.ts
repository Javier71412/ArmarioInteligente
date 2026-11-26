/**
 * CONSTRAINTS.md §0 «Suelo» and §1 «TDD con agentes separados»: scripts/floor-guard.mjs.
 * Each rule gets a throwaway git repo with a violation made on purpose (exit 1) and a clean
 * twin (exit 0); a guard that cannot run exits 2.
 *
 * The trap strings are built from pieces (`j(...)`) so that this file does not trip the guard
 * (or gitleaks) when the guard checks the real repo. Tests run concurrently: each one spawns
 * git and node, and run one by one they would eat the 90 s budget of `npm run check`.
 */
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const guard = path.join(__dirname, '..', 'scripts', 'floor-guard.mjs');
const j = (...parts: string[]) => parts.join('');

const SKIP = j('it.', 'skip');
const ONLY = j('it.', 'only');
const TS_IGNORE = j('@ts-', 'ignore');
const UNFINISHED = j('TO', 'DO');
const NOT_IMPL = j('Not', ' implemented');
const NO_IMPL = j('No', ' implementado');
const EMPTY_CATCH = j('catch (e) {', '}');
const EMPTY_CATCH_NO_BINDING = j('catch {', '}');
const FAKE_KEY = j('AI', 'za', 'Sy', 'X'.repeat(33));
const TEST_ID = j('getBy', 'TestId');

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'floor-guard-'));
afterAll(() => fs.rmSync(tmpRoot, { recursive: true, force: true }));
let dirs = 0;
const newDir = () => fs.mkdtempSync(path.join(tmpRoot, `${dirs++}-`));

type Run = { status: number | null; out: string };

function exec(cmd: string, args: string[], cwd: string, env?: NodeJS.ProcessEnv): Promise<Run> {
  return new Promise((resolve) => {
    execFile(cmd, args, { cwd, env, encoding: 'utf8' }, (error, stdout, stderr) => {
      const status = error ? (typeof error.code === 'number' ? error.code : null) : 0;
      resolve({ status, out: `${stdout}${stderr}` });
    });
  });
}

const GIT_CONFIG = [
  ['user.name', 'floor-guard-test'],
  ['user.email', 'floor-guard@example.invalid'],
  ['core.autocrlf', 'false'],
  ['commit.gpgsign', 'false'],
].flatMap(([k, v]) => ['-c', `${k}=${v}`]);

async function git(cwd: string, args: string[]) {
  const r = await exec('git', [...GIT_CONFIG, ...args], cwd);
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${r.out}`);
}

function writeIn(dir: string, file: string, content: string) {
  fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  fs.writeFileSync(path.join(dir, file), content);
}

async function commitIn(dir: string, message: string) {
  await git(dir, ['add', '-A']);
  await git(dir, ['commit', '-q', '--allow-empty', '-m', message]);
}

// One template per base, copied for each test: `git init` and the base commit happen once.
const templates = new Map<string, Promise<string>>();
function template(base: Record<string, string>) {
  const key = JSON.stringify(base);
  let t = templates.get(key);
  if (!t) {
    t = (async () => {
      const dir = newDir();
      await git(dir, ['init', '-q', '--template=', '-b', 'main']);
      for (const [file, content] of Object.entries(base)) writeIn(dir, file, content);
      await commitIn(dir, 'chore: base');
      await git(dir, ['checkout', '-q', '-b', 'work']);
      return dir;
    })();
    templates.set(key, t);
  }
  return t;
}

/** A repo with `base` committed on `main` and a `work` branch checked out on top of it. */
async function repo(base: Record<string, string> = { 'src/a.ts': 'export const a = 1;\n' }) {
  const dir = newDir();
  fs.cpSync(await template(base), dir, { recursive: true });
  return {
    dir,
    write: (file: string, content: string) => writeIn(dir, file, content),
    rm: (file: string) => fs.rmSync(path.join(dir, file)),
    commit: (message: string) => commitIn(dir, message),
    run: (args: string[] = ['--base', 'main']) => exec(process.execPath, [guard, ...args], dir),
  };
}

/** One changed file on the work branch, committed as `message`, then the guard. */
async function change(file: string, content: string, message = 'chore: change') {
  const r = await repo();
  r.write(file, content);
  await r.commit(message);
  return r.run();
}

jest.setTimeout(120_000);

describe('exit codes', () => {
  test.concurrent('a clean branch exits 0', async () => {
    const { status, out } = await change('src/b.ts', 'export const b = 2;\n');
    expect(out).toContain('floor-guard: clean');
    expect(status).toBe(0);
  });

  test.concurrent('a missing base ref exits 2', async () => {
    const r = await repo();
    expect((await r.run(['--base', 'no-such-branch'])).status).toBe(2);
  });

  test.concurrent('--base without a value exits 2', async () => {
    const r = await repo();
    expect((await r.run(['--base'])).status).toBe(2);
  });

  test.concurrent('outside a git repo exits 2', async () => {
    const dir = newDir();
    const env = { ...process.env, GIT_CEILING_DIRECTORIES: path.dirname(dir) };
    expect((await exec(process.execPath, [guard, '--base', 'main'], dir, env)).status).toBe(2);
  });
});

describe('silenced-checker', () => {
  test.concurrent.each([
    ['ts', `// ${TS_IGNORE}\nexport const b = 2;\n`],
    ['ts-nocheck', `// ${j('@ts-', 'nocheck')}\n`],
    ['eslint', `/* ${j('eslint-', 'disable')} */\n`],
    ['istanbul', `/* ${j('istanbul', ' ignore')} next */\n`],
    ['c8', `/* ${j('c8', ' ignore')} next */\n`],
    ['gitleaks', `const x = 1; // ${j('gitleaks', ':allow')}\n`],
  ])('%s suppression exits 1', async (_name, content) => {
    const { status, out } = await change('src/b.ts', content);
    expect(out).toContain('[silenced-checker] src/b.ts:');
    expect(status).toBe(1);
  });

  test.concurrent('ordinary comments are clean', async () => {
    const { status } = await change('src/b.ts', '// ignore the cache here\nexport const b = 2;\n');
    expect(status).toBe(0);
  });

  test.concurrent('a new suppression in an untracked file is seen too', async () => {
    const r = await repo();
    r.write('src/new.ts', `// ${TS_IGNORE}\n`);
    const { status, out } = await r.run();
    expect(out).toContain('[silenced-checker] src/new.ts:1');
    expect(status).toBe(1);
  });

  test.concurrent('trap fixtures and Markdown are not scanned for code patterns', async () => {
    const r = await repo();
    r.write('config-tests/fixtures/trap.ts', `// ${TS_IGNORE}\n`);
    r.write('eslint-fixtures/trap.ts', `// ${TS_IGNORE}\n`);
    r.write('docs/notes.md', `Never write ${TS_IGNORE} or ${UNFINISHED}.\n`);
    await r.commit('test(config): traps');
    expect((await r.run()).status).toBe(0);
  });
});

describe('test-made-easier', () => {
  test.concurrent.each([
    ['skip', `${SKIP}('x', () => {});\n`],
    ['only', `${ONLY}('x', () => {});\n`],
    ['describe only', `${j('describe.', 'only')}('x', () => {});\n`],
    ['xit', `${j('x', 'it')}('x', () => {});\n`],
    ['xdescribe', `${j('x', 'describe')}('x', () => {});\n`],
    ['todo', `${j('test.', 'todo')}('x');\n`],
  ])('%s exits 1', async (_name, content) => {
    const { status, out } = await change('src/a.test.ts', content, 'test(a): tests');
    expect(out).toContain('[test-made-easier] src/a.test.ts:1');
    expect(status).toBe(1);
  });

  test.concurrent('a plain test is clean', async () => {
    const content = "it('x', () => { expect(1).toBe(1); });\n";
    expect((await change('src/a.test.ts', content, 'test(a): tests')).status).toBe(0);
  });
});

describe('test-deleted and assertion-removed', () => {
  const testFile = "it('x', () => {\n  expect(1).toBe(1);\n  expect(2).toBe(2);\n});\n";
  const shorter = "it('x', () => {\n  expect(1).toBe(1);\n});\n";
  const base = { 'src/a.test.ts': testFile };

  test.concurrent('deleting a test file without a reason exits 1', async () => {
    const r = await repo(base);
    r.rm('src/a.test.ts');
    await r.commit('test(a): remove');
    const { status, out } = await r.run();
    expect(out).toContain('[test-deleted] src/a.test.ts');
    expect(status).toBe(1);
  });

  test.concurrent('deleting a test file with Motivo-test in the commit is clean', async () => {
    const r = await repo(base);
    r.rm('src/a.test.ts');
    await r.commit('test(a): remove\n\nMotivo-test: el módulo a desaparece (spec v2)');
    expect((await r.run()).status).toBe(0);
  });

  test.concurrent('removing an expect without a reason exits 1', async () => {
    const r = await repo(base);
    r.write('src/a.test.ts', shorter);
    await r.commit('test(a): simplify');
    const { status, out } = await r.run();
    expect(out).toContain('[assertion-removed] src/a.test.ts:3 (removed)');
    expect(status).toBe(1);
  });

  test.concurrent('removing an expect with Motivo-test in the commit is clean', async () => {
    const r = await repo(base);
    r.write('src/a.test.ts', shorter);
    await r.commit('test(a): simplify\n\nMotivo-test: duplicaba la primera');
    expect((await r.run()).status).toBe(0);
  });

  test.concurrent('an uncommitted removal has no commit message, so it exits 1', async () => {
    const r = await repo(base);
    r.rm('src/a.test.ts');
    expect((await r.run()).status).toBe(1);
  });

  test.concurrent('adding an expect is clean', async () => {
    const r = await repo(base);
    r.write('src/a.test.ts', testFile.replace('});\n', '  expect(3).toBe(3);\n});\n'));
    await r.commit('test(a): more');
    expect((await r.run()).status).toBe(0);
  });
});

describe('unfinished-work', () => {
  test.concurrent.each([
    ['not implemented', `export function f() {\n  throw new Error('${NOT_IMPL}');\n}\n`],
    ['no implementado', `export function f() {\n  throw new Error('${NO_IMPL}');\n}\n`],
    ['marker', `export const f = () => 0; // ${UNFINISHED}: real logic\n`],
    ['empty catch', `try {\n  f();\n} ${EMPTY_CATCH}\n`],
    ['empty catch without binding', `try {\n  f();\n} ${EMPTY_CATCH_NO_BINDING}\n`],
  ])('%s exits 1', async (_name, content) => {
    const { status, out } = await change('src/b.ts', content);
    expect(out).toContain('[unfinished-work] src/b.ts:');
    expect(status).toBe(1);
  });

  test.concurrent('a real implementation is clean', async () => {
    const content = "export function f() {\n  throw new Error('Prenda no encontrada');\n}\n";
    expect((await change('src/b.ts', content)).status).toBe(0);
  });
});

describe('secret-in-diff', () => {
  test.concurrent('a Google API key exits 1 and the value is never printed', async () => {
    const { status, out } = await change('app.json', `{ "key": "${FAKE_KEY}" }\n`);
    expect(out).toContain('[secret-in-diff] app.json:1');
    expect(out).not.toContain(FAKE_KEY);
    expect(out).not.toContain(FAKE_KEY.slice(4, 20));
    expect(status).toBe(1);
  });

  test.concurrent('a key inside Markdown is still found', async () => {
    expect((await change('docs/notes.md', `clave: ${FAKE_KEY}\n`)).status).toBe(1);
  });

  test.concurrent('the bare prefix in prose is clean', async () => {
    const { status } = await change('docs/notes.md', 'Las claves de Google empiezan por AIza.\n');
    expect(status).toBe(0);
  });
});

describe('testid-outside-e2e', () => {
  const content = `screen.${TEST_ID}('save');\n`;

  test.concurrent('a screen test using test ids exits 1', async () => {
    const { status, out } = await change('src/ui/a.test.tsx', content, 'test(ui): screen');
    expect(out).toContain('[testid-outside-e2e] src/ui/a.test.tsx:1');
    expect(status).toBe(1);
  });

  test.concurrent('e2e/ may use them', async () => {
    expect((await change('e2e/flow.test.ts', content, 'test(e2e): flow')).status).toBe(0);
  });

  test.concurrent('getByRole is clean', async () => {
    const clean = "screen.getByRole('button', { name: 'Guardar' });\n";
    expect((await change('src/ui/a.test.tsx', clean, 'test(ui): screen')).status).toBe(0);
  });
});

describe('constraints-lowered', () => {
  const constraints = [
    '# Listón',
    '',
    '| Dimensión | Regla |',
    '|---|---|',
    '| Cobertura | líneas ≥ 90 %, ramas ≥ 85 % |',
    '| Check | ≤ 90 s |',
    '| Tipos | 0 errores |',
    '',
    '## Excepciones',
    '',
    '| ID | Regla |',
    '|---|---|',
    '| — | — |',
    '',
  ].join('\n');
  const base = { 'CONSTRAINTS.md': constraints, 'src/a.ts': 'export const a = 1;\n' };

  async function edit(from: string, to: string, withCode: boolean) {
    const r = await repo(base);
    r.write('CONSTRAINTS.md', constraints.replace(from, to));
    if (withCode) r.write('src/a.ts', 'export const a = 2;\n');
    await r.commit('feat(a): change');
    return r.run();
  }

  test.concurrent.each([
    ['a minimum lowered', '≥ 90 %', '≥ 80 %'],
    ['a maximum raised', '≤ 90 s', '≤ 120 s'],
    ['a number without direction changed', '0 errores', '3 errores'],
    ['a threshold removed', 'líneas ≥ 90 %, ramas ≥ 85 %', 'líneas ≥ 90 %'],
    ['a rule removed', '| Check | ≤ 90 s |\n', ''],
    ['a new exception', '| — | — |', '| E1 | no-explicit-any en src/a.ts |'],
  ])('%s together with code exits 1', async (_name, from, to) => {
    const { status, out } = await edit(from, to, true);
    expect(out).toContain('[constraints-lowered]');
    expect(status).toBe(1);
  });

  test.concurrent('lowered in its own PR is allowed but announced', async () => {
    const { status, out } = await edit('≥ 90 %', '≥ 80 %', false);
    expect(out).toMatch(/aprobación del dueño/);
    expect(status).toBe(0);
  });

  test.concurrent.each([
    ['a minimum raised', '≥ 90 %', '≥ 95 %'],
    ['a maximum lowered', '≤ 90 s', '≤ 60 s'],
    ['an exception removed', '| — | — |', ''],
  ])('%s together with code is clean', async (_name, from, to) => {
    expect((await edit(from, to, true)).status).toBe(0);
  });
});

describe('tdd-commit-touches-tests', () => {
  test.concurrent.each([
    ['feat', 'feat(a): implement', 'src/a.test.ts'],
    ['fix with breaking mark', 'fix(a)!: patch', 'src/a.test.ts'],
    ['feat touching __tests__', 'feat: implement', 'src/__tests__/a.ts'],
  ])('a %s commit that touches a test exits 1', async (_name, message, file) => {
    const r = await repo();
    r.write(file, "it('x', () => { expect(1).toBe(1); });\n");
    r.write('src/a.ts', 'export const a = 2;\n');
    await r.commit(message);
    const { status, out } = await r.run();
    expect(out).toContain('[tdd-commit-touches-tests]');
    expect(out).toContain(file);
    expect(status).toBe(1);
  });

  test.concurrent('a test commit by the tester, then feat by the developer, is clean', async () => {
    const r = await repo();
    r.write('src/a.test.ts', "it('x', () => { expect(1).toBe(1); });\n");
    await r.commit('test(a): spec cases');
    r.write('src/a.ts', 'export const a = 2;\n');
    await r.commit('feat(a): implement');
    expect((await r.run()).status).toBe(0);
  });
});
