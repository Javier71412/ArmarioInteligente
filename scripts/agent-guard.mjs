#!/usr/bin/env node
// agent-guard — PreToolUse hook for the agents in .claude/agents/ (CONSTRAINTS.md §1: the tester
// writes only tests, developers never touch tests or the quality bar, reviewers write nothing).
//
// Usage (from an agent's frontmatter): node "${CLAUDE_PROJECT_DIR}/scripts/agent-guard.mjs" <role>
// Input: the hook JSON on stdin (https://code.claude.com/docs/en/hooks, PreToolUse).
// Exit codes: 0 allow; 2 deny, with the reason on stderr (Claude sees it). Anything the guard
// cannot read is denied: a guard that fails open is no guard.
//
// This is the soft guarantee (it stops the agent before it writes). The hard one is
// scripts/floor-guard.mjs in CI, which looks at the commits whatever wrote them.
import fs from 'node:fs';
import path from 'node:path';

const role = process.argv[2];

const deny = (msg) => {
  console.error(`agent-guard (${role ?? 'sin rol'}): ${msg}`);
  process.exit(2);
};

// ---- Paths ---------------------------------------------------------------------------------

const isTest = (f) =>
  /\.(test|spec)\.[cm]?[jt]sx?$/.test(f) ||
  /(^|\/)__tests__\//.test(f) ||
  /^(config-tests|eslint-fixtures|e2e)\//.test(f) ||
  /(^|\/)src\/(test|androidTest)\//.test(f);

// The quality bar: nobody but the owner's own PR changes it (CONSTRAINTS.md «Cómo se protege»).
const isBar = (f) =>
  /^(CONSTRAINTS\.md|eslint\.config\.js|jest\.config\.js|jest\.domain-coverage\.js|tsconfig\.json)$/.test(
    f,
  ) ||
  /^(\.claude|\.github|scripts)\//.test(f) ||
  /^\.?gitleaks/.test(f);

const MOD = String.raw`src\/modules\/[^/]+\/`;
const under = (...res) => new RegExp(`^(${res.join('|')})`);

// Where each role may write (tests and the bar are handled before this table).
const AREAS = {
  'dev-dominio': under(`${MOD}(domain|data)\\/`, `${MOD}index\\.ts$`),
  'dev-interfaz': under(
    'app\\/',
    `${MOD}ui\\/`,
    'src\\/modules\\/core\\/design\\/',
    `${MOD}index\\.ts$`,
    'assets\\/',
  ),
  'dev-nativo': under('modules\\/tagging-native\\/'),
  arquitecto: under('docs\\/adr\\/'),
  disenador: under('docs\\/diseno\\/', 'design\\/tokens\\/'),
  integrador: under('tasks\\/', 'CLAUDE\\.md$'),
};
const DEVELOPERS = ['dev-dominio', 'dev-interfaz', 'dev-nativo'];
const REVIEWERS = ['revisor', 'revisor-seguridad', 'revisor-accesibilidad'];
const ROLES = ['probador', ...DEVELOPERS, ...REVIEWERS, 'arquitecto', 'disenador', 'integrador'];

function checkWrite(rel) {
  if (REVIEWERS.includes(role)) deny('los revisores no escriben archivos: informa al coordinador.');
  if (role === 'probador') {
    if (isTest(rel) && !isBar(rel)) return;
    deny(`el probador solo escribe tests; «${rel}» es código de producción o del listón.`);
  }
  if (isTest(rel)) {
    deny(
      `«${rel}» es un test: no lo toques. Si crees que está mal, para y avisa al coordinador (CONSTRAINTS.md §1).`,
    );
  }
  if (isBar(rel)) deny(`«${rel}» es parte del listón de calidad: no se cambia aquí.`);
  if (!AREAS[role].test(rel))
    deny(`«${rel}» queda fuera de tu zona; si hace falta, avisa al coordinador.`);
}

// ---- Bash ----------------------------------------------------------------------------------

