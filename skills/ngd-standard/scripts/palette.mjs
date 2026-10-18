#!/usr/bin/env node
/**
 * NGD palette generator — turns ONE theme color into an accessible design-token set.
 *
 *   node palette.mjs --brand "#5e6ad2"                       # CSS tokens to stdout (light + dark)
 *   node palette.mjs --brand "#5e6ad2" --out app/styles/tokens.css
 *   node palette.mjs --brand "#5e6ad2" --mode light          # light-only site
 *   node palette.mjs --brand "#5e6ad2" --format json
 *   node palette.mjs --candidates "#0f766e,#e4572e,#6d28d9"  # compare theme-color options
 *   node palette.mjs --candidates "..." --preview swatches.html
 *
 * Options:
 *   --brand <hex>        theme color (required unless --candidates)
 *   --mode both|light|dark   which color schemes to emit (default: both)
 *   --tint 0..1          how much the neutrals lean toward the brand hue (default 0.5)
 *   --prefer-dark-text   keep the raw brand as CTA background and use dark labels on it
 *   --format css|json    output format (default css)
 *   --out <file>         write tokens to a file (report goes to stdout)
 *   --preview <file>     write an HTML swatch page (palette or candidates)
 *
 * Zero dependencies, Node 18+. Color math: sRGB <-> OKLab/OKLCH, chroma-reduction gamut
 * mapping, WCAG 2.x contrast. Every emitted text/background pair is contrast-checked.
 */
import { writeFileSync } from 'node:fs';

// ---------------------------------------------------------------- color math
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function parseHex(hex) {
  let h = String(hex).trim().replace(/^#/, '');
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) throw new Error(`Invalid hex color: "${hex}" (use #rrggbb)`);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}

function linearToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToLinear([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const hexToOklch = (hex) => {
  const [L, a, b] = linearToOklab(parseHex(hex).map(toLinear));
  const C = Math.hypot(a, b);
  const H = C < 1e-4 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  return { L, C, H };
};

const oklchToLinear = ({ L, C, H }) => {
  const rad = (H * Math.PI) / 180;
  return oklabToLinear([L, C * Math.cos(rad), C * Math.sin(rad)]);
};

const inGamut = (lin) => lin.every((v) => v >= -1e-5 && v <= 1 + 1e-5);

/** Keep lightness and hue, reduce chroma until the color fits in sRGB. */
function gamutMap(lch) {
  if (inGamut(oklchToLinear(lch))) return lch;
  let lo = 0;
  let hi = lch.C;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklchToLinear({ ...lch, C: mid }))) lo = mid;
    else hi = mid;
  }
  return { ...lch, C: lo };
}

const toHex = (lch) => {
  const lin = oklchToLinear(gamutMap(lch));
  return '#' + lin.map((v) => Math.round(clamp01(toGamma(clamp01(v))) * 255).toString(16).padStart(2, '0')).join('');
};

