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
 * Exit code 1 on runtime errors, failed loads, horizontal overflow, (presets) problems in the file itself, and
 * website layout problems: sections boxed in a centred column at desktop width, breadcrumb trails, pills or chips
 * above headings, and (presets) more than one copy-beside-image split hero. Layout checks skip noindex pages and app-shell (panel) presets.
 * It doubles as a smoke test, but it can't judge design: look at the screenshots.
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

// Website layout checks (design-language.md sections 5 and 7), which screenshots make easy to miss: sections boxed
// in a centred column, a hero with the copy beside an image, a breadcrumb trail, a pill or chip above a heading.
// Runs in the page, so it is self-contained.
function websiteLayout({ selector, skipAppShell }) {
  const root = selector ? document.querySelector(selector) : document.body;
  if (!root || (skipAppShell && root.querySelector('aside nav, [class*="sidebar" i]'))) return null; // a panel shell
  const frame = root.getBoundingClientRect();
  const W = frame.width;
  const box = (el, keepAbsolute = false) => {
    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) return null;
    if (r.right <= frame.left || r.left >= frame.right) return null; // parked off-screen (honeypot fields, skip links)
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || (!keepAbsolute && (cs.position === 'absolute' || cs.position === 'fixed'))) return null;
    return r;
  };
  const main = root.querySelector('main');
  let sections = main ? [...main.children] : [...root.children];
  while (sections.length === 1 && sections[0].children.length && !sections[0].matches('section, article, form')) sections = [...sections[0].children];
  const outsideMain = (el) => !main || !main.contains(el);
  const header = [...root.querySelectorAll('header')].find(outsideMain);
  const footer = [...root.querySelectorAll('footer')].reverse().find(outsideMain);
  const blocks = [header, ...sections, footer].filter(Boolean);
  const result = { boxed: null, splitHero: false, crumbs: null, pills: [] };

  // Boxed: at least three blocks, and half of them, have content inset well past the gutter on both sides, symmetrically
  if (W >= 1200) {
    const leaves = 'h1,h2,h3,h4,h5,h6,p,li,a,button,img,video,svg,input,select,textarea,blockquote,figure,table,.ph';
    let measured = 0;
    const insets = [];
    for (const b of blocks) {
      let l = Infinity;
      let r = -Infinity;
      for (const el of b.querySelectorAll(leaves)) {
        const rect = box(el);
        if (!rect) continue;
        l = Math.min(l, rect.left - frame.left);
        r = Math.max(r, rect.right - frame.left);
      }
      if (!Number.isFinite(l)) continue;
      measured++;
      if (l > W * 0.075 && W - r > W * 0.075 && Math.abs(l - (W - r)) <= W * 0.05) insets.push(l);
    }
    if (insets.length >= 3 && insets.length >= measured / 2) {
      const band = Math.round(insets.sort((a, b) => a - b)[insets.length >> 1]);
      result.boxed = `${insets.length} of ${measured} sections sit in a centred column with empty bands of about ${band}px on both sides of the ${Math.round(W)}px width`;
    }
  }

  // Split hero: the largest visual in the h1's block sits beside the headline, at the same height
  const h1 = [...root.querySelectorAll('h1')].find((el) => box(el, true));
  if (h1 && W >= 900) {
    const hb = h1.getBoundingClientRect();
    const hero = blocks.find((b) => b.contains(h1)) ?? h1.parentElement;
    let visual = null;
    for (const el of hero.querySelectorAll('img, video, canvas, iframe, svg, .ph')) {
      const r = box(el, true);
      if (r && r.width >= W * 0.25 && r.height >= 160 && (!visual || r.width * r.height > visual.width * visual.height)) visual = r;
    }
    if (visual) {
      const beside = visual.left >= hb.right - 8 || visual.right <= hb.left + 8;
      result.splitHero = beside && visual.top < hb.bottom && visual.bottom > hb.top;
    }
  }

  // Breadcrumbs: a labelled trail, or an unlabelled run of links separated by / › » → just before a page's h1
  const named = /crumb(?!l)|kruimelpad|fil d.ariane|brotkr|migas de pan|briciole/i;
  const clean = (el) => (el.innerText || el.textContent).replace(/\s+/g, ' ').trim().slice(0, 60);
  for (const el of root.querySelectorAll('[aria-label], [class], [itemtype]')) {
    const label = `${el.getAttribute('aria-label') ?? ''} ${typeof el.className === 'string' ? el.className : ''} ${el.getAttribute('itemtype') ?? ''}`;
    if (named.test(label) && box(el, true)) {
      result.crumbs = clean(el);
      break;
    }
  }
  const sep = /[/›»→]/;
  for (const h of root.querySelectorAll('h1')) {
    if (result.crumbs) break;
    if (!box(h, true)) continue;
    const i = blocks.findIndex((b) => b.contains(h));
    const scope = i === -1 ? [h.parentElement] : [blocks[i - 1], blocks[i]].filter((b) => b && b !== header);
    for (const list of scope.flatMap((b) => [...b.querySelectorAll('nav, ol, ul')])) {
      if (!(list.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING) || !box(list, true)) continue;
      const links = list.querySelectorAll('a').length;
      const text = list.textContent.replace(/\s+/g, ' ').trim();
      if (!links || links > 5 || text.length > 140) continue;
      const items = list.matches('ol, ul') ? [...list.children] : [];
      const pseudo =
        items.length >= 2 &&
        items.some((li, k) => (k > 0 && sep.test(getComputedStyle(li, '::before').content)) || (k < items.length - 1 && sep.test(getComputedStyle(li, '::after').content)));
      if (pseudo || /\S\s+\/\s+\S|\S\s*[›»→]\s*\S/.test(text)) {
        result.crumbs = clean(list);
        break;
      }
    }
  }

  // Pills above headings: a small filled or outlined label with words in it, just above an h1–h3 and in line with it
  // ("✨ New: online booking", "Our services" in a capsule). Plain-text eyebrows, thin rules beside them, icon tiles,
  // number badges, form chips, navigation and corner badges (absolutely positioned) don't count.
  const alpha = (c) => {
    const slash = /\/\s*([\d.]+)(%?)\s*\)$/.exec(c); // oklch(… / 0.5), rgb(… / 50%)
    if (slash) return Number(slash[1]) / (slash[2] ? 100 : 1);
    const parts = /^rgba\(([^)]*)\)$/.exec(c)?.[1].split(',');
    return parts?.length === 4 ? Number(parts[3]) : c === 'transparent' ? 0 : 1;
  };
  const filled = (cs) =>
    alpha(cs.backgroundColor) > 0.04 ||
    cs.backgroundImage !== 'none' ||
    ['Top', 'Right', 'Bottom', 'Left'].every((s) => parseFloat(cs[`border${s}Width`]) >= 1 && cs[`border${s}Style`] !== 'none' && alpha(cs[`border${s}Color`]) > 0.04);
  const skip = 'nav, form, fieldset, [role="tablist"], [role="radiogroup"], [role="toolbar"], button, label, input, select, textarea';
  const flagged = new Set();
  for (const h of root.querySelectorAll('h1, h2, h3')) {
    if (result.pills.length >= 3) break;
    const hb = box(h, true);
    if (!hb) continue;
    const block = blocks.find((b) => b.contains(h));
    if (block && block === header) continue;
    const scope = block ?? h.closest('section, article') ?? h.parentElement;
    for (const el of scope.querySelectorAll('*')) {
      if (el.contains(h) || h.contains(el) || flagged.has(el) || el.closest(skip)) continue;
      const r = box(el);
      if (!r || r.height < 14 || r.height > 52 || r.width > Math.min(560, W * 0.6)) continue;
      if (r.bottom > hb.top + 4 || hb.top - r.bottom > 72 || r.right < hb.left - 8 || r.left > hb.right + 8) continue;
      const text = (el.innerText || '').replace(/\s+/g, ' ').trim();
      if (text.length > 80 || !/\p{L}{2}/u.test(text) || !filled(getComputedStyle(el))) continue;
      flagged.add(el);
      result.pills.push(`"${text.slice(0, 40)}" above "${clean(h).slice(0, 40)}"`);
      break;
    }
  }
  return result;
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
  const splitHeroes = [];
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
      if (view === 'desktop' && o.layoutChecks) {
        const layout = await page.evaluate(websiteLayout, { selector: '.ngd-preset.is-active .ngd-frame', skipAppShell: true });
        if (layout?.boxed) errors.push(`preset ${p.index}: ${layout.boxed}; let sections use the full width (design-language.md section 5)`);
        if (layout?.crumbs) errors.push(`preset ${p.index}: breadcrumb trail ("${layout.crumbs}"); website pages show none (design-language.md section 7)`);
        if (layout?.pills.length) errors.push(`preset ${p.index}: pill above a heading (${layout.pills.join('; ')}); use a plain-text eyebrow or none (design-language.md section 7)`);
        if (layout?.splitHero) splitHeroes.push(p.index);
      }
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
  if (splitHeroes.length > 1) {
    const list = `${splitHeroes.slice(0, -1).join(', ')} and ${splitHeroes.at(-1)}`;
    errors.push(`presets ${list} put the hero copy beside an image; keep at most one split hero per round (design-language.md section 7)`);
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
      // Website layout checks only on pages meant to be indexed: panels, cart and checkout carry a robots noindex meta tag.
      // (Not the X-Robots-Tag header: the starter's Worker adds it to every response on non-production hosts, localhost too.)
      const robots = await page.evaluate(() => document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '');
      if (o.layoutChecks && res && !/noindex/i.test(robots)) {
        const layout = await page.evaluate(websiteLayout, { selector: null, skipAppShell: false });
        if (layout?.boxed) errors.push(`${target} @${width}: ${layout.boxed}; let sections use the full width (design-language.md section 5)`);
        if (layout?.crumbs) errors.push(`${target}: breadcrumb trail ("${layout.crumbs}"); website pages show none (design-language.md section 7)`);
        if (layout?.pills.length) errors.push(`${target} @${width}: pill above a heading (${layout.pills.join('; ')}); use a plain-text eyebrow or none (design-language.md section 7)`);
      }
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
    const themes = o.theme === 'both' ? ['light', 'dark'] : [o.theme];
    for (const theme of themes) {
      const run = { ...o, theme, layoutChecks: theme === themes[0] }; // layout doesn't change with the theme: check once
      const { files: shot, errors: found } = o.presets ? await capturePresets(browser, run) : await capturePages(browser, run);
      files.push(...shot);
      errors.push(...found);
    }
    for (const f of files) console.log(`saved ${f.file}${f.preset ? `  (${f.preset}, ${f.view}, frame ${f.height}px tall)` : ''}`);
    const problems = [...new Set(errors)];
    if (problems.length) {
      console.log(`\n${problems.length} problem(s):`);
      for (const e of problems) console.log(`  - ${e}`);
      process.exitCode = 1;
    } else {
      console.log(`\nNo problems found in ${basename(o.inputs[0])}${o.presets ? ' (runtime errors, file checks, overflow inside the frame, website layout)' : ' (runtime errors, HTTP status, horizontal overflow, website layout)'}. Now look at the screenshots.`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`screenshot.mjs: ${e.message ?? e}`);
  process.exit(1);
});
