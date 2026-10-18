#!/usr/bin/env node
/**
 * NGD screenshot helper — capture presets or pages at real device widths and report runtime errors.
 *
 *   node screenshot.mjs design/presets/round-1.html --presets            # every preset, desktop + mobile
 *   node screenshot.mjs design/presets/round-1.html --presets --theme both
 *   node screenshot.mjs http://localhost:5173/ /pricing /contact          # pages at 390, 768, 1440
 *   node screenshot.mjs http://localhost:5173/ --theme dark --full
 *
 * Options:
 *   --out <dir>        output directory (default: design/screenshots; presets: <presets dir>/shots)
 *   --widths a,b,c     viewport widths for pages (default: 390,768,1440)
 *   --height <px>      viewport height (default: 844 below 600px wide, else 900); e.g. 630 for a 1200×630 OG image
 *   --screens <n>      how many viewport heights to capture (default: 2); --full captures the whole page.
 *                      Presets: the top of each preset and of each part (a .ngd-part divider, such as a
 *                      product page) is captured up to about two screens, so nothing important is missed
 *   --full             full-page screenshots
 *   --theme light|dark|both  emulate prefers-color-scheme (default: light; dark files get a -dark suffix)
 *   --motion           keep animations (default: reduced motion, so scroll reveals don't hide content)
 *   --presets          treat the input as an NGD presets file and capture each preset
 *   --views a,b        presets: which viewer views to capture (default: desktop,mobile; add tablet for 820px)
 *   --wait <ms>        extra wait after load (default: 600)
 *
 * Needs Playwright with Chromium. If it is missing:  npm i -D playwright && npx playwright install chromium
 * Exit code 1 on runtime errors, failed loads, horizontal overflow and (presets) problems in the file itself,
 * so it doubles as a smoke test. It can't judge design: look at the screenshots.
 */
import { mkdirSync } from 'node:fs';
import { resolve, basename, dirname, join } from 'node:path';
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
  const o = { inputs: [], out: undefined, widths: [390, 768, 1440], height: undefined, screens: 2, full: false, theme: 'light', motion: false, presets: false, wait: 600, views: ['desktop', 'mobile'] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') o.out = argv[++i];
    else if (a === '--widths') o.widths = argv[++i].split(',').map(Number).filter(Boolean);
    else if (a === '--full') o.full = true;
    else if (a === '--height') o.height = Number(argv[++i]);
    else if (a === '--screens') o.screens = Math.max(1, Number(argv[++i]) || 1);
    else if (a === '--motion') o.motion = true;
    else if (a === '--theme') o.theme = argv[++i];
    else if (a === '--presets') o.presets = true;
    else if (a === '--views') o.views = argv[++i].split(',').map((v) => v.trim()).filter((v) => ['desktop', 'tablet', 'mobile'].includes(v));
    else if (a === '--wait') o.wait = Number(argv[++i]);
    else if (a.startsWith('--')) throw new Error(`Unknown option ${a}`);
    else o.inputs.push(a);
  }
  if (!o.inputs.length) throw new Error('Pass a presets file, a URL, or a base URL followed by paths.');
  if (!['light', 'dark', 'both'].includes(o.theme)) throw new Error('--theme must be light, dark or both');
  o.out ??= o.presets ? join(dirname(o.inputs[0]), 'shots') : 'design/screenshots';
  return o;
}

