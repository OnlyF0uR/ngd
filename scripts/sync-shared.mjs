#!/usr/bin/env node
/**
 * Keeps every ngd skill self-contained while the shared material has one source of truth.
 *
 *   node scripts/sync-shared.mjs          # copy shared/ into each skill and refresh the workflow block
 *   node scripts/sync-shared.mjs --check  # verify everything is in sync and the frontmatter is valid (CI)
 *
 * Generated per skill (do not edit inside skills/):
 *   shared/references/core/  →  skills/<skill>/references/core/
 *   shared/scripts/          →  skills/<skill>/scripts/
 *   shared/assets/           →  skills/<skill>/assets/
 *   shared/snippets/workflow.md  →  SKILL.md between the ngd:workflow markers
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHARED = join(ROOT, 'shared');
const SKILLS = join(ROOT, 'skills');
const CHECK = process.argv.includes('--check');

const MAPPINGS = [
  ['references/core', 'references/core'],
  ['scripts', 'scripts'],
  ['assets', 'assets'],
];
const START = /<!-- ngd:workflow:start[^>]*-->/;
const END = '<!-- ngd:workflow:end -->';

const problems = [];
const changes = [];

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) out.push(...listFiles(abs).map((f) => join(name, f)));
    else out.push(name);
  }
  return out.sort();
}

function syncDir(from, to, skill) {
  const src = listFiles(from);
  const dst = listFiles(to);
  for (const file of src) {
    const a = readFileSync(join(from, file));
    const target = join(to, file);
    const same = existsSync(target) && Buffer.compare(a, readFileSync(target)) === 0;
    if (same) continue;
    if (CHECK) problems.push(`${skill}: ${relative(ROOT, target)} is out of date`);
    else {
      mkdirSync(dirname(target), { recursive: true });
      cpSync(join(from, file), target);
      changes.push(relative(ROOT, target));
    }
  }
  for (const file of dst) {
    if (src.includes(file)) continue;
    if (CHECK) problems.push(`${skill}: ${relative(ROOT, join(to, file))} is not in shared/ (stale)`);
    else {
      rmSync(join(to, file));
      changes.push(`removed ${relative(ROOT, join(to, file))}`);
    }
  }
}

function syncWorkflow(skill) {
  const file = join(SKILLS, skill, 'SKILL.md');
  const text = readFileSync(file, 'utf8');
  const start = text.match(START);
  const endIdx = text.indexOf(END);
  if (!start || endIdx < 0 || endIdx < start.index) {
    problems.push(`${skill}: SKILL.md is missing the ngd:workflow markers`);
    return;
  }
  const snippet = readFileSync(join(SHARED, 'snippets', 'workflow.md'), 'utf8').trim();
  const before = text.slice(0, start.index + start[0].length);
  const after = text.slice(endIdx);
  const next = `${before}\n${snippet}\n${after}`;
  if (next === text) return;
  if (CHECK) problems.push(`${skill}: SKILL.md workflow block is out of date`);
  else {
    writeFileSync(file, next);
    changes.push(relative(ROOT, file));
  }
}

function validateFrontmatter(skill) {
  const text = readFileSync(join(SKILLS, skill, 'SKILL.md'), 'utf8');
  const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fm) return problems.push(`${skill}: SKILL.md has no frontmatter`);
  const fields = Object.fromEntries(
    fm[1]
      .split('\n')
      .map((line) => line.match(/^([a-z-]+):\s*(.*)$/))
      .filter(Boolean)
      .map((m) => [m[1], m[2].trim()]),
  );
  const allowed = new Set(['name', 'description', 'license', 'allowed-tools', 'metadata', 'compatibility']);
  for (const key of Object.keys(fields)) if (!allowed.has(key)) problems.push(`${skill}: frontmatter key "${key}" isn't portable`);
  if (fields.name !== skill) problems.push(`${skill}: frontmatter name "${fields.name}" must equal the folder name`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(fields.name ?? '') || fields.name.length > 64) problems.push(`${skill}: invalid name`);
  const desc = fields.description ?? '';
  if (!desc) problems.push(`${skill}: missing description`);
  if (desc.length > 1024) problems.push(`${skill}: description is ${desc.length} characters (max 1024)`);
  if (/[<>]/.test(desc)) problems.push(`${skill}: description contains angle brackets`);
  const lines = text.split('\n').length;
  if (lines > 500) problems.push(`${skill}: SKILL.md has ${lines} lines (keep it under 500)`);
}

const skills = readdirSync(SKILLS).filter((s) => existsSync(join(SKILLS, s, 'SKILL.md')));
for (const skill of skills) {
  for (const [from, to] of MAPPINGS) syncDir(join(SHARED, from), join(SKILLS, skill, to), skill);
  syncWorkflow(skill);
  validateFrontmatter(skill);
}

if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join('\n'));
  console.error(CHECK ? '\nRun `node scripts/sync-shared.mjs` to update the skills.' : '');
  process.exit(1);
}
if (CHECK) console.log(`✓ ${skills.length} skills in sync with shared/ and valid (${skills.join(', ')})`);
else console.log(changes.length ? `Updated ${changes.length} file(s):\n  ${changes.join('\n  ')}` : 'Already in sync.');
