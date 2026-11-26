#!/usr/bin/env node
// floor-guard — diff-scoped enforcement of the CONSTRAINTS.md floor (§0) and of the separated
// TDD rule (§1). Adapted from the reference of the agent-skills constraint-driven-development
// skill (references/floor-guard.md); no dependencies.
//
// Usage: node scripts/floor-guard.mjs [--base <ref>]   (default base: origin/main)
// Exit codes: 0 clean, 1 at least one violation, 2 the guard could not run. A 2 never reads as 0.
//
// It reads the diff between the merge base and the working tree (added and removed lines plus
// untracked files) and the commits in <merge base>..HEAD. Findings name the rule and the place,
// never the line's text: a flagged line may hold a secret.
//
// The patterns below are written so that this file does not match itself (for example with a
// group in the middle of a word); keep that when you edit them.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const bail = (msg) => {
  console.error('floor-guard: ' + msg);
  process.exit(2);
};

const base = (() => {
  const i = process.argv.indexOf('--base');
  if (i === -1) return 'origin/main';
  const ref = process.argv[i + 1];
  if (!ref || ref.startsWith('--')) bail('--base needs a ref');
  return ref;
})();

// `git diff --no-index` exits 1 whenever the two sides differ (the normal case for a new file),
// so that output is kept. Any other failure is null, and null never reads as clean.
const GIT_OPTS = ['-c', 'core.quotepath=false'];
const git = (args, { diffExit = false } = {}) => {
  try {
    return execFileSync('git', [...GIT_OPTS, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 256 * 1024 * 1024,
    });
  } catch (e) {
    return diffExit && e.status === 1 && typeof e.stdout === 'string' ? e.stdout : null;
  }
};

// Run from the top of the work tree, so untracked files and diff paths share one root.
const top = git(['rev-parse', '--show-toplevel'])?.trim();
if (!top) bail('not inside a git work tree');
process.chdir(top);

if (git(['rev-parse', '--verify', '--quiet', base + '^{commit}']) === null) {
  bail('base ref not found: ' + base + ' (in CI, fetch it with fetch-depth: 0)');
}
const mergeBase = git(['merge-base', base, 'HEAD'])?.trim();
if (!mergeBase) bail('no merge base against ' + base);

const DIFF_OPTS = ['--no-color', '--no-ext-diff', '--unified=0'];
const tracked = git(['diff', ...DIFF_OPTS, mergeBase, '--']);
if (tracked === null) bail('could not diff against ' + mergeBase);
const untrackedFiles = git(['ls-files', '--others', '--exclude-standard']);
if (untrackedFiles === null) bail('could not list untracked files');
const untracked = untrackedFiles
  .split('\n')
  .filter(Boolean)
  .map((f) => {
    const d = git(['diff', ...DIFF_OPTS, '--no-index', '/dev/null', f], { diffExit: true });
    if (d === null) bail('could not diff untracked file ' + f);
    return d;
  })
  .join('\n');
const diff = tracked + '\n' + untracked;

// Commits on the branch: hash, subject, full message and touched files.
const SEP = '\x1e';
const log = git([
  'log',
  '--no-merges',
  '--name-only',
  `--format=${SEP}%H%x00%s%x00%B%x00`,
  `${mergeBase}..HEAD`,
]);
if (log === null) bail('could not read commits since ' + mergeBase);
const commits = log
  .split(SEP)
  .filter((c) => c.trim())
  .map((chunk) => {
    const [hash, subject, body, files = ''] = chunk.split('\x00');
    return { hash, subject, body, files: files.split('\n').filter(Boolean) };
  });