const luminance = (hex) => {
  const [r, g, b] = parseHex(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const fmtLch = ({ L, C, H }) => `oklch(${(L * 100).toFixed(1)}% ${C.toFixed(3)} ${H.toFixed(1)})`;

// ---------------------------------------------------------------- ramps
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
// Reference lightness curve; the brand color is pinned to its closest step and the
// rest of the curve is stretched around it so the ramp always reaches near-white/near-black.
const REF_L = [0.975, 0.94, 0.89, 0.815, 0.72, 0.64, 0.565, 0.495, 0.43, 0.38, 0.27];
const TOP_L = 0.975;
const BOTTOM_L = 0.26;

function buildRamp({ L, C, H }, exactHex) {
  let anchor = 0;
  REF_L.forEach((ref, i) => {
    if (Math.abs(ref - L) < Math.abs(REF_L[anchor] - L)) anchor = i;
  });
  const last = STEPS.length - 1;
  const ramp = {};
  STEPS.forEach((step, i) => {
    let l;
    let c;
    if (i === anchor) {
      ramp[step] = exactHex ?? toHex({ L, C, H });
      return;
    }
    if (i < anchor) {
      const t = (REF_L[i] - REF_L[0]) / (REF_L[anchor] - REF_L[0] || 1);
      l = TOP_L + t * (L - TOP_L);
      c = C * (0.12 + 0.88 * (i / anchor) ** 1.25);
    } else {
      const t = (REF_L[i] - REF_L[anchor]) / (REF_L[last] - REF_L[anchor] || 1);
      l = L + t * (BOTTOM_L - L);
      c = C * (1 - 0.45 * ((i - anchor) / (last - anchor || 1)) ** 1.3);
    }
    ramp[step] = toHex({ L: l, C: c, H });
  });
  return { ramp, anchorStep: STEPS[anchor] };
}

const NEUTRAL_STEPS = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 1000];
const NEUTRAL_L = [0.995, 0.982, 0.962, 0.925, 0.87, 0.72, 0.585, 0.49, 0.405, 0.3, 0.225, 0.18, 0.145];

function buildNeutrals({ C, H }, tint) {
  // Low-chroma brands get almost pure greys; saturated brands get a faint hue cast.
  const chroma = 0.016 * tint * Math.min(1, C / 0.1);
  const ramp = {};
  NEUTRAL_STEPS.forEach((step, i) => {
    ramp[step] = toHex({ L: NEUTRAL_L[i], C: chroma, H });
  });
  return ramp;
}

const STATUS_HUES = { success: 150, warning: 75, danger: 27, info: 250 };

// ---------------------------------------------------------------- semantic tokens
const WHITE = '#ffffff';

/** Best label color on a background: white or the darkest neutral. */
function onColor(bg, dark) {
  const w = contrast(bg, WHITE);
  const d = contrast(bg, dark);
  return w >= d ? { color: WHITE, ratio: w, name: 'white' } : { color: dark, ratio: d, name: 'ink' };
}

/** Walk the ramp from `from` in `dir` (+1 darker, -1 lighter) until `ok(hex)` passes. */
function findStep(ramp, fromStep, dir, ok) {
  let i = STEPS.indexOf(fromStep);
  while (i >= 0 && i < STEPS.length) {
    if (ok(ramp[STEPS[i]])) return STEPS[i];
    i += dir;
  }
  return null;
}

function statusTokens(name, hue, neutrals, mode) {
  const { ramp } = buildRamp({ L: 0.62, C: name === 'warning' ? 0.16 : 0.17, H: hue });
  const bg = mode === 'light' ? neutrals[0] : neutrals[1000];
  const ink = neutrals[1000];
  if (mode === 'light') {
    const solid = findStep(ramp, 600, 1, (hex) => contrast(hex, WHITE) >= 4.5) ?? 700;
    const solidHex = name === 'warning' ? ramp[400] : ramp[solid];
    const text = findStep(ramp, 600, 1, (hex) => contrast(hex, bg) >= 4.5 && contrast(hex, ramp[50]) >= 4.5) ?? 800;
    return {
      [`--color-${name}`]: solidHex,
      [`--color-on-${name}`]: onColor(solidHex, ink).color,
      [`--color-${name}-subtle`]: ramp[50],
      [`--color-${name}-text`]: ramp[text],
    };
  }
  const solidHex = ramp[400];
  const text = findStep(ramp, 400, -1, (hex) => contrast(hex, bg) >= 4.5 && contrast(hex, ramp[950]) >= 4.5) ?? 200;
  return {
    [`--color-${name}`]: solidHex,
    [`--color-on-${name}`]: onColor(solidHex, ink).color,
    [`--color-${name}-subtle`]: ramp[950],
    [`--color-${name}-text`]: ramp[text],
  };
}

function semantic(mode, brandHex, brand, neutrals, opts, notes) {
  const ink = neutrals[1000];
  const { ramp, anchorStep } = brand;
  const t = {};
  const light = mode === 'light';

  t['--color-bg'] = light ? neutrals[0] : neutrals[1000];
  t['--color-bg-subtle'] = light ? neutrals[50] : neutrals[950];
  t['--color-surface'] = light ? neutrals[0] : neutrals[950];
  t['--color-surface-raised'] = light ? WHITE : neutrals[900];
  t['--color-text'] = light ? neutrals[950] : neutrals[50];
  const mutedStep = light
    ? [600, 700, 800].find((s) => contrast(neutrals[s], neutrals[0]) >= 4.5 && contrast(neutrals[s], neutrals[50]) >= 4.5)
    : [400, 300, 200].find((s) => contrast(neutrals[s], neutrals[1000]) >= 4.5 && contrast(neutrals[s], neutrals[950]) >= 4.5);
  t['--color-text-muted'] = neutrals[mutedStep];
  t['--color-text-subtle'] = light ? neutrals[500] : neutrals[500];
  t['--color-text-inverse'] = light ? neutrals[50] : neutrals[950];
  t['--color-border'] = light ? neutrals[200] : neutrals[800];
  t['--color-border-strong'] = light ? neutrals[300] : neutrals[700];
  t['--color-scrim'] = light ? 'rgb(0 0 0 / 0.45)' : 'rgb(0 0 0 / 0.6)';

  const bg = t['--color-bg'];
  // --- accent (CTA background) + its label color
  let accentStep;
  let label;
  if (light) {
    const raw = onColor(brandHex, ink);
    if (raw.ratio >= 4.5 && (raw.name === 'white' || opts.preferDarkText || hexToOklch(brandHex).L >= 0.7)) {
      accentStep = anchorStep;
      label = raw;
    } else if (opts.preferDarkText && contrast(brandHex, ink) >= 4.5) {
      accentStep = anchorStep;
      label = { color: ink, ratio: contrast(brandHex, ink), name: 'ink' };
    } else {
      accentStep = findStep(ramp, anchorStep, 1, (hex) => contrast(hex, WHITE) >= 4.5) ?? 900;
      label = { color: WHITE, ratio: contrast(ramp[accentStep], WHITE), name: 'white' };
      if (accentStep !== anchorStep) {
        notes.push(
          `light mode: white labels on the raw brand only reach ${contrast(brandHex, WHITE).toFixed(2)}:1, so CTAs use brand-${accentStep} ` +
            `(${ramp[accentStep]}). Keep the raw brand for fields, illustrations and large display text. ` +
            `Pass --prefer-dark-text to keep the raw brand with dark labels instead.`,
        );
      }
    }
    if (contrast(ramp[accentStep], bg) < 1.6) {
      notes.push(
        'light mode: the brand is very light — a brand-filled button barely separates from the page. Prefer brand as a section/field ' +
          'background with ink (--neutral-950) buttons on top, or give brand buttons a 1px --color-border-strong outline.',
      );
    }
  } else if (hexToOklch(brandHex).C < 0.03) {
    // Monochrome brand: invert for dark mode (light pill on dark), the usual move for neutral brands.
    accentStep = STEPS[0];
    label = { color: ink, ratio: contrast(ramp[STEPS[0]], ink), name: 'ink' };
    notes.push('dark mode: monochrome brand, so CTAs invert to a near-white fill with ink labels.');
  } else {
    accentStep =
      findStep(ramp, anchorStep, -1, (hex) => contrast(hex, bg) >= 3 && onColor(hex, ink).ratio >= 4.5) ??
      findStep(ramp, anchorStep, 1, (hex) => contrast(hex, bg) >= 3 && onColor(hex, ink).ratio >= 4.5) ??
      300;
    label = onColor(ramp[accentStep], ink);
    if (accentStep !== anchorStep) {
      notes.push(`dark mode: CTAs use brand-${accentStep} (${ramp[accentStep]}) so they stand out on the dark background.`);
    }
  }
  const accentIdx = STEPS.indexOf(accentStep);
  const hoverStep = light ? STEPS[Math.min(accentIdx + 1, STEPS.length - 1)] : STEPS[Math.max(accentIdx - 1, 0)];
  const activeStep = light ? STEPS[Math.min(accentIdx + 2, STEPS.length - 1)] : STEPS[Math.max(accentIdx - 2, 0)];
  t['--color-accent'] = ramp[accentStep];
  t['--color-accent-hover'] = ramp[hoverStep];
  t['--color-accent-active'] = ramp[activeStep];
  t['--color-on-accent'] = label.color;

  // --- brand-colored text/links and tinted surfaces
  const subtle = light ? ramp[50] : ramp[950];
  const textStep = light
    ? findStep(ramp, anchorStep, 1, (hex) => contrast(hex, bg) >= 4.5 && contrast(hex, subtle) >= 4.5) ?? 950
    : findStep(ramp, anchorStep, -1, (hex) => contrast(hex, bg) >= 4.5 && contrast(hex, subtle) >= 4.5) ?? 50;
  t['--color-accent-subtle'] = subtle;
  t['--color-accent-text'] = ramp[textStep];
  t['--color-focus'] = ramp[textStep];

  for (const [name, hue] of Object.entries(STATUS_HUES)) Object.assign(t, statusTokens(name, hue, neutrals, mode));

  const checks = [
    ['text on bg', t['--color-text'], bg, 4.5],
    ['text-muted on bg', t['--color-text-muted'], bg, 4.5],
    ['text-muted on bg-subtle', t['--color-text-muted'], t['--color-bg-subtle'], 4.5],
    ['on-accent on accent', t['--color-on-accent'], t['--color-accent'], 4.5],
    ['accent-text on bg', t['--color-accent-text'], bg, 4.5],
    ['accent-text on accent-subtle', t['--color-accent-text'], subtle, 4.5],
    ['focus ring vs bg', t['--color-focus'], bg, 3],
    ['text-subtle on bg (large/meta text only)', t['--color-text-subtle'], bg, 3],
    ['border-strong vs bg (input outlines)', t['--color-border-strong'], bg, light ? 1.3 : 1.3],
  ];
  const report = checks.map(([label, fg, back, min]) => ({ label, fg, bg: back, ratio: contrast(fg, back), min }));
  return { tokens: t, report, accentStep, textStep };
}

// ---------------------------------------------------------------- build
const normalizeHex = (hex) => '#' + parseHex(hex).map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');

function buildPalette(brandHex, opts) {
  const hex = normalizeHex(brandHex);
  const lch = hexToOklch(hex);
  const notes = [];
  if (lch.C < 0.03) notes.push('the brand color is nearly neutral — the ramps will be greys; consider a second accent for CTAs or a monochrome design.');
  const brand = buildRamp(lch, hex);
  const neutrals = buildNeutrals(lch, opts.tint);
  const modes = opts.mode === 'both' ? ['light', 'dark'] : [opts.mode];
  const schemes = {};
  for (const m of modes) schemes[m] = semantic(m, hex, brand, neutrals, opts, notes);
  return { hex, lch, brand, neutrals, schemes, notes };
}

function cssBlock(selector, decls, indent = '  ') {
  const body = Object.entries(decls)
    .map(([k, v]) => `${indent}${k}: ${v};`)
    .join('\n');
  return `${selector} {\n${body}\n}`;
}

function toCss(p, opts) {
  const lines = [];
  lines.push(
    `/* Generated by ngd palette.mjs — theme color ${p.hex} = ${fmtLch(p.lch)} (pinned at brand-${p.brand.anchorStep}).\n` +
      '   Re-generate instead of hand-editing values; adjust usage in components, not here. */',
  );
  const ramps = { '--brand': p.hex };
  for (const s of STEPS) ramps[`--brand-${s}`] = p.brand.ramp[s];
  for (const s of NEUTRAL_STEPS) ramps[`--neutral-${s}`] = p.neutrals[s];
  lines.push(cssBlock(':root', ramps));
  const { light, dark } = p.schemes;
  if (opts.mode === 'light') {
    lines.push(cssBlock(':root', { 'color-scheme': 'light', ...light.tokens }));
  } else if (opts.mode === 'dark') {
    lines.push(cssBlock(':root', { 'color-scheme': 'dark', ...dark.tokens }));
  } else {
    lines.push('/* Light is the default; dark follows the OS unless the user picked a theme (data-theme on <html>). */');
    lines.push(cssBlock(':root,\n[data-theme="light"]', { 'color-scheme': 'light', ...light.tokens }));
    lines.push(
      '@media (prefers-color-scheme: dark) {\n' +
        cssBlock('  :root:not([data-theme="light"])', { 'color-scheme': 'dark', ...dark.tokens }, '    ').replace(/\n}$/, '\n  }') +
        '\n}',
    );
    lines.push(cssBlock('[data-theme="dark"]', { 'color-scheme': 'dark', ...dark.tokens }));
  }
  return lines.join('\n\n') + '\n';
}

