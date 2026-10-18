#!/usr/bin/env node
/**
 * NGD screenshot helper — capture presets or pages at real device widths and report runtime errors.
 *
 *   node screenshot.mjs design/presets/round-1.html --presets            # every preset, desktop + mobile
 *   node screenshot.mjs http://localhost:5173/ /pricing /contact          # pages at 390, 768, 1440
 *   node screenshot.mjs http://localhost:5173/ --theme dark --full
 *
 * Options:
 *   --out <dir>        output directory (default: design/screenshots)
 *   --widths a,b,c     viewport widths for pages (default: 390,768,1440)
 *   --full             full-page screenshots (default: first 2 screens, which is what people judge)
 *   --theme light|dark emulate prefers-color-scheme (default: light)
 *   --presets          treat the input as an NGD presets file and capture each preset
 *   --wait <ms>        extra wait after load (default: 600)
 *
 * Needs Playwright with Chromium. If it is missing:  npm i -D playwright && npx playwright install chromium
 * Exit code 1 if any page logged an uncaught error or failed to load, so it doubles as a smoke test.
 */
import { mkdirSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {}
  const require = createRequire(import.meta.url);
  const roots = [process.cwd()];
  try {
    roots.push(execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim());
  } catch {}
  for (const name of ['playwright', '@playwright/test']) {
    try {
      return require(require.resolve(name, { paths: roots }));
    } catch {}
  }
  console.error('Playwright not found. Install it with:  npm i -D playwright && npx playwright install chromium');
  process.exit(2);
}

function parseArgs(argv) {
  const o = { inputs: [], out: 'design/screenshots', widths: [390, 768, 1440], full: false, theme: 'light', presets: false, wait: 600 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') o.out = argv[++i];
    else if (a === '--widths') o.widths = argv[++i].split(',').map(Number).filter(Boolean);
    else if (a === '--full') o.full = true;
    else if (a === '--theme') o.theme = argv[++i];
    else if (a === '--presets') o.presets = true;
    else if (a === '--wait') o.wait = Number(argv[++i]);
    else if (a.startsWith('--')) throw new Error(`Unknown option ${a}`);
    else o.inputs.push(a);
  }
  if (!o.inputs.length) throw new Error('Pass a presets file, a URL, or a base URL followed by paths.');
  return o;
}

const toUrl = (input) => (/^https?:\/\//.test(input) || input.startsWith('file:') ? input : pathToFileURL(resolve(input)).href);
const slug = (s) => s.replace(/^https?:\/\/[^/]+/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';

async function capturePresets(browser, o) {
  const url = toUrl(o.inputs[0]);
  const files = [];
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1472, height: 900 }, colorScheme: o.theme });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(o.wait);
  const presets = await page.$$eval('.preset', (els) => els.map((el) => ({ index: el.dataset.index, name: el.dataset.name || '' })));
  if (!presets.length) throw new Error('No .preset sections found — is this an NGD presets file?');
  for (const p of presets) {
    for (const view of ['desktop', 'mobile']) {
      await page.setViewportSize(view === 'desktop' ? { width: 1472, height: 900 } : { width: 430, height: 900 });
      await page.goto(`${url.split('#')[0]}#preset=${p.index}${view === 'desktop' ? '' : '&view=mobile'}`);
      await page.reload({ waitUntil: 'load' });
      await page.waitForTimeout(o.wait);
      const frame = page.locator('.preset.is-active .frame');
      const box = await frame.boundingBox();
      const maxH = o.full ? box.height : Math.min(box.height, view === 'desktop' ? 1800 : 1700);
      const file = `${o.out}/preset-${p.index}-${view}.png`;
      await page.screenshot({ path: file, fullPage: true, clip: { x: box.x, y: box.y, width: box.width, height: maxH } });
      files.push({ preset: `${p.index} ${p.name}`, view, file, height: Math.round(box.height) });
    }
  }
  await page.close();
  return { files, errors };
}

async function capturePages(browser, o) {
  const [first, ...rest] = o.inputs;
  const targets = rest.length && !/^https?:/.test(rest[0]) ? [first, ...rest.map((p) => new URL(p, first).href)] : o.inputs.map(toUrl);
  const files = [];
  const errors = [];
  for (const target of targets) {
    for (const width of o.widths) {
      const page = await browser.newPage({ viewport: { width, height: width < 600 ? 844 : 900 }, colorScheme: o.theme });
      page.on('pageerror', (e) => errors.push(`${target} @${width}: ${e.message}`));
      page.on('console', (m) => m.type() === 'error' && errors.push(`${target} @${width}: console.error ${m.text()}`));
      const res = await page.goto(target, { waitUntil: 'load' }).catch((e) => errors.push(`${target}: ${e.message}`));
      if (res && res.status() >= 400) errors.push(`${target}: HTTP ${res.status()}`);
      await page.waitForTimeout(o.wait);
      const file = `${o.out}/${slug(target)}-${width}${o.theme === 'dark' ? '-dark' : ''}.png`;
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      await page.screenshot({ path: file, fullPage: true, clip: o.full ? undefined : { x: 0, y: 0, width, height: Math.min(height, (width < 600 ? 844 : 900) * 2) } });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 1) errors.push(`${target} @${width}: horizontal overflow of ${overflow}px`);
      files.push({ page: target, width, file });
      await page.close();
    }
  }
  return { files, errors };
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  mkdirSync(o.out, { recursive: true });
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch();
  try {
    const { files, errors } = o.presets ? await capturePresets(browser, o) : await capturePages(browser, o);
    for (const f of files) console.log(`saved ${f.file}${f.preset ? `  (${f.preset}, ${f.view}, frame ${f.height}px tall)` : ''}`);
    const problems = [...new Set(errors)];
    if (problems.length) {
      console.log(`\n${problems.length} problem(s):`);
      for (const e of problems) console.log(`  - ${e}`);
      process.exitCode = 1;
    } else {
      console.log(`\nNo runtime errors in ${basename(o.inputs[0])}.`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`screenshot.mjs: ${e.message ?? e}`);
  process.exit(1);
});
