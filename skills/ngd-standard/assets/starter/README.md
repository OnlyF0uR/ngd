# NGD starter files

Verified with React Router 8.4, React 19.3, Vite 8, `@cloudflare/vite-plugin` 1.64 and Wrangler 4.151: typecheck, build with prerendering, Workers preview, form submission with and without JavaScript, Lighthouse (prerendered page, compressed: Performance 97, Accessibility 100, CLS 0). They are a starting point to restyle into the chosen preset, not a theme.

## Apply to a freshly scaffolded project

1. Scaffold (`npm create cloudflare@latest -- my-site --framework=react-router`), then remove Tailwind (`npm rm tailwindcss @tailwindcss/vite`), delete `app/app.css`, `app/welcome/` and `app/routes/home.tsx`.
2. Install what the starter uses: `npm i -D @fontsource-variable/<display-font> vite-imagetools` (swap Inter Tight for the preset's fonts in `app/root.tsx` and `app/styles/global.css`; check the exact woff2 file name under `node_modules/@fontsource-variable/<font>/files/`).
3. Copy the files from this folder into the project root, keeping the paths. **Merge** `wrangler.jsonc` instead of overwriting it: keep the generated `compatibility_date`, set `name`, add `assets.html_handling`, `vars` and the bindings you need.
4. Generate colors: `node <skill-dir>/scripts/palette.mjs --brand "#hex" --out app/styles/tokens.css` (plus the `--mode` and `--neutral-hue` chosen for the presets).
5. Edit `app/lib/site.ts`: name, production URL (`site.url`; until it is real, the audit fails on purpose), contact details, navigation, legal links, the Turnstile **site** key (public; the starter holds Cloudflare's test key) and `site.ui`, the interface text (form steps, buttons, menu labels, 404 page) to translate into the site's language. Then `app/content/pages.ts`: the indexable pages and what gets prerendered.
6. Create what the starter links to: the privacy and terms pages from `site.legal`, `public/og/default.png` (1200×630; `site.defaultOgImage`), `public/logo.png` (`site.logo`) and the favicon set linked in `app/root.tsx`.
7. Copy `.dev.vars.example` to `.dev.vars`, then `npm run cf-typegen && npm run typecheck && npm run build`.
8. Give leads a destination before launch: a D1 database (`DB`, apply `migrations/`), the Email Service binding (`EMAIL` with `LEAD_NOTIFY_TO`/`LEAD_NOTIFY_FROM`) or a webhook (`LEAD_WEBHOOK_URL` secret). Production refuses submissions without one (503 with the email and phone fallback), so no lead is silently lost; in development the lead is logged instead.

## What's inside

| File | Purpose |
|---|---|
| `vite.config.ts` | Cloudflare + React Router plugins, `vite-imagetools`, and the `~` alias that CSS Modules `composes` needs |
| `react-router.config.ts` | SSR on, prerender list from `app/content/pages.ts` |
| `wrangler.jsonc` | `html_handling: drop-trailing-slash` for prerendered pages, public vars, commented bindings |
| `workers/app.ts` | Redirect map, trailing-slash redirects, typed Cloudflare context, security headers, `noindex` on every non-production host |
| `public/_headers` | Immutable caching for hashed assets, security headers for static HTML |
| `app/root.tsx` | Document shell, fonts, global CSS, cache-safety middleware, optional theme script, designed 404/500 |
| `app/styles/global.css` | The small global layer: tokens (non-color), reset, base (budget about 8 KB) |
| `app/styles/typography.module.css` | Shared text styles to `composes` from route and component modules |
| `app/lib/site.ts` | Single source of truth for site facts |
| `app/lib/seo.ts` | `seo()` meta builder and JSON-LD helpers |
| `app/lib/cloudflare-context.ts` | `context.get(cloudflareContext)` → `{ env, ctx }` |
| `app/lib/leads.server.ts`, `turnstile.server.ts` | Lead validation, delivery (D1, then email/webhook in the background; without D1 the notification must succeed), rate limit, Turnstile check that fails closed when the secret is missing |
| `app/routes/*` | Layout, example home, contact (with the action), sitemap, robots |
| `app/components/forms/StepForm` | Conversational multi-step form with progressive enhancement: one question at a time with JavaScript, the whole form without; auto-advance only on tap or click, never on arrow keys |
| `app/components/forms/LeadForm.tsx` | The site's lead form, defined once, used everywhere |
| `app/components/layout/*` | Sticky header with a JavaScript-free popover menu, rich footer |
| `app/components/ui/Button` | One button: link or button, primary/secondary/ghost, optional arrow |
| `app/components/media/Image` | The responsive image contract (works with `vite-imagetools` `as=picture`) |
| `app/components/motion/Reveal` | Reveal-once on scroll that never hides server-rendered content above the fold |
| `migrations/0001_leads.sql` | D1 table for leads |

## Known trade-offs

- With Turnstile enabled, a visitor without JavaScript can't get a token, so their submission is refused with an email/phone alternative in the message. To accept such leads anyway, store unverified submissions with a flag and skip the notification instead of rejecting them.
- `vite preview` serves files uncompressed, so local Lighthouse scores understate production performance. Measure a preview deployment, or serve `build/client` through a compressing static server, for realistic numbers. Locally the robots route also blocks crawling (non-production host), which Lighthouse reports as an SEO failure.