// Walk the diff. `---`/`+++` are headers only between a file's `diff` line and its first `@@`.
const added = [];
const removed = [];
const deleted = [];
const changedFiles = new Set();
const pathOf = (s) => s.replace(/^[ab]\//, '').replace(/\t$/, '');
let file = '';
let oldFile = '';
let inHeader = false;
let oldLine = 0;
let newLine = 0;
for (const line of diff.split('\n')) {
  if (line.startsWith('diff ')) inHeader = true;
  else if (line.startsWith('@@')) {
    inHeader = false;
    const m = /^@@ -(\d+)(?:,\d+)? \+(\d+)/.exec(line);
    if (m) {
      oldLine = Number(m[1]);
      newLine = Number(m[2]);
    }
  } else if (inHeader) {
    if (line.startsWith('--- ')) oldFile = pathOf(line.slice(4));
    else if (line.startsWith('+++ ')) {
      const newFile = pathOf(line.slice(4));
      file = newFile === '/dev/null' ? oldFile : newFile;
      if (newFile === '/dev/null') deleted.push(file);
      changedFiles.add(file);
    }
  } else if (line.startsWith('+')) added.push({ file, line: newLine++, text: line.slice(1) });
  else if (line.startsWith('-')) {
    removed.push({ file, oldPath: oldFile, line: oldLine++, text: line.slice(1) });
  } else if (line.startsWith(' ')) {
    oldLine++;
    newLine++;
  }
}

const findings = [];
const notices = [];
const flag = (rule, where) => findings.push({ rule, where });
const at = (l) => `${l.file}:${l.line}`;
const atBase = (l) => `${l.oldPath}:${l.line} (removed)`;

const isTest = (f) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(f) || /(^|\/)__tests__\//.test(f);
const isCode = (f) => /\.[cm]?[jt]sx?$/.test(f);
// Trap files that break the floor on purpose for config-tests/ (they are linted on purpose).
const isTrapFixture = (f) => /^(config-tests\/fixtures|eslint-fixtures)\//.test(f);
const isE2e = (f) => /^e2e\//.test(f);
const isConstraints = (f) => f === 'CONSTRAINTS.md';

// §0: a silenced checker.
const SUPPRESSIONS =
  /@ts-(ignore|nocheck)\b|eslint-(disable|enable)\b|istanbul\s+(ignore)\b|c8\s+(ignore)\b|gitleaks:(allow)\b|Stryker\s+(disable)\b|biome-(ignore)\b/;
// §0: a test made easier.
const SKIPS = /\.(skip|only|todo)\b|\bx(it|describe|test)\s*\(|\bf(it|describe)\s*\(/;
// §0: unfinished work instead of the implementation.
const STUBS =
  /throw\s+new\s+\w*Error\s*\(.*([Nn]ot\s+implemented|[Nn]o\s+implementad)|catch\s*(\([^)]*\))?\s*\{\s*\}|\bT[O]DO\b/;
// §4: Google API keys (prefix plus 35 characters). Never printed.
const GOOGLE_KEY = /AI[z]a[0-9A-Za-z_-]{30,}/;
// §2 «Etiquetas»: test ids only for Maestro (e2e/).
const TEST_ID = /\b(get|query|find)(All)?By(TestId)\b/;

for (const l of added) {
  if (GOOGLE_KEY.test(l.text)) flag('secret-in-diff', at(l));
  if (!isCode(l.file) || isTrapFixture(l.file)) continue;
  if (SUPPRESSIONS.test(l.text)) flag('silenced-checker', at(l));
  if (STUBS.test(l.text)) flag('unfinished-work', at(l));
  if (SKIPS.test(l.text)) flag('test-made-easier', at(l));
  if (TEST_ID.test(l.text) && !isE2e(l.file)) flag('testid-outside-e2e', at(l));
}

// §0: a test file deleted, or an assertion removed from a test that stayed, without a reason.
// The reason is a `Motivo-test: <texto>` line in one of the branch's commit messages.
const hasReason = commits.some((c) => /^Motivo-test:\s*\S/m.test(c.body));
const testLosses = [];
for (const f of deleted) if (isTest(f)) testLosses.push(['test-deleted', `${f} (file deleted)`]);
for (const l of removed) {
  if (isTest(l.file) && !deleted.includes(l.file) && /\b(expect|assert)\b/.test(l.text)) {
    testLosses.push(['assertion-removed', atBase(l)]);
  }
}
if (hasReason) {
  for (const [rule, where] of testLosses) notices.push(`[${rule}] ${where} (con Motivo-test)`);
} else {
  for (const [rule, where] of testLosses) flag(rule, where);
}

// §1: feat/fix commits (the developer's) must not touch tests; only test commits may.
for (const c of commits) {
  if (!/^(feat|fix)(\([^)]*\))?!?:/.test(c.subject)) continue;
  for (const f of c.files) {
    if (isTest(f)) flag('tdd-commit-touches-tests', `${c.hash.slice(0, 8)} "${c.subject}" -> ${f}`);
  }
}

// §0 and «Cómo se protege este archivo»: CONSTRAINTS.md weakened. A rule is a table row (keyed
// by its first cell) or a bullet (keyed by its text before the first colon). Each number has a
// direction read from the words around it; a number without one is reported whenever it
// changes. Rows under «## Excepciones» are exceptions: adding one loosens, removing one tightens.
// Weakening is only allowed in a PR that changes nothing else (and the owner approves it).
const constraintsChanged = [...changedFiles].some(isConstraints);
if (constraintsChanged) {
  const exceptionsFrom = (text) => {
    const i = (text ?? '').split('\n').findIndex((t) => /^##\s+Excepciones\b/.test(t));
    return i === -1 ? Infinity : i + 1;
  };
  const baseText = git(['show', `${mergeBase}:CONSTRAINTS.md`]);
  const newText = fs.existsSync('CONSTRAINTS.md') ? fs.readFileSync('CONSTRAINTS.md', 'utf8') : '';
  const baseExceptions = exceptionsFrom(baseText);
  const newExceptions = exceptionsFrom(newText);

  const ruleKey = (t) => {
    const s = t.trim();
    if (/^\|[\s|:-]*$/.test(s)) return null; // table separator
    if (s.startsWith('|'))
      return (
        s
          .split('|')
          .map((c) => c.trim())
          .filter(Boolean)[0] ?? ''
      );
    if (/^[-*] /.test(s)) return s.slice(2).split(':')[0].trim();
    return null; // prose, headings, dates: not a rule
  };
  const isRealRow = (t) => {
    const key = ruleKey(t);
    return key !== null && key !== '' && key !== '—' && key !== 'ID' && t.trim().startsWith('|');
  };
  const MIN_BEFORE = /(>=|>|≥|al menos|mínimo|como mínimo|no puede bajar de|at least)\s*$/;
  const MAX_BEFORE = /(<=|<|≤|como mucho|máximo|como máximo|menos de|no más de|at most)\s*$/;
  const MIN_AFTER = /^\s*\S*\s*(o más|como mínimo)/;
  const MAX_AFTER = /^\s*\S*\s*(o menos|como máximo)/;
  const thresholds = (t) => {
    const out = [];
    const re = /\d+(?:[.,]\d+)?/g;
    let m;
    while ((m = re.exec(t))) {
      const before = t.slice(Math.max(0, m.index - 24), m.index).toLowerCase();
      const after = t.slice(m.index + m[0].length, m.index + m[0].length + 40).toLowerCase();
      const dir =
        MIN_BEFORE.test(before) || MIN_AFTER.test(after)
          ? 'min'
          : MAX_BEFORE.test(before) || MAX_AFTER.test(after)
            ? 'max'
            : null;
      out.push({ n: Number(m[0].replace(',', '.')), dir });
    }
    return out;
  };

  const weakenings = [];
  const removedRules = removed.filter((l) => isConstraints(l.file) && ruleKey(l.text) !== null);
  const addedRules = added.filter((l) => isConstraints(l.file) && ruleKey(l.text) !== null);
  for (const a of addedRules) {
    if (a.line > newExceptions && isRealRow(a.text)) {
      const existed = removedRules.some(
        (r) => r.line > baseExceptions && ruleKey(r.text) === ruleKey(a.text),
      );
      if (!existed) weakenings.push(['new-exception', at(a)]);
    }
  }
  for (const r of removedRules) {
    if (r.line > baseExceptions) continue; // an exception removed or edited: never a loosening here
    const a = addedRules.find(
      (x) => x.line <= newExceptions && ruleKey(x.text) === ruleKey(r.text),
    );
    if (!a) {
      weakenings.push(['rule-removed', atBase(r)]);
      continue;
    }
    const before = thresholds(r.text);
    const after = thresholds(a.text);
    let verdict = null;
    for (const dir of ['min', 'max', null]) {
      const was = before.filter((x) => x.dir === dir);
      const now = after.filter((x) => x.dir === dir);
      was.forEach((b, i) => {
        const n = now[i];
        if (verdict) return;
        if (!n) verdict = 'threshold-removed';
        else if (n.n === b.n) return;
        else if (dir === 'min' ? n.n < b.n : dir === 'max' ? n.n > b.n : true) {
          verdict = dir ? 'threshold-loosened' : 'threshold-changed';
        }
      });
    }
    if (verdict) weakenings.push([verdict, `${atBase(r)} -> ${at(a)}`]);
  }

  const otherFiles = [...changedFiles].filter((f) => !isConstraints(f));
  if (weakenings.length > 0 && otherFiles.length > 0) {
    for (const [kind, where] of weakenings) flag('constraints-lowered', `${kind}: ${where}`);
  } else {
    for (const [kind, where] of weakenings) {
      notices.push(`[constraints-lowered] ${kind}: ${where} — necesita la aprobación del dueño`);
    }
  }
}

for (const n of notices) console.log('floor-guard: aviso ' + n);
if (findings.length === 0) {
  console.log('floor-guard: clean');
  process.exit(0);
}
console.error(`floor-guard: ${findings.length} violación(es) del suelo (CONSTRAINTS.md):`);
for (const f of findings) console.error(`  [${f.rule}] ${f.where}`);
console.error(
  '\nCada una rebaja el listón. Arregla el código, o pide una excepción en su propio PR.' +
    '\nTests borrados o sin expect: explica el porqué con una línea «Motivo-test: …» en el commit.' +
    '\nCONSTRAINTS.md solo se rebaja en su propio PR (chore(constraints)), sin más archivos.',
);
process.exit(1);
