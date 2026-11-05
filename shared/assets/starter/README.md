# NGD starter files

Verified with TanStack Start 1.169 (`@tanstack/react-router` 1.170), React 19.2, Vite 8, `@cloudflare/vite-plugin` 1.67 and Wrangler 4.158: typecheck, build with prerendering, Workers preview, form submission with and without JavaScript (lead delivered to a webhook, error status codes such as 400 and 503 kept on the no-JavaScript path), designed 404 with a real 404 status, server-rendered CSS in dev and production, no console or hydration errors. They are a starting point to restyle into the chosen preset, not a theme.

## Apply to a freshly scaffolded project

1. Scaffold (`npm create cloudflare@latest -- my-site --framework=tanstack-start`), then remove what NGD doesn't use: `npm rm tailwindcss @tailwindcss/vite @tailwindcss/typography @tanstack/react-devtools @tanstack/react-router-devtools @tanstack/devtools-vite @tanstack/router-cli`, delete `src/components/`, `src/styles.css`, `src/routes/about.tsx`, `src/routes/index.tsx` and `tsr.config.json`.
2. Install what the starter uses: `npm i -D @fontsource-variable/<display-font> vite-imagetools` (swap Inter Tight for the preset's fonts in `src/routes/__root.tsx` and `src/styles/global.css`; check the exact woff2 file name under `node_modules/@fontsource-variable/<font>/files/`).
3. Copy the files from this folder into the project root, keeping the paths, and **overwrite** `vite.config.ts`, `tsconfig.json`, `src/router.tsx` and `src/routes/__root.tsx`. **Merge** `wrangler.jsonc` instead of overwriting it: set `name`, `main: "./src/server.ts"` (the template's `@tanstack/react-start/server-entry` would silently skip the starter's redirects and headers), today's `compatibility_date` (the template ships an old one), `assets.html_handling`, `vars` and the bindings you need. Keep the template's `nodejs_compat` flag.
4. In `package.json` add `"typecheck": "tsc --noEmit"` to the scripts.
5. Generate colors: `node <skill-dir>/scripts/palette.mjs --brand "#hex" --out src/styles/tokens.css` (plus the `--mode` and `--neutral-hue` chosen for the presets).
6. Edit `src/lib/site.ts`: name, production URL (`site.url`; until it is real, the audit fails on purpose), contact details, navigation, the Turnstile **site** key (public; the starter holds Cloudflare's test key) and `site.ui`, the interface text (form steps, buttons, menu labels, 404 page) to translate into the site's language. Then `src/content/pages.ts`: the indexable pages and what gets prerendered.
7. Replace the placeholder privacy and terms pages (`src/routes/_site/privacy.tsx`, `terms.tsx`) with the real texts from the user; the audit fails while `data-ngd-placeholder` is in the built HTML. Create `public/og/default.png` (1200×630; `site.defaultOgImage`), `public/logo.png` (`site.logo`) and the favicon set linked in `src/routes/__root.tsx`.
8. Copy `.dev.vars.example` to `.dev.vars`, then `npm run cf-typegen && npm run build && npm run typecheck`. The build (and `npm run dev`) generates `src/routeTree.gen.ts`, the typed route tree the typecheck needs: commit it.
9. Give leads a destination before launch: a D1 database (`DB`, apply `migrations/`), the Email Service binding (`EMAIL` with `LEAD_NOTIFY_TO`/`LEAD_NOTIFY_FROM`) or a webhook (`LEAD_WEBHOOK_URL` secret). Production refuses submissions without one (503 with the email and phone fallback), so no lead is silently lost; in development the lead is logged instead.

## What's inside

| File | Purpose |
|---|---|
| `vite.config.ts` | Cloudflare + TanStack Start plugins, prerendering exactly the paths in `src/content/pages.ts` (no discovery, no crawling), `vite-imagetools`, the `~` alias that CSS Modules `composes` needs |
| `wrangler.jsonc` | `main: ./src/server.ts`, `html_handling: drop-trailing-slash` for prerendered pages, public vars, commented bindings |
| `tsconfig.json` | Strict TypeScript with the `~/` path alias and the Worker types |
| `src/server.ts` | Worker entry: redirect map, trailing-slash redirects, security headers, `Cache-Control: private, no-cache` unless a route set one, `noindex` on every non-production host |
| `src/router.tsx` | The router: intent preloading, scroll restoration, type registration |
| `public/_headers` | Immutable caching for hashed assets, security headers for static HTML |
| `src/routes/__root.tsx` (+ `root.module.css`) | Document shell, fonts, global CSS, optional theme script, designed 404 and error pages |
| `src/routes/_site.tsx` | Pathless layout for public pages: skip link, header, footer |
| `src/routes/_site/index.tsx` | Example home page with `head: () => seo(…)` and JSON-LD |
| `src/routes/_site/contact.tsx` | Contact page with the lead form's POST handler: JSON for JavaScript, the re-rendered page (and the right status code) without |
| `src/routes/_site/privacy.tsx`, `terms.tsx` | Placeholders the footer links to; replace with the real texts |
| `src/routes/sitemap[.]xml.ts`, `robots[.]txt.ts` | Server routes; the sitemap is prerendered, robots answers per host |
| `src/styles/global.css` | The small global layer: tokens (non-color), reset, base (budget about 8 KB) |
| `src/styles/typography.module.css` | Shared text styles to `composes` from route and component modules |
| `src/lib/site.ts` | Single source of truth for site facts; navigation targets are type-checked route paths |
| `src/lib/seo.ts` | `seo()` head builder (escapes JSON-LD for inline scripts) and JSON-LD helpers |
| `src/lib/leads.server.ts`, `turnstile.server.ts` | Lead validation, delivery (D1, then email/webhook in the background; without D1 the notification must succeed), rate limit, Turnstile check that fails closed when the secret is missing; bindings via `import { env, waitUntil } from 'cloudflare:workers'` |
| `src/components/forms/StepForm` | Conversational multi-step form with progressive enhancement: one question at a time with JavaScript (posts with `fetch`, JSON result), the whole form without (normal POST, the page re-renders with the result); auto-advance only on tap or click, never on arrow keys |
| `src/components/forms/LeadForm.tsx` | The site's lead form, defined once, used everywhere |
| `src/components/layout/*` | Sticky header with a JavaScript-free popover menu, rich footer |
| `src/components/ui/Button` | One button style: `Button` (a `<button>`) and `ButtonLink` (a typed router link); primary/secondary/ghost, optional arrow |
| `src/components/media/Image` | The responsive image contract (works with `vite-imagetools` `as=picture`) |
| `src/components/motion/Reveal` | Reveal-once on scroll that never hides server-rendered content above the fold |
| `migrations/0001_leads.sql` | D1 table for leads |

## Known trade-offs

- With Turnstile enabled, a visitor without JavaScript can't get a token, so their submission is refused with an email/phone alternative in the message. To accept such leads anyway, store unverified submissions with a flag and skip the notification instead of rejecting them.
- Without JavaScript, a refused submission shows the errors but not the answers already given (the browser's form state is gone after the POST). With JavaScript the answers stay.
- `vite preview` serves files uncompressed, so local Lighthouse scores understate production performance. Measure a preview deployment, or serve `dist/client` through a compressing static server, for realistic numbers. Locally the robots route also blocks crawling (non-production host), which Lighthouse reports as an SEO failure.
- Active links get `aria-current="page"` (style that, not a class). TanStack Router also adds an `active` class, which has no styles.