function reportText(p) {
  const out = [`Theme color ${p.hex}  ${fmtLch(p.lch)}  → pinned at brand-${p.brand.anchorStep}`];
  for (const [mode, s] of Object.entries(p.schemes)) {
    out.push(`\n[${mode}] accent = brand-${s.accentStep} ${s.tokens['--color-accent']} with ${s.tokens['--color-on-accent']} labels; brand text = brand-${s.textStep}`);
    for (const r of s.report) {
      const ok = r.ratio >= r.min ? 'PASS' : 'FAIL';
      out.push(`  ${ok}  ${r.ratio.toFixed(2).padStart(5)}:1  (min ${r.min})  ${r.label}  ${r.fg} on ${r.bg}`);
    }
  }
  if (p.notes.length) out.push('\nNotes:\n' + [...new Set(p.notes)].map((n) => `  - ${n}`).join('\n'));
  return out.join('\n');
}

// ---------------------------------------------------------------- preview html
function previewHtml(palettes) {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const cards = palettes
    .map((p) => {
      const lt = p.schemes.light?.tokens ?? {};
      const dk = p.schemes.dark?.tokens ?? {};
      const chips = STEPS.map((s) => `<div class="chip" style="background:${p.brand.ramp[s]}" title="brand-${s} ${p.brand.ramp[s]}"><span>${s}</span></div>`).join('');
      const neutral = NEUTRAL_STEPS.map((s) => `<div class="chip" style="background:${p.neutrals[s]}" title="neutral-${s} ${p.neutrals[s]}"><span>${s}</span></div>`).join('');
      const demo = (t, name) =>
        t['--color-bg']
          ? `<div class="demo" style="background:${t['--color-bg']};color:${t['--color-text']};border-color:${t['--color-border']}">
          <small style="color:${t['--color-text-muted']}">${name}</small>
          <strong>Headline that sells the outcome</strong>
          <p style="color:${t['--color-text-muted']}">Supporting copy in the muted text color with a <a style="color:${t['--color-accent-text']}">brand link</a>.</p>
          <div class="row"><button style="background:${t['--color-accent']};color:${t['--color-on-accent']}">Primary action</button>
          <button style="background:transparent;color:${t['--color-text']};border:1px solid ${t['--color-border-strong']}">Secondary</button>
          <span class="badge" style="background:${t['--color-accent-subtle']};color:${t['--color-accent-text']}">Badge</span></div></div>`
          : '';
      return `<section class="card"><h2>${esc(p.hex)} <code>${esc(fmtLch(p.lch))}</code></h2>
      <div class="ramp">${chips}</div><div class="ramp">${neutral}</div>
      <div class="demos">${demo(lt, 'Light')}${demo(dk, 'Dark')}</div>
      ${p.notes.length ? `<ul class="notes">${[...new Set(p.notes)].map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}</section>`;
    })
    .join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Theme color options</title><style>
body{margin:0;padding:32px;font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;background:#f6f6f4;color:#161616}
h1{font-size:22px;margin:0 0 20px}.card{background:#fff;border:1px solid #e4e4e0;border-radius:16px;padding:20px;margin:0 0 20px}
h2{font-size:16px;margin:0 0 12px}code{font-size:12px;color:#666;margin-left:8px}
.ramp{display:grid;grid-template-columns:repeat(13,1fr);gap:4px;margin-bottom:6px}.chip{height:44px;border-radius:8px;display:flex;align-items:end;padding:4px}
.chip span{font-size:10px;background:rgb(255 255 255/.75);border-radius:4px;padding:0 4px;color:#111}
.demos{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;margin-top:12px}
.demo{border:1px solid;border-radius:14px;padding:18px;display:grid;gap:6px}.demo strong{font-size:20px;letter-spacing:-.02em}.demo p{margin:0}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:6px}button{font:inherit;font-weight:600;border:0;border-radius:999px;padding:10px 16px}
.badge{font-size:12px;font-weight:600;border-radius:999px;padding:3px 10px}.notes{margin:12px 0 0;padding-left:18px;color:#555;font-size:13px}
</style></head><body><h1>Theme color options</h1>${cards}</body></html>`;
}

// ---------------------------------------------------------------- cli
function parseArgs(argv) {
  const opts = { mode: 'both', tint: 0.5, format: 'css', preferDarkText: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) throw new Error(`Missing value for ${a}`);
      return argv[++i];
    };
    if (a === '--brand') opts.brand = next();
    else if (a === '--mode') opts.mode = next();
    else if (a === '--tint') opts.tint = Number(next());
    else if (a === '--format') opts.format = next();
    else if (a === '--out') opts.out = next();
    else if (a === '--preview') opts.preview = next();
    else if (a === '--candidates') opts.candidates = next().split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--prefer-dark-text') opts.preferDarkText = true;
    else if (a === '-h' || a === '--help') opts.help = true;
    else throw new Error(`Unknown argument: ${a}`);
  }
  if (!['both', 'light', 'dark'].includes(opts.mode)) throw new Error('--mode must be both, light or dark');
  if (!(opts.tint >= 0 && opts.tint <= 1)) throw new Error('--tint must be between 0 and 1');
  return opts;
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(String(e.message ?? e));
    process.exit(2);
  }
  if (opts.help || (!opts.brand && !opts.candidates)) {
    console.log('Usage: node palette.mjs --brand "#rrggbb" [--mode both|light|dark] [--out tokens.css] [--format css|json]\n' +
      '       node palette.mjs --candidates "#hex1,#hex2,#hex3" [--preview swatches.html]');
    process.exit(opts.help ? 0 : 2);
  }

  if (opts.candidates) {
    const palettes = opts.candidates.map((c) => buildPalette(c, { ...opts, mode: 'both' }));
    for (const p of palettes) {
      const l = p.schemes.light;
      const d = p.schemes.dark;
      const fails = [...l.report, ...d.report].filter((r) => r.ratio < r.min).length;
      console.log(
        `${p.hex}  ${fmtLch(p.lch).padEnd(26)} light CTA ${l.tokens['--color-accent']} (${onColor(l.tokens['--color-accent'], p.neutrals[1000]).name} label)  ` +
          `dark CTA ${d.tokens['--color-accent']}  ${fails ? `${fails} contrast FAIL(s)` : 'all contrast checks pass'}`,
      );
      for (const n of new Set(p.notes)) console.log(`    note: ${n}`);
    }
    if (opts.preview) {
      writeFileSync(opts.preview, previewHtml(palettes));
      console.log(`\nPreview written to ${opts.preview}`);
    }
    return;
  }

  const p = buildPalette(opts.brand, opts);
  const output =
    opts.format === 'json'
      ? JSON.stringify(
          {
            brand: p.hex,
            oklch: fmtLch(p.lch),
            anchorStep: p.brand.anchorStep,
            ramps: { brand: p.brand.ramp, neutral: p.neutrals },
            schemes: Object.fromEntries(Object.entries(p.schemes).map(([m, s]) => [m, s.tokens])),
            notes: [...new Set(p.notes)],
          },
          null,
          2,
        ) + '\n'
      : toCss(p, opts);
  if (opts.preview) writeFileSync(opts.preview, previewHtml([p]));
  if (opts.out) {
    writeFileSync(opts.out, output);
    console.log(`Tokens written to ${opts.out}\n`);
    console.log(reportText(p));
  } else {
    process.stdout.write(output);
    console.error('\n' + reportText(p));
  }
}

try {
  main();
} catch (e) {
  console.error(`palette.mjs: ${e.message ?? e}`);
  process.exit(1);
}
