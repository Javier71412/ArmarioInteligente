/**
 * tasks/plan.md › «Roles de agentes» and CONSTRAINTS.md §1: the team in .claude/agents/.
 * Claude Code skips an agent file whose frontmatter does not parse, has no name or description,
 * or has a name with ':' (https://code.claude.com/docs/en/sub-agents). So a typo here means the
 * agent silently disappears; this battery catches it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const dir = path.join(__dirname, '..', '.claude', 'agents');

const ROLES = [
  'arquitecto',
  'probador',
  'dev-dominio',
  'dev-interfaz',
  'dev-nativo',
  'revisor',
  'revisor-seguridad',
  'revisor-accesibilidad',
  'integrador',
  'disenador',
];
const DEVELOPERS = ['dev-dominio', 'dev-interfaz', 'dev-nativo'];
const REVIEWERS = ['revisor', 'revisor-seguridad', 'revisor-accesibilidad'];

type Hook = { type: string; command: string };
type Frontmatter = {
  name?: unknown;
  description?: unknown;
  tools?: string;
  disallowedTools?: string;
  skills?: string[];
  hooks?: { PreToolUse?: { matcher: string; hooks: Hook[] }[] };
};

function load(role: string): { fm: Frontmatter; body: string } {
  const text = fs.readFileSync(path.join(dir, `${role}.md`), 'utf8');
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(text);
  if (!m) throw new Error(`${role}.md has no frontmatter`);
  return { fm: parse(m[1]) as Frontmatter, body: m[2] };
}
const list = (s?: string) =>
  (s ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

test('there is one file per role in the plan, and nothing else', () => {
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
  expect(files.sort()).toEqual([...ROLES].sort());
});

describe.each(ROLES)('%s', (role) => {
  const { fm, body } = load(role);

  test('frontmatter Claude Code accepts: name = file name, a description', () => {
    expect(fm.name).toBe(role);
    expect(typeof fm.description).toBe('string');
    expect(String(fm.description).length).toBeGreaterThan(20);
  });

  test('cannot call other agents', () => {
    if (fm.tools !== undefined) expect(list(fm.tools)).not.toContain('Agent');
    else expect(list(fm.disallowedTools)).toContain('Agent');
    expect(body).toMatch(/No llamas a otros agentes/);
  });

  test('preloads its skills from the plan table', () => {
    expect(fm.skills?.length).toBeGreaterThan(0);
    for (const s of fm.skills ?? []) expect(s).toMatch(/^agent-skills:[a-z-]+$/);
  });

  test('runs agent-guard with its own role before writing or running commands', () => {
    const entry = fm.hooks?.PreToolUse?.[0];
    expect(entry?.matcher.split('|').sort()).toEqual(['Bash', 'Edit', 'NotebookEdit', 'Write']);
    expect(entry?.hooks[0]).toEqual({
      type: 'command',
      command: `node "\${CLAUDE_PROJECT_DIR}/scripts/agent-guard.mjs" ${role}`,
    });
  });

  test('always hands back a final report', () => {
    expect(body).toMatch(/Entrega siempre el informe final/);
  });
});

test('the tester is the only one told to write tests; developers are told to stop and report', () => {
  expect(load('probador').body).toMatch(/Solo escribes tests/);
  for (const dev of DEVELOPERS) {
    expect(load(dev).body).toMatch(/Nunca toques/);
    expect(load(dev).body).toMatch(/para y avisa/);
  }
});

test('reviewers have no tool that writes files', () => {
  for (const r of REVIEWERS) {
    const tools = list(load(r).fm.tools);
    expect(tools.length).toBeGreaterThan(0);
    for (const w of ['Write', 'Edit', 'NotebookEdit', 'PowerShell']) expect(tools).not.toContain(w);
  }
});

test('no PowerShell anywhere: it would bypass the Bash rules of agent-guard', () => {
  for (const role of ROLES) {
    const { fm } = load(role);
    if (fm.tools !== undefined) expect(list(fm.tools)).not.toContain('PowerShell');
    else expect(list(fm.disallowedTools)).toContain('PowerShell');
  }
});

test('subagents cannot nest: CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH is 1', () => {
  const settings = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', '.claude', 'settings.json'), 'utf8'),
  ) as { env?: Record<string, string> };
  expect(settings.env?.CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH).toBe('1');
});
