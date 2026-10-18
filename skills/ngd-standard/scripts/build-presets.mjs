#!/usr/bin/env node
/**
 * NGD presets builder — assembles one presets file from small per-preset source files, so each
 * preset can be written, checked and fixed on its own.
 *
 *   node build-presets.mjs --init design/presets/round-1 --project "Studio Name" --brand "#0f766e" [--mode light] [--lang nl]
 *   node build-presets.mjs design/presets/round-1        # writes design/presets/round-1.html
 *
 * The source folder (only presets.json and tokens.css are required; a preset is included as soon
 * as its .html file exists, so you can build and screenshot after every preset):
 *   presets.json    { "project", "round", "lang", "fonts": [stylesheet URLs], "hint",
 *                     "presets": [{ "name", "themes": "light dark" | "light" | "dark", "fonts", "index" }] }
 *   tokens.css      palette.mjs output (--init writes it when you pass --brand)
 *   shared.css      optional CSS for every preset (helpers you'd otherwise repeat); not scoped
 *   p1.html         the page inside the frame: header, main, footer. No html/head/body, style or script tags.
 *   p1.css          the body of `#p1 { … }`: bare declarations style the whole preset (font-family),
 *                   nested rules style its parts. Wrapped automatically. Top-level @keyframes,
 *                   @font-face and @property are moved out unscoped, so prefix their names (p1-rise).
 *   p1.notes.html   the rationale for the notes drawer (h2, p, dl with Layout, Typography, …)
 *   p1.js           optional demo script; runs once with `root` = this preset's section element
 *   symbols.svg     optional extra <symbol> icons for the sprite
 * File numbers follow the preset index: round 1 = p1–p5, round 2 = p6–p10 (or set "index").
 *
 * Zero dependencies, Node 18+. Exit code 1 on errors; warnings don't fail the build.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const SHELL = join(here, '..', 'assets', 'presets-shell.html');
const PALETTE = join(here, 'palette.mjs');

const read = (file) => readFileSync(file, 'utf8');
const readIf = (file) => (existsSync(file) ? read(file) : null);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function parseArgs(argv) {
  const o = { dir: null, init: false, force: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) throw new Error(`Missing value for ${a}`);
      return argv[++i];
    };
    if (a === '--init') o.init = true;
    else if (a === '--project') o.project = next();
    else if (a === '--brand') o.brand = next();
    else if (a === '--mode') o.mode = next();
    else if (a === '--lang') o.lang = next();
    else if (a === '--round') o.round = Number(next());
    else if (a === '--force') o.force = true;
    else if (a === '-h' || a === '--help') o.help = true;
    else if (a.startsWith('--')) throw new Error(`Unknown option ${a}`);
    else o.dir = a.replace(/[\\/]+$/, '');
  }
  return o;
}

// ---------------------------------------------------------------- init
function init(o) {
  if (!o.dir) throw new Error('Pass the folder to create, e.g. design/presets/round-1');
  const round = o.round || Number(basename(o.dir).match(/(\d+)$/)?.[1]) || 1;
  const config = join(o.dir, 'presets.json');
  if (existsSync(config) && !o.force) throw new Error(`${config} exists; pass --force to overwrite it`);
  mkdirSync(o.dir, { recursive: true });
  const themes = o.mode === 'light' || o.mode === 'dark' ? o.mode : 'light dark';
  const json = {
    project: o.project || 'Project name',
    round,
    lang: o.lang || 'en',
    fonts: [],
    hint: '',
    presets: Array.from({ length: 5 }, (_, k) => ({ name: `Direction ${(round - 1) * 5 + k + 1}: name it after its idea`, themes, fonts: '' })),
  };
  writeFileSync(config, JSON.stringify(json, null, 2) + '\n');
  console.log(`wrote ${config}`);
  if (o.brand) {
    const args = [PALETTE, '--brand', o.brand, '--out', join(o.dir, 'tokens.css')];
    if (o.mode) args.push('--mode', o.mode);
    console.log(execFileSync(process.execPath, args, { encoding: 'utf8' }).trim());
  } else if (!existsSync(join(o.dir, 'tokens.css'))) {
    console.log(`next: node ${join(here, 'palette.mjs')} --brand "#hex" --out ${join(o.dir, 'tokens.css')}`);
  }
  console.log(`\nWrite p${(round - 1) * 5 + 1}.html, .css and .notes.html, then run: node ${join(here, 'build-presets.mjs')} ${o.dir}`);
}

// ---------------------------------------------------------------- css scoping
/** Split CSS into top-level chunks (rules, at-rules, bare declarations), respecting comments and strings. */
function topLevelChunks(css) {
  const chunks = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      i = end < 0 ? css.length : end + 1;
    } else if (c === '"' || c === "'") {
      for (i++; i < css.length && css[i] !== c; i++) if (css[i] === '\\') i++;
    } else if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) {
        chunks.push(css.slice(start, i + 1));
        start = i + 1;
      }
    } else if (c === ';' && depth === 0) {
      chunks.push(css.slice(start, i + 1));
      start = i + 1;
    }
  }
  if (css.slice(start).trim()) chunks.push(css.slice(start));
  return chunks;
}

