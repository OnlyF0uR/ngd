#!/usr/bin/env node
/**
 * NGD project audit — checks a React Router + Cloudflare Workers project against the NGD rules.
 * Heuristic and fast; it complements (doesn't replace) typecheck, build, screenshots and Lighthouse.
 *
 *   node ngd-audit.mjs [projectDir]          # run after `npm run build` for the HTML checks
 *   node ngd-audit.mjs . --offline           # skip the npm "latest version" lookup
 *
 * Exit code 1 when any FAIL is reported.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname, basename } from 'node:path';
import { execSync } from 'node:child_process';

const args = process.argv.slice(2);
const root = args.find((a) => !a.startsWith('--')) ?? '.';
const offline = args.includes('--offline');
const results = [];
const report = (level, check, detail = '') => results.push({ level, check, detail });
const pass = (c, d) => report('PASS', c, d);
const warn = (c, d) => report('WARN', c, d);
const fail = (c, d) => report('FAIL', c, d);

const read = (p) => readFileSync(join(root, p), 'utf8');
const exists = (p) => existsSync(join(root, p));

function walk(dir, filter, out = []) {
  const abs = join(root, dir);
  if (!existsSync(abs)) return out;
  for (const name of readdirSync(abs)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const rel = join(dir, name);
    if (statSync(join(root, rel)).isDirectory()) walk(rel, filter, out);
    else if (filter(rel)) out.push(rel);
  }
  return out;
}

// ------------------------------------------------------------------ dependencies and versions
if (!exists('package.json')) {
  console.error(`No package.json in ${root}`);
  process.exit(2);
}
const pkg = JSON.parse(read('package.json'));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };

const installed = (name) => {
  try {
    return JSON.parse(read(`node_modules/${name}/package.json`)).version;
  } catch {
    return undefined;
  }
};

const rrVersion = installed('react-router');
if (!deps['react-router']) fail('React Router', 'react-router is not a dependency');
else if (!offline) {
  try {
    const latest = execSync('npm view react-router version', { stdio: ['ignore', 'pipe', 'ignore'], timeout: 20000 }).toString().trim();
    const [lMaj, lMin] = latest.split('.').map(Number);
    const [iMaj, iMin] = (rrVersion ?? '0.0.0').split('.').map(Number);
    if (iMaj < lMaj) fail('React Router is the latest version', `installed ${rrVersion}, latest ${latest} (major behind)`);
    else if (iMaj === lMaj && iMin < lMin) warn('React Router is the latest version', `installed ${rrVersion}, latest ${latest}`);
    else pass('React Router is the latest version', `${rrVersion}`);
  } catch {
    warn('React Router is the latest version', 'could not reach npm (use --offline to skip)');
  }
} else if (rrVersion && Number(rrVersion.split('.')[0]) < 8) {
  fail('React Router is the latest version', `installed ${rrVersion}; v8 or newer is required (run without --offline to compare with npm)`);
} else pass('React Router installed', rrVersion ?? 'not installed yet');

if (deps['react-router-dom']) fail('No react-router-dom', 'removed in v8: import from react-router');
for (const name of ['@react-router/node', '@react-router/serve', '@react-router/express']) {
  if (deps[name]) fail('No Node server packages in a Workers app', `${name} switches the app to the Node entry`);
}
if (!deps['@cloudflare/vite-plugin']) fail('Cloudflare Vite plugin', '@cloudflare/vite-plugin missing');
const styleLibs = ['tailwindcss', '@tailwindcss/vite', 'styled-components', '@emotion/react', '@emotion/styled', '@mui/material', '@chakra-ui/react', 'bootstrap'];
const foundStyleLibs = styleLibs.filter((n) => deps[n]);
if (foundStyleLibs.length) fail('Styling is CSS Modules only', `remove ${foundStyleLibs.join(', ')}`);
else pass('Styling is CSS Modules only');

// ------------------------------------------------------------------ source checks
const sourceFiles = walk('app', (f) => /\.(tsx?|jsx?)$/.test(f));
const cssModules = walk('app', (f) => f.endsWith('.module.css'));
const plainCss = walk('app', (f) => f.endsWith('.css') && !f.endsWith('.module.css'));
const allWorkerFiles = [...sourceFiles, ...walk('workers', (f) => /\.(tsx?|jsx?)$/.test(f))];

const grepFiles = (files, regex) => files.flatMap((f) => (regex.test(read(f)) ? [f] : []));

const v7Context = grepFiles(allWorkerFiles, /context\.cloudflare\b|AppLoadContext|getLoadContext/);
if (v7Context.length) fail('No React Router v7 Cloudflare context patterns', v7Context.join(', '));
else pass('Typed v8 context (no context.cloudflare / AppLoadContext)');

for (const cfg of ['react-router.config.ts', 'react-router.config.js']) {
  if (exists(cfg) && /\bv8_|unstable_/.test(read(cfg))) fail('No removed future flags', `${cfg} contains v8_/unstable_ flags`);
}

// global stylesheet budget
const globals = plainCss.filter((f) => !f.endsWith('tokens.css'));
for (const f of globals) {
  const text = read(f);
  const kb = Buffer.byteLength(text) / 1024;
  const lines = text.split('\n').length;
  if (kb > 12) fail('global.css within budget (≈8 KB)', `${f}: ${kb.toFixed(1)} KB, ${lines} lines: move component styles into modules`);
  else if (kb > 8) warn('global.css within budget (≈8 KB)', `${f}: ${kb.toFixed(1)} KB, ${lines} lines`);
  else pass('global.css within budget (≈8 KB)', `${f}: ${kb.toFixed(1)} KB`);
}
if (globals.length > 1) warn('One global stylesheet', `found ${globals.join(', ')}`);

// plain CSS imports outside root
const cssImportOffenders = sourceFiles.filter((f) => {
  if (basename(f) === 'root.tsx') return false;
  return /import\s+['"][^'"]+(?<!\.module)\.css(\?url)?['"]/.test(read(f)) && !/@fontsource/.test(read(f));
});
if (cssImportOffenders.length) fail('Plain .css imported only in root.tsx', cssImportOffenders.join(', '));
else pass('Plain .css imported only in root.tsx');

// components and routes have modules; inline styles; raw colors
if (cssModules.length === 0) fail('CSS Modules in use', 'no .module.css files found');
else pass('CSS Modules in use', `${cssModules.length} modules`);

const inlineStyle = sourceFiles.filter((f) => /style=\{\{(?![^}]*--)/.test(read(f)));
if (inlineStyle.length) warn('No inline styles (except custom properties)', inlineStyle.join(', '));

const rawColors = cssModules.filter((f) => /(?<![\w-])#[0-9a-fA-F]{3,8}\b|rgb\(\s*\d/.test(read(f).replace(/\/\*[\s\S]*?\*\//g, '')));
if (rawColors.length) warn('Modules use color tokens, not raw values', rawColors.join(', '));
else pass('Modules use color tokens, not raw values');

const lorem = grepFiles([...sourceFiles, ...cssModules], /lorem ipsum/i);
if (lorem.length) fail('No lorem ipsum', lorem.join(', '));

// routes: meta on UI routes
const routeFiles = walk('app/routes', (f) => /\.tsx$/.test(f));
const missingMeta = routeFiles.filter((f) => {
  const t = read(f);
  const isUi = /export default function/.test(t);
  const isLayout = /<Outlet/.test(t);
  return isUi && !isLayout && !/export (const|function|async function) meta\b/.test(t);
});
if (missingMeta.length) warn('UI routes export meta (title, description, canonical)', missingMeta.join(', '));
else if (routeFiles.length) pass('UI routes export meta');

// sitemap and robots
const routesTs = exists('app/routes.ts') ? read('app/routes.ts') : '';
if (!/sitemap\.xml/.test(routesTs) && !exists('public/sitemap.xml')) fail('sitemap.xml', 'no sitemap route or file');
else pass('sitemap.xml present');
if (!/robots\.txt/.test(routesTs) && !exists('public/robots.txt')) fail('robots.txt', 'no robots route or file');
else pass('robots.txt present');

// wrangler + headers + secrets hygiene
const wranglerFile = ['wrangler.jsonc', 'wrangler.json', 'wrangler.toml'].find(exists);
if (!wranglerFile) fail('Wrangler config', 'no wrangler.jsonc/json/toml');
else {
  const w = read(wranglerFile);
  if (!/compatibility_date/.test(w)) fail('Wrangler compatibility_date', wranglerFile);
  else pass('Wrangler config', wranglerFile);
  if (exists('build/client/index.html') && !/html_handling/.test(w)) warn('Prerendered pages: assets.html_handling set', 'default redirects /about to /about/');
}
if (!exists('public/_headers') || !/immutable/.test(read('public/_headers'))) warn('Long-term caching for /assets/*', 'add public/_headers with Cache-Control immutable');
else pass('Long-term caching for /assets/*');
if (exists('.gitignore') && !/\.dev\.vars/.test(read('.gitignore'))) fail('.dev.vars is git-ignored', 'secrets could be committed');

// ------------------------------------------------------------------ built HTML (prerendered pages)
const htmlFiles = walk('build/client', (f) => f.endsWith('.html') && !basename(f).startsWith('__'));
if (!htmlFiles.length) warn('Prerendered HTML checks', 'no build/client/*.html (run `npm run build` first, or nothing is prerendered)');
const prerenderedPaths = new Set(
  htmlFiles.map((f) => '/' + relative('build/client', f).replace(/\\/g, '/').replace(/(^|\/)index\.html$/, '').replace(/\.html$/, '')),
);
for (const f of htmlFiles) {
  const html = read(f);
  const page = '/' + relative('build/client', f).replace(/\\/g, '/').replace(/(^|\/)index\.html$/, '');
  const problems = [];
  const soft = [];
  if (!/<html[^>]*\slang="[^"]+"/.test(html)) problems.push('missing <html lang>');
  if (!/<title>[^<]{10,}<\/title>/.test(html)) problems.push('missing or too short <title>');
  if (!/<meta name="description" content="[^"]{50,}"/.test(html)) problems.push('missing/short meta description');
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (!canonical) problems.push('missing canonical');
  else if (/localhost|127\.0\.0\.1/.test(canonical)) problems.push(`canonical points to ${canonical}`);
  const h1s = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1s !== 1 && !/name="robots" content="noindex/.test(html)) problems.push(`${h1s} <h1> elements`);
  if (!/property="og:image"/.test(html)) soft.push('no og:image');
  const imgsWithoutSize = (html.match(/<img(?![^>]*\bwidth=)[^>]*>/g) ?? []).length;
  if (imgsWithoutSize) soft.push(`${imgsWithoutSize} <img> without width/height`);
  if (Buffer.byteLength(html) > 1.5 * 1024 * 1024) problems.push('HTML over 1.5 MB (Googlebot reads 2 MB)');
  for (const m of html.matchAll(/<form[^>]*method="post"[^>]*>/gi)) {
    const action = m[0].match(/action="([^"]*)"/)?.[1] ?? page;
    const target = action.split('?')[0].replace(/\/$/, '') || '/';
    if (prerenderedPaths.has(target)) problems.push(`form posts to prerendered ${target} (static paths answer POST with 405)`);
  }
  if (problems.length) fail(`Prerendered ${page}`, problems.join('; '));
  else pass(`Prerendered ${page}`, soft.join('; '));
  if (soft.length && !problems.length) warn(`Prerendered ${page}`, soft.join('; '));
}

// ------------------------------------------------------------------ output
const order = { FAIL: 0, WARN: 1, PASS: 2 };
results.sort((a, b) => order[a.level] - order[b.level]);
for (const r of results) console.log(`${r.level.padEnd(4)}  ${r.check}${r.detail ? `: ${r.detail}` : ''}`);
const fails = results.filter((r) => r.level === 'FAIL').length;
const warns = results.filter((r) => r.level === 'WARN').length;
console.log(`\n${fails} fail, ${warns} warn, ${results.length - fails - warns} pass`);
process.exitCode = fails ? 1 : 0;
