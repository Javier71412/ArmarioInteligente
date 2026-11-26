/**
 * CONSTRAINTS.md §1 «TDD con agentes separados»: scripts/agent-guard.mjs, the PreToolUse hook
 * of every agent in .claude/agents/. It reads the hook input (JSON on stdin) and the role in
 * argv, and exits 0 (allow) or 2 (deny, reason on stderr). Anything it cannot read is denied.
 * Hook contract: https://code.claude.com/docs/en/hooks (PreToolUse, exit code 2 = deny).
 *
 * The hard guarantee stays floor-guard in CI; this hook stops the agent before it writes.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const guard = path.join(__dirname, '..', 'scripts', 'agent-guard.mjs');
// The project dir as Claude Code passes it on Windows (backslashes), plus a POSIX one.
const WIN_ROOT = 'C:\\proj';
const POSIX_ROOT = '/home/u/proj';

type Result = { status: number | null; stderr: string };

function run(role: string, input: unknown, root = WIN_ROOT): Result {
  const r = spawnSync(process.execPath, [guard, role], {
    input: typeof input === 'string' ? input : JSON.stringify(input),
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: root },
  });
  return { status: r.status, stderr: r.stderr };
}

const win = (rel: string) => `${WIN_ROOT}\\${rel.split('/').join('\\')}`;
const write = (rel: string, root = WIN_ROOT) => ({
  hook_event_name: 'PreToolUse',
  tool_name: 'Write',
  tool_input: { file_path: root === WIN_ROOT ? win(rel) : `${root}/${rel}`, content: 'x' },
});
const edit = (rel: string) => ({
  hook_event_name: 'PreToolUse',
  tool_name: 'Edit',
  tool_input: { file_path: win(rel), old_string: 'a', new_string: 'b' },
});
const bash = (command: string) => ({
  hook_event_name: 'PreToolUse',
  tool_name: 'Bash',
  tool_input: { command },
});

const ALLOW = 0;
const DENY = 2;

describe('probador: only tests', () => {
  test.each([
    'src/modules/laundry/domain/wash.test.ts',
    'src/modules/today/ui/TodayScreen.test.tsx',
    'src/modules/laundry/domain/__tests__/helpers.ts',
    'config-tests/new-check.test.ts',
    'config-tests/fixtures/trap.ts',
    'eslint-fixtures/boundaries/trap.ts',
    'e2e/morning.yaml',
    'modules/tagging-native/android/src/test/java/TagTest.kt',
  ])('may write %s', (rel) => {
    expect(run('probador', write(rel)).status).toBe(ALLOW);
  });

  test.each([
    'src/modules/laundry/domain/wash.ts',
    'app/index.tsx',
    'package.json',
    'CONSTRAINTS.md',
    'scripts/floor-guard.mjs',
    '.claude/agents/probador.md',
  ])('may not write %s', (rel) => {
    const r = run('probador', write(rel));
    expect(r.status).toBe(DENY);
    expect(r.stderr).toMatch(/agent-guard/);
  });

  test('Edit is checked like Write', () => {
    expect(run('probador', edit('src/modules/laundry/domain/wash.ts')).status).toBe(DENY);
    expect(run('probador', edit('src/modules/laundry/domain/wash.test.ts')).status).toBe(ALLOW);
  });

  test('POSIX paths work too', () => {
    expect(run('probador', write('src/a/b.test.ts', POSIX_ROOT), POSIX_ROOT).status).toBe(ALLOW);
    expect(run('probador', write('src/a/b.ts', POSIX_ROOT), POSIX_ROOT).status).toBe(DENY);
  });
});

describe('developers: never tests, never the quality bar, only their area', () => {
  test.each([
    ['dev-dominio', 'src/modules/laundry/domain/wash.ts'],
    ['dev-dominio', 'src/modules/storage/data/migrations/0001.ts'],
    ['dev-dominio', 'src/modules/laundry/index.ts'],
    ['dev-interfaz', 'app/(tabs)/index.tsx'],
    ['dev-interfaz', 'src/modules/today/ui/TodayScreen.tsx'],
    ['dev-interfaz', 'src/modules/core/design/Button.tsx'],
    ['dev-nativo', 'modules/tagging-native/android/src/main/java/Tagger.kt'],
  ])('%s may write %s', (role, rel) => {
    expect(run(role, write(rel)).status).toBe(ALLOW);
  });

  test.each([
    ['dev-dominio', 'src/modules/laundry/domain/wash.test.ts'],
    ['dev-dominio', 'src/modules/laundry/domain/__tests__/helpers.ts'],
    ['dev-dominio', 'config-tests/floor-guard.test.ts'],
    ['dev-dominio', 'src/modules/today/ui/TodayScreen.tsx'],
    ['dev-interfaz', 'src/modules/today/ui/TodayScreen.test.tsx'],
    ['dev-interfaz', 'e2e/morning.yaml'],
    ['dev-interfaz', 'src/modules/laundry/domain/wash.ts'],
    ['dev-nativo', 'modules/tagging-native/android/src/test/java/TagTest.kt'],
    ['dev-nativo', 'src/modules/tagging/domain/colors.ts'],
    ['dev-dominio', 'CONSTRAINTS.md'],
    ['dev-dominio', 'eslint.config.js'],
    ['dev-dominio', 'jest.config.js'],
    ['dev-dominio', 'tsconfig.json'],
    ['dev-interfaz', '.github/workflows/ci.yml'],
    ['dev-interfaz', 'scripts/agent-guard.mjs'],
  ])('%s may not write %s', (role, rel) => {
    const r = run(role, write(rel));
    expect(r.status).toBe(DENY);
    expect(r.stderr).toMatch(/agent-guard/);
  });

  test('the denial tells the developer to stop and report', () => {
    const r = run('dev-dominio', write('src/modules/laundry/domain/wash.test.ts'));
    expect(r.stderr).toMatch(/para y avisa/i);
  });
});

describe('the other writing roles stay in their folder', () => {
  test.each([
    ['arquitecto', 'docs/adr/0009-new.md', ALLOW],
    ['arquitecto', 'SPEC.md', DENY],
    ['arquitecto', 'src/modules/core/index.ts', DENY],
    ['disenador', 'docs/diseno/identidad.md', ALLOW],
    ['disenador', 'design/tokens/color.tokens.json', ALLOW],
    ['disenador', 'src/modules/core/design/Button.tsx', DENY],
    ['integrador', 'tasks/plan.md', ALLOW],
    ['integrador', 'CLAUDE.md', ALLOW],
    ['integrador', 'src/modules/laundry/domain/wash.ts', DENY],
  ])('%s writing %s → %s', (role, rel, expected) => {
    expect(run(role, write(rel)).status).toBe(expected);
  });

  test.each(['revisor', 'revisor-seguridad', 'revisor-accesibilidad'])(
    '%s may not write anything',
    (role) => {
      expect(run(role, write('docs/review.md')).status).toBe(DENY);
    },
  );
});

describe('Bash: commands to check things, never to write files', () => {
  test.each([
    ['dev-dominio', 'npm test -- src/modules/laundry'],
    ['dev-dominio', 'npx jest src/modules/laundry/domain/wash.test.ts'],
    ['dev-dominio', 'npm run check 2>&1 | tail -20'],
    ['dev-dominio', 'git status && git diff --stat'],
    ['dev-dominio', 'git add src/modules/laundry/domain/wash.ts'],
    ['dev-dominio', 'git commit -m "feat(laundry): count uses; reset on wash"'],
    ['dev-dominio', 'npx expo install expo-sqlite'],
    ['probador', 'npx jest config-tests/agent-guard.test.ts'],
    ['revisor', 'gh pr diff 12'],
    ['revisor', 'git log --oneline origin/main..HEAD'],
    ['revisor', 'npm run check'],
    ['integrador', 'git switch -c feat/12-agents'],
    ['integrador', 'git push -u origin feat/12-agents'],
    ['integrador', 'gh pr create --title "x" --body-file pr.md'],
    ['integrador', 'gh pr merge 12 --squash --delete-branch'],
  ])('%s may run: %s', (role, command) => {
    expect(run(role, bash(command)).status).toBe(ALLOW);
  });

  test.each([
    ['dev-dominio', 'echo x > src/modules/laundry/domain/wash.test.ts'],
    ['dev-dominio', 'npm test >> out.txt'],
    ['dev-dominio', "sed -i 's/a/b/' src/modules/laundry/domain/wash.test.ts"],
    ['dev-dominio', 'rm src/modules/laundry/domain/wash.test.ts'],
    ['dev-dominio', 'git checkout -- src/modules/laundry/domain/wash.test.ts'],
    ['dev-dominio', 'git status; rm -rf src'],
    ['dev-dominio', 'echo $(rm -rf src)'],
    ['dev-dominio', "node -e \"require('fs').writeFileSync('a.test.ts', '')\""],
    ['dev-dominio', 'cat <<EOF > a.ts'],
    ['probador', 'npm install fast-check'],
    ['revisor', 'git commit -m "fix"'],
    ['revisor', 'gh pr merge 12 --squash'],
    ['integrador', 'git push --force origin main'],
    ['integrador', 'git push -f'],
    ['integrador', 'git reset --hard HEAD~1'],
    ['integrador', 'gh repo delete Javier71412/ArmarioInteligente'],
    ['integrador', 'gh pr merge 12 --admin --squash'],
  ])('%s may not run: %s', (role, command) => {
    const r = run(role, bash(command));
    expect(r.status).toBe(DENY);
    expect(r.stderr).toMatch(/agent-guard/);
  });
});

describe('fails closed', () => {
  test('unknown role', () => {
    expect(run('hacker', write('src/a.test.ts')).status).toBe(DENY);
  });
  test('input that is not JSON', () => {
    expect(run('probador', 'not json').status).toBe(DENY);
  });
  test('a path outside the project', () => {
    expect(
      run('probador', { tool_name: 'Write', tool_input: { file_path: 'D:\\x\\a.test.ts' } }).status,
    ).toBe(DENY);
  });
  test('a path that climbs out with ..', () => {
    expect(run('probador', write('src/../../evil.test.ts')).status).toBe(DENY);
  });
  test('tools it does not know pass through untouched', () => {
    expect(
      run('revisor', { tool_name: 'Read', tool_input: { file_path: win('src/a.ts') } }).status,
    ).toBe(ALLOW);
  });
});