const prelude = (chunk) => chunk.replace(/\/\*[\s\S]*?\*\//g, '').trim();
const GLOBAL_AT_RULES = /^@(keyframes|-webkit-keyframes|font-face|property|counter-style|import|font-feature-values)\b/i;

function scopeCss(css, id, warn) {
  const chunks = topLevelChunks(css);
  const own = new RegExp(`^#${id}(?![\\w-])`);
  if (chunks.some((ch) => own.test(prelude(ch)))) {
    return { global: '', scoped: css.trim(), keyframes: keyframeNames(css) }; // already scoped by hand
  }
  const global = [];
  const scoped = [];
  for (const ch of chunks) {
    const head = prelude(ch);
    if (GLOBAL_AT_RULES.test(head)) global.push(ch.trim());
    else {
      if (/^(:root|html|body)\b/.test(head)) warn(`${id}.css: "${head.split('{')[0].trim()}" can't match inside the preset; style the preset with bare declarations or .ngd-frame`);
      scoped.push(ch.trim());
    }
  }
  const body = scoped.join('\n');
  if (/@(-webkit-)?keyframes\b/.test(body)) warn(`${id}.css: @keyframes inside another rule (an @media block, say) is ignored by browsers; move it to the top level of the file`);
  return {
    global: global.join('\n'),
    scoped: body ? `#${id} {\n${body.replace(/^/gm, '  ')}\n}` : '',
    keyframes: keyframeNames(global.join('\n')),
  };
}

const keyframeNames = (css) => [...css.matchAll(/@(?:-webkit-)?keyframes\s+([\w-]+)/g)].map((m) => m[1]);

// ---------------------------------------------------------------- build
function build(o) {
  if (!o.dir) throw new Error('Pass the source folder, e.g. design/presets/round-1');
  const warnings = [];
  const warn = (m) => warnings.push(m);
  const configFile = join(o.dir, 'presets.json');
  if (!existsSync(configFile)) throw new Error(`${configFile} not found. Start with --init.`);
  let config;
  try {
    config = JSON.parse(read(configFile));
  } catch (e) {
    throw new Error(`${configFile}: ${e.message}`);
  }
  const round = Number(config.round) || 1;
  const project = config.project || 'Project name';
  const tokens = readIf(join(o.dir, 'tokens.css'));
  if (!tokens) throw new Error(`${join(o.dir, 'tokens.css')} not found: generate it with palette.mjs --out`);
  if (!/--color-accent\s*:/.test(tokens)) warn('tokens.css has no --color-accent: is it palette.mjs output?');

  const list = Array.isArray(config.presets) ? config.presets : [];
  if (!list.length) throw new Error('presets.json has no "presets" entries');
  const presets = [];
  const ids = new Map();
  const keyframes = new Map();
  list.forEach((entry, k) => {
    const index = Number(entry.index) || (round - 1) * 5 + k + 1;
    const id = `p${index}`;
    const html = readIf(join(o.dir, `${id}.html`));
    if (html == null) {
      warn(`${id}: no ${id}.html yet, skipped`);
      return;
    }
    if (/<(html|head|body)\b/i.test(html)) warn(`${id}.html: contains html/head/body tags; it should hold only the page inside the frame`);
    if (/<style\b/i.test(html)) warn(`${id}.html: move <style> rules into ${id}.css so they are scoped`);
    if (/<script\b/i.test(html)) warn(`${id}.html: move scripts into ${id}.js`);
    for (const m of html.matchAll(/\sid="([^"]+)"/g)) {
      if (ids.has(m[1]) && ids.get(m[1]) !== id) warn(`id "${m[1]}" is used in ${ids.get(m[1])} and ${id}; prefix ids per preset (${id}-${m[1]}) so labels and links stay unique`);
      ids.set(m[1], id);
    }
    const css = scopeCss(readIf(join(o.dir, `${id}.css`)) ?? '', id, warn);
    for (const name of css.keyframes) {
      if (keyframes.has(name)) warn(`@keyframes ${name} is defined in ${keyframes.get(name)} and ${id}; prefix keyframe names with the preset id`);
      keyframes.set(name, id);
    }
    const rawColors = (readIf(join(o.dir, `${id}.css`)) ?? '').replace(/\/\*[\s\S]*?\*\//g, '').match(/#[0-9a-f]{3,8}\b/gi) ?? [];
    if (rawColors.length > 6) warn(`${id}.css: ${rawColors.length} raw hex colors; use the tokens so light/dark and the final build stay consistent`);
    let notes = readIf(join(o.dir, `${id}.notes.html`));
    if (!notes) {
      warn(`${id}: no ${id}.notes.html; the notes drawer will be empty`);
      notes = `<h2>${index} · ${esc(entry.name || '')}</h2><p>Notes still to be written.</p>`;
    }
    const themes = entry.themes || 'light dark';
    if (!/^(light|dark)( (light|dark))?$/.test(themes)) warn(`${id}: themes should be "light dark", "light" or "dark"`);
    if (!entry.name || /name it after its idea/i.test(entry.name)) warn(`${id}: give the preset a name in presets.json`);
    presets.push({ id, index, name: entry.name || `Preset ${index}`, themes, html, css, notes, js: readIf(join(o.dir, `${id}.js`)), fonts: entry.fonts });
  });
  if (!presets.length) throw new Error('No preset has its .html file yet');

  let shell = read(SHELL);
  const replaceOne = (find, repl, label) => {
    const count = typeof find === 'string' ? shell.split(find).length - 1 : (shell.match(new RegExp(find.source, find.flags.includes('g') ? find.flags : find.flags + 'g')) ?? []).length;
    if (count !== 1) throw new Error(`presets-shell.html: expected one ${label}, found ${count}`);
    shell = shell.replace(find, () => repl);
  };

  // fonts
  const fontUrls = [...new Set([config.fonts, ...presets.map((p) => p.fonts)].flat().filter((u) => typeof u === 'string' && u.trim()))];
  const google = fontUrls.some((u) => u.includes('fonts.googleapis.com'));
  const fontLinks = [
    google ? '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' : '',
    ...fontUrls.map((u) => `<link rel="stylesheet" href="${esc(u)}">`),
  ].filter(Boolean).join('\n');
  if (!fontUrls.length) warn('no fonts in presets.json: the presets will use system fonts');

  replaceOne(/<!-- ngd:fonts[^>]*-->/, fontLinks || '<!-- no web fonts -->', 'fonts marker');
  replaceOne(/<html lang="[^"]*">/, `<html lang="${esc(config.lang || 'en')}">`, 'html element');
  replaceOne(/<title>[^<]*<\/title>/, `<title>${esc(project)}: design presets, round ${round}</title>`, 'title');
  replaceOne(/<span class="ngd-brand">[^<]*<\/span>/, `<span class="ngd-brand">${esc(project)}</span>`, 'toolbar name');
  replaceOne(/<span class="ngd-round">[^<]*<\/span>/, `<span class="ngd-round">Round ${round}</span>`, 'round label');
  replaceOne(/<style id="tokens">[\s\S]*?<\/style>/, `<style id="tokens">\n${tokens.trim()}\n</style>`, 'tokens style');

  const shared = readIf(join(o.dir, 'shared.css'));
  const styles = [
    shared ? `/* shared.css */\n${shared.trim()}` : '',
    ...presets.map((p) => [`/* ${p.index} · ${p.name} */`, p.css.global, p.css.scoped].filter(Boolean).join('\n')),
  ].filter(Boolean).join('\n\n');
  replaceOne(/<style id="preset-styles">[\s\S]*?<\/style>/, `<style id="preset-styles">\n${styles}\n</style>`, 'preset-styles style');

  const symbols = readIf(join(o.dir, 'symbols.svg'));
  if (symbols) {
    const defs = symbols.match(/<symbol\b[\s\S]*?<\/symbol>/g) ?? [];
    if (!defs.length) warn('symbols.svg has no <symbol> elements');
    replaceOne('<!-- ngd:symbols -->', defs.map((d) => `  ${d.trim()}`).join('\n'), 'symbols marker');
  }

  const indent = (s, n) => s.trim().replace(/^/gm, ' '.repeat(n));
  const sections = presets
    .map(
      (p) => `<section class="ngd-preset" id="${p.id}" data-index="${p.index}" data-name="${esc(p.name)}" data-themes="${esc(p.themes)}">
  <div class="ngd-frame">
${indent(p.html, 4)}
  </div>
  <template class="notes">
${indent(p.notes, 4)}
  </template>
</section>`,
    )
    .join('\n\n');
  replaceOne(/<!-- ngd:presets:start -->[\s\S]*?<!-- ngd:presets:end -->/, sections, 'presets markers');

  if (config.hint) replaceOne(/<p class="ngd-hint">[\s\S]*?<\/p>/, `<p class="ngd-hint">${config.hint}</p>`, 'hint');

  const scripts = [
    readIf(join(o.dir, 'script.js')),
    ...presets.filter((p) => p.js).map((p) => `(() => {\n  const root = document.getElementById('${p.id}');\n${indent(p.js, 2)}\n})();`),
  ].filter(Boolean);
  replaceOne('<!-- ngd:scripts -->', scripts.length ? `<script>\n${scripts.join('\n\n')}\n</script>` : '', 'scripts marker');

  const out = `${o.dir}.html`;
  writeFileSync(out, shell);
  const kb = Buffer.byteLength(shell) / 1024;
  if (kb > 150) warn(`${out} is ${kb.toFixed(0)} KB (aim for under ~150 KB): trim repeated markup or move it into shared.css`);
  console.log(`wrote ${out} (${kb.toFixed(1)} KB) with ${presets.length} preset(s): ${presets.map((p) => `${p.index} ${p.name}`).join(' · ')}`);
  if (warnings.length) {
    console.log(`\n${warnings.length} warning(s):`);
    for (const w of warnings) console.log(`  - ${w}`);
  }
  console.log(`\nCheck it: node ${join(here, 'screenshot.mjs')} ${out} --presets`);
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  if (o.help || !o.dir) {
    console.log(
      'Usage: node build-presets.mjs --init <dir> --project "Name" --brand "#hex" [--mode light|dark|both] [--lang en]\n' +
        '       node build-presets.mjs <dir>          (writes <dir>.html)',
    );
    process.exit(o.help ? 0 : 2);
  }
  if (o.init) init(o);
  else build(o);
}

try {
  main();
} catch (e) {
  console.error(`build-presets.mjs: ${e.message ?? e}`);
  process.exit(1);
}