const toUrl = (input) => (/^https?:\/\//.test(input) || input.startsWith('file:') ? input : pathToFileURL(resolve(input)).href);
const slug = (s) => s.replace(/^https?:\/\/[^/]+/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';

// Checks on the presets file itself: a broken head or leftover shell content shows up here, not as a runtime error.
function presetFileIssues() {
  const issues = [];
  if (!document.querySelector('meta[name="viewport"]')) issues.push('no viewport meta tag: the head is broken (a fill script may have matched a comment)');
  if (!document.querySelector('meta[charset]')) issues.push('no charset meta tag');
  if (/^Project name/.test(document.title)) issues.push('the title still says "Project name"');
  if ((document.getElementById('tokens')?.textContent ?? '').includes('ngd:fallback-tokens')) issues.push('the tokens are still the shell fallback: use the palette.mjs output');
  if (!getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim()) issues.push('--color-accent is not defined');
  const presets = document.querySelectorAll('.ngd-preset');
  presets.forEach((p) => {
    if (!p.dataset.name) issues.push(`${p.id}: no data-name`);
    if (!p.querySelector('.ngd-frame')) issues.push(`${p.id}: no .ngd-frame`);
    if (!p.querySelector('template.notes')) issues.push(`${p.id}: no notes template`);
  });
  const owner = new Map();
  for (const el of document.querySelectorAll('.ngd-frame [id]')) {
    const preset = el.closest('.ngd-preset')?.id;
    if (owner.has(el.id) && owner.get(el.id) !== preset) issues.push(`id "${el.id}" appears in ${owner.get(el.id)} and ${preset}: prefix ids per preset`);
    owner.set(el.id, preset);
  }
  return [...new Set(issues)];
}

// In-flow elements that stick out of the active frame (the frame clips them, so the page itself never scrolls).
function frameOverflow() {
  const frame = document.querySelector('.ngd-preset.is-active .ngd-frame');
  if (!frame) return [];
  const fr = frame.getBoundingClientRect();
  const found = [];
  for (const el of frame.querySelectorAll('*')) {
    if (found.some((f) => f.el.contains(el))) continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) continue;
    const over = Math.max(r.right - fr.right, fr.left - r.left);
    if (over <= 1) continue;
    const cs = getComputedStyle(el);
    if (cs.position === 'absolute' || cs.position === 'fixed' || cs.visibility === 'hidden' || el.closest('[aria-hidden="true"]')) continue;
    let clipped = false;
    for (let a = el.parentElement; a && a !== frame; a = a.parentElement) {
      if (getComputedStyle(a).overflowX !== 'visible') {
        clipped = true;
        break;
      }
    }
    if (clipped) continue;
    const cls = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : '';
    found.push({ el, text: `${el.tagName.toLowerCase()}${cls} sticks out ${Math.round(over)}px` });
    if (found.length >= 3) break;
  }
  return found.map((f) => f.text);
}

async function capturePresets(browser, o) {
  const url = toUrl(o.inputs[0]);
  const files = [];
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1472, height: 900 }, colorScheme: o.theme, reducedMotion: o.motion ? 'no-preference' : 'reduce' });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && errors.push(`console.error: ${m.text()}`));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(o.wait);
  const presets = await page.$$eval('.ngd-preset', (els) =>
    els.map((el) => ({ index: el.dataset.index, name: el.dataset.name || '', themes: (el.dataset.themes || 'light dark').split(/\s+/) })),
  );
  if (!presets.length) throw new Error('No .ngd-preset sections found. Build the file with build-presets.mjs, or fill the presets shell.');
  errors.push(...(await page.evaluate(presetFileIssues)));
  const suffix = o.theme === 'dark' ? '-dark' : '';
  for (const p of presets) {
    if (!p.themes.includes(o.theme)) continue; // a light-only preset has no dark variant to capture
    for (const view of o.views) {
      await page.setViewportSize({ width: { desktop: 1472, tablet: 900, mobile: 430 }[view], height: 900 });
      await page.goto(`${url.split('#')[0]}#preset=${p.index}${view === 'desktop' ? '' : `&view=${view}`}`);
      await page.reload({ waitUntil: 'load' });
      await page.waitForTimeout(o.wait);
      const frame = page.locator('.ngd-preset.is-active .ngd-frame');
      const box = await frame.boundingBox();
      if (!box) {
        errors.push(`preset ${p.index}: the frame is not visible`);
        continue;
      }
      for (const issue of await page.evaluate(frameOverflow)) errors.push(`preset ${p.index} (${view}): ${issue}`);
      // One capture per part: the top of the preset, then each .ngd-part divider (a product page, a detail screen).
      const parts = await page.$$eval('.ngd-preset.is-active .ngd-part', (els) =>
        els.map((el) => ({ label: el.dataset.part || 'part', y: el.getBoundingClientRect().top + window.scrollY })),
      );
      const top = box.y;
      const bottom = box.y + box.height;
      const starts = [{ label: '', y: top }, ...parts.filter((part) => part.y > top && part.y < bottom)];
      const cap = view === 'mobile' ? 1700 : 1800;
      for (const [k, part] of starts.entries()) {
        const end = o.full ? (starts[k + 1]?.y ?? bottom) : Math.min(starts[k + 1]?.y ?? bottom, part.y + cap);
        const name = part.label ? `-${part.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}` : '';
        const file = `${o.out}/preset-${p.index}-${view}${name}${suffix}.png`;
        await page.screenshot({ path: file, fullPage: true, clip: { x: box.x, y: part.y, width: box.width, height: Math.max(1, end - part.y) } });
        files.push({ preset: `${p.index} ${p.name}${part.label ? ` / ${part.label}` : ''}`, view, file, height: Math.round(box.height) });
      }
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
      const viewportHeight = o.height ?? (width < 600 ? 844 : 900);
      const page = await browser.newPage({
        viewport: { width, height: viewportHeight },
        colorScheme: o.theme,
        reducedMotion: o.motion ? 'no-preference' : 'reduce',
      });
      page.on('pageerror', (e) => errors.push(`${target} @${width}: ${e.message}`));
      page.on('console', (m) => m.type() === 'error' && errors.push(`${target} @${width}: console.error ${m.text()}`));
      const res = await page.goto(target, { waitUntil: 'load' }).catch((e) => {
        errors.push(`${target}: ${e.message}`);
        return null;
      });
      if (res && res.status() >= 400) errors.push(`${target}: HTTP ${res.status()}`);
      await page.waitForTimeout(o.wait);
      const file = `${o.out}/${slug(target)}-${width}${o.theme === 'dark' ? '-dark' : ''}.png`;
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      await page.screenshot({ path: file, fullPage: true, clip: o.full ? undefined : { x: 0, y: 0, width, height: Math.min(height, viewportHeight * o.screens) } });
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
    const files = [];
    const errors = [];
    for (const theme of o.theme === 'both' ? ['light', 'dark'] : [o.theme]) {
      const run = o.presets ? await capturePresets(browser, { ...o, theme }) : await capturePages(browser, { ...o, theme });
      files.push(...run.files);
      errors.push(...run.errors);
    }
    for (const f of files) console.log(`saved ${f.file}${f.preset ? `  (${f.preset}, ${f.view}, frame ${f.height}px tall)` : ''}`);
    const problems = [...new Set(errors)];
    if (problems.length) {
      console.log(`\n${problems.length} problem(s):`);
      for (const e of problems) console.log(`  - ${e}`);
      process.exitCode = 1;
    } else {
      console.log(`\nNo problems found in ${basename(o.inputs[0])}${o.presets ? ' (runtime errors, file checks, overflow inside the frame)' : ' (runtime errors, HTTP status, horizontal overflow)'}. Now look at the screenshots.`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`screenshot.mjs: ${e.message ?? e}`);
  process.exit(1);
});