// Split on unquoted ; && || | and newlines. Redirections, heredocs and command substitution are
// refused outright: Bash is for running checks, files are written with Write/Edit (guarded).
function segments(cmd) {
  const cleaned = cmd.replace(/\s\d?>\s?&\d/g, ' ').replace(/\s\d?>\s?\/dev\/null/g, ' ');
  const out = [];
  let cur = '';
  let quote = null;
  for (let i = 0; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (quote) {
      if (c === quote) quote = null;
      else if (quote === '"' && (c === '`' || (c === '$' && cleaned[i + 1] === '('))) {
        deny('nada de sustitución de comandos (`…` o $(…)) en Bash.');
      }
      cur += c;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      cur += c;
    } else if (c === '`' || (c === '$' && cleaned[i + 1] === '(')) {
      deny('nada de sustitución de comandos (`…` o $(…)) en Bash.');
    } else if (c === '>' || c === '<') {
      deny('nada de redirecciones ni heredocs en Bash: los archivos se escriben con Write/Edit.');
    } else if (c === ';' || c === '\n' || c === '|' || c === '&') {
      if ((c === '|' || c === '&') && cleaned[i + 1] === c) i++;
      out.push(cur.trim());
      cur = '';
    } else cur += c;
  }
  if (quote) deny('comillas sin cerrar en el comando.');
  out.push(cur.trim());
  return out.filter(Boolean);
}

const READ_ONLY = [
  /^git (status|diff|log|show|blame|ls-files|rev-parse|merge-base|branch --show-current)\b/,
  /^gh (pr (view|diff|checks|list)|issue (view|list)|run (view|list))\b/,
  /^npm (test|run (check|lint|typecheck|test|test:coverage|floor-guard))\b/,
  /^npx (jest|tsc|eslint|prettier --check)\b/,
  /^(ls|cat|head|tail|grep|rg|wc|pwd|sort|uniq|cut|echo)\b/,
];
const COMMIT = [/^git (add|commit|switch)\b/];
const DEPS = [/^npm (install|i|uninstall)\b/, /^npx expo install\b/];
const INTEGRATOR = [
  /^git (fetch|pull|push|switch|add|commit|merge|rebase|branch|stash|tag)\b/,
  /^gh (pr|issue|run|label|api repos\/[^/]+\/[^/]+\/milestones)\b/,
];
const INTEGRATOR_NEVER =
  /(--force|\s-f\b|--admin|reset --hard|\bclean\b|filter-branch|gh repo delete|branch -D|--no-verify)/;

const BASH = {
  probador: [...READ_ONLY, ...COMMIT],
  'dev-dominio': [...READ_ONLY, ...COMMIT, ...DEPS],
  'dev-interfaz': [...READ_ONLY, ...COMMIT, ...DEPS],
  'dev-nativo': [...READ_ONLY, ...COMMIT, ...DEPS],
  revisor: READ_ONLY,
  'revisor-seguridad': READ_ONLY,
  'revisor-accesibilidad': READ_ONLY,
  integrador: [...READ_ONLY, ...INTEGRATOR],
  arquitecto: [],
  disenador: [],
};

function checkBash(cmd) {
  for (const seg of segments(cmd)) {
    if (role === 'integrador' && INTEGRATOR_NEVER.test(seg)) {
      deny(`«${seg}» no se puede deshacer: lo hace el dueño, si quiere.`);
    }
    if (!BASH[role].some((re) => re.test(seg))) {
      deny(`«${seg.split(' ').slice(0, 3).join(' ')}…» no está permitido para tu rol.`);
    }
  }
}

// ---- Main ----------------------------------------------------------------------------------

if (!ROLES.includes(role)) deny(`rol desconocido. Roles: ${ROLES.join(', ')}.`);

let input;
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch {
  deny('no se pudo leer la entrada del hook (JSON).');
}

const tool = input?.tool_name;
const args = input?.tool_input ?? {};

if (tool === 'Bash') {
  if (typeof args.command !== 'string') deny('Bash sin comando.');
  checkBash(args.command);
} else if (tool === 'Write' || tool === 'Edit' || tool === 'NotebookEdit') {
  const file = args.file_path ?? args.notebook_path;
  if (typeof file !== 'string') deny(`${tool} sin ruta.`);
  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  // Claude Code sends Windows paths with backslashes; compare in POSIX form on any OS.
  // The drive letter can come in either case (c:\ or C:\).
  const posix = (p) => p.replace(/\\/g, '/').replace(/^[a-z]:/, (d) => d.toUpperCase());
  const rel = path.posix.relative(posix(root), path.posix.normalize(posix(file)));
  if (!rel || rel.startsWith('..') || path.posix.isAbsolute(rel) || /^[a-zA-Z]:/.test(rel)) {
    deny(`«${file}» queda fuera del proyecto.`);
  }
  checkWrite(rel);
}
process.exit(0);
