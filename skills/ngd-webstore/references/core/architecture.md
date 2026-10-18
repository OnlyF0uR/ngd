# Architecture: React Router on Cloudflare Workers

How every ngd project is built: the latest React Router in framework mode with server rendering, deployed to Cloudflare Workers, styled with CSS Modules, organised so shared code lives in one place. Facts here were verified against React Router 8.4 and the Cloudflare tooling of October 2026. Versions move, so **check before you build** (section 1) and treat the version-matched docs inside `node_modules/react-router/docs` as the API reference.

## Contents
1. Always the latest version
2. Scaffold a new project
3. Upgrade an existing project
4. Project structure
5. Styling architecture
6. Extracting common code
7. Rendering strategy
8. Cloudflare bindings and the typed context
9. Data loading: indexed pages vs app areas
10. SEO plumbing
11. Redirects, trailing slashes, canonical host
12. Caching and response headers
13. Fonts
14. Images
15. Performance budgets
16. Dependencies
17. Configuration and secrets
18. Deploying
19. Stale guidance to ignore
20. Troubleshooting

## 1. Always the latest version

At the start of the foundation phase run:

```sh
npm view react-router version            # latest stable React Router
npm view @cloudflare/vite-plugin dist-tags wrangler version
```

- New projects use the latest stable `react-router` and `@react-router/dev` (8.4.0 at the time of writing). Never pin an older major for a new build.
- Use the latest **stable** `@cloudflare/vite-plugin` that the scaffolder installs (1.x today). Version 2.0 is a beta with breaking changes (config moves to `cloudflare.config.ts` and deploys go through a separate `cf` CLI); don't adopt betas without the user asking.
- When an API detail is unclear, read the docs shipped with the installed version: `node_modules/react-router/docs` (the scaffolder also installs an official React Router agent skill in `.agents/skills/react-router`; it is worth keeping).

## 2. Scaffold a new project

```sh
npm create cloudflare@latest -- my-site --framework=react-router
# non-interactive (agents, CI):
CI=true npx -y create-cloudflare@latest my-site --framework=react-router --platform=workers --no-deploy --no-git --no-open -y
```

This runs the official React Router template and adds the Cloudflare files: `workers/app.ts`, `wrangler.jsonc`, `@cloudflare/vite-plugin`, Wrangler, type generation. Behind a corporate or sandbox proxy, `create-react-router` may need `NODE_USE_ENV_PROXY=1`.

**Where it lands.** The scaffolder creates a new folder and refuses a non-empty one, and its name must be lowercase with hyphens (`kinetic-physio`, not `Kinetic Physio`). If phases 1–3 already put `DESIGN.md` and `design/` in the current folder, scaffold into a new folder named after the project, then move `DESIGN.md` and `design/` into it, and continue there. (Or scaffold into a temporary folder and move its contents into the current one, if the user wants the project at the current path.)

**Then clean it up for NGD** (the verified starter files in `assets/starter/` give you the replacements; its README lists every file):
1. Remove Tailwind: uninstall `tailwindcss` and `@tailwindcss/vite`, drop `tailwindcss()` from `vite.config.ts`, delete `app/app.css`. NGD styling is CSS Modules plus a small global stylesheet (section 5).
2. Delete `app/welcome/` and the demo `VALUE_FROM_CLOUDFLARE` var; replace `app/routes/home.tsx`.
3. Replace the Google Fonts `<link>`s in `app/root.tsx` with self-hosted fonts (section 13).
4. Copy the starter files you need: `app/root.tsx`, `app/styles/global.css`, `app/lib/*` (site config, SEO helper, typed Cloudflare context), `workers/app.ts`, the sitemap and robots routes, `public/_headers`, and the components you'll use (StepForm, Reveal, Image).
5. Generate `app/styles/tokens.css` with `node <skill-dir>/scripts/palette.mjs --brand "#hex" --out app/styles/tokens.css` (add `--mode light|dark` for a fixed default; both token sets are always emitted so `data-theme` bands work).
6. In `wrangler.jsonc` (merge, don't overwrite): set `name`, add `"assets": { "html_handling": "drop-trailing-slash" }` if you prerender, add public `vars` and the bindings you need (section 8). Leave `compatibility_date` as generated: from 2026-08-04 on, `nodejs_compat` is on by default, so don't add compatibility flags you don't need.
   Set the production URL, contact details and navigation in `app/lib/site.ts` (`site.url` is the one source for absolute URLs).
7. Run `npm run typecheck && npm run build` before writing features.

If the scaffolder is unavailable, create the project with `npx create-react-router@latest`, add `@cloudflare/vite-plugin` and `wrangler`, and recreate the Cloudflare files from `assets/starter/` (`vite.config.ts`, `wrangler.jsonc`, `workers/app.ts`).

## 3. Upgrade an existing project

The user asked for the latest React Router everywhere. For an existing codebase:
- On v8 already: update to the latest minor (`npm i react-router@latest @react-router/dev@latest`), then typecheck and build.
- On v7: follow the official upgrade guide (`docs/upgrading` in the installed package, or reactrouter.com). Key changes: all `future.v8_*` flags are removed (leaving one in the config is a hard error), middleware is always on, the route `context` is always a `RouterContextProvider`, `react-router-dom` is gone (import from `react-router`), `meta` receives `loaderData` instead of `data`, `@react-router/dev/vite/cloudflare` (`cloudflareDevProxy`) is removed in favour of `@cloudflare/vite-plugin`, and Node 22.22+ is required.
- Older (Remix v2, React Router v6): plan the migration with the user first; it is a bigger change than a dependency bump.
- Always tell the user before a major-version upgrade and run the full verification afterwards.

## 4. Project structure

```
app/
  root.tsx                 document shell: <html lang>, global CSS, fonts, default meta, ErrorBoundary (404/500 pages)
  routes.ts                explicit route config (index, route, layout, prefix)
  styles/
    tokens.css             GENERATED by scripts/palette.mjs: color ramps + semantic color tokens. Don't hand-edit.
    global.css             small: cascade layers, non-color tokens, reset, base element styles (budget: section 5)
    typography.module.css  shared text styles that modules `compose` (eyebrow, display, lead, prose)
  components/
    ui/                    primitives used everywhere: Button, Icon, Field, Input, Badge, Card, Skeleton, Dialog, VisuallyHidden
    layout/                SiteHeader, MobileNav, SiteFooter, Container, Section, Breadcrumbs
    sections/              page sections: Hero, LogoWall, FeatureGrid, Testimonials, Faq, CtaBand, Pricing, Stats …
    forms/                 StepForm (conversational lead form) and its fields
    media/                 Image (responsive image contract), Video
  routes/
    site-layout.tsx        layout route for public pages (header + footer)
    home.tsx + home.module.css
    …one file (+ module) per route
    contact.tsx            has the lead action; never prerendered
    sitemap.ts, robots.ts  resource routes
  lib/
    site.ts                single source of truth: name, production URL (site.url), locale, contact details, socials, navigation
    seo.ts                 seo() meta builder and JSON-LD helpers
    cloudflare-context.ts  typed env + ctx for loaders/actions/middleware
    *.server.ts            server-only code (Turnstile, lead delivery, database access); never imported by components
  content/                 typed content: services, FAQs, testimonials, team, pages list (feeds pages, JSON-LD and sitemap)
  hooks/                   small shared hooks
workers/app.ts             Worker entry: redirects, trailing slash, typed context, request handler
public/                    favicon set, _headers, og images, other static files
design/                    NGD artifacts (presets, seo-plan.md, references, screenshots). Not deployed.
DESIGN.md                  the design brief
```

Naming: components and their modules in PascalCase (`Button.tsx`, `Button.module.css`), routes in kebab-case, CSS Module classes in camelCase (`styles.heroTitle`). Import with the `~/` alias (`~/components/ui/Button`).

## 5. Styling architecture

**Files and order** (imported in `root.tsx`): `tokens.css` then `global.css`. Vite bundles them into one small root stylesheet. Each component and route imports its own `.module.css`; React Router links the route's CSS in `<Links />` during SSR, so there is no flash of unstyled content.

**global.css budget:** at most about 8 KB / 250 lines. It may contain only:
- the `@layer reset, base;` declaration;
- non-color tokens on `:root`: type scale, font stacks, spacing, radii, shadows, motion, z-index, container widths, header height;
- a modern reset (box-sizing, margins, media defaults, form font inheritance);
- base element styles: `html`/`body` (background, color, font, `text-rendering`), headings scale, links, `:focus-visible`, `::selection`, `.visually-hidden`, `prefers-reduced-motion` defaults, view-transition timings.

Reset and base live in cascade layers; CSS Modules are unlayered, so component styles always win without specificity fights. Everything else lives in modules. If global.css grows past the budget, something component-specific leaked into it: move it.

**CSS Module rules:**
- One module per component or route, next to it. No plain `.css` imports outside `root.tsx`.
- Use semantic tokens (`var(--color-text-muted)`, `var(--space-6)`, `var(--radius-md)`), never raw hex values or magic numbers that should be tokens.
- Share text styles through `composes`: `.title { composes: display from '~/styles/typography.module.css'; }`. This needs the explicit `~` alias in `vite.config.ts` (the starter has it); tsconfig paths alone don't reach CSS. Share behaviour through components, not copy-pasted CSS.
- A parent restyling a child component must not rely on stylesheet order (CSS chunk order between modules isn't guaranteed): give the child a prop (`variant`, `size`), or use a more specific selector in the parent (`.actions .cta`).
- Keep selectors flat (native nesting at most two levels deep), avoid `:global` except for third-party markup.
- Responsive components use container queries (`container-type: inline-size` on the component root) so they adapt wherever they're placed; page-level layout uses a few media queries.
- Dark bands: `data-theme="dark"` on a section flips all tokens inside it.
- No inline `style` except to pass dynamic custom properties (`style={{ '--progress': '40%' }}`).
- No Tailwind, no CSS-in-JS runtime, no UI kit stylesheets.

## 6. Extracting common code

Duplication is the enemy of a site that stays beautiful as it grows.
- **Second use extracts.** The second time a UI pattern appears, make it a component in `components/`; the third time a piece of logic repeats, make it a function in `lib/` or a hook.
- **Layers:** primitives (`ui/`) know nothing about the business; sections compose primitives and accept content as props; routes compose sections, load data and own only page-specific layout.
- **One source of truth for facts:** navigation, contact details, opening hours, social links and the production URL live in `lib/site.ts` and feed the header, footer, contact page, JSON-LD and sitemap.
- **Content as data:** lists of services, FAQs, testimonials, team members and plans live in `content/*.ts` as typed arrays. Pages render them, JSON-LD reuses them, the sitemap enumerates them.
- **Server-only code** goes in `*.server.ts` files so it can never leak into the client bundle.
- **Don't over-abstract:** prefer small composable components over one mega-component with twenty props. A section used once stays in the route folder until a second use appears.

## 7. Rendering strategy

| Page kind | Strategy | Why |
|---|---|---|
| Marketing and content pages whose content only changes on deploy (home, services, about, legal, articles) | **Prerender** at build time | Served by Workers Static Assets without running the Worker: fastest response, free requests, complete HTML for crawlers |
| Pages with an `action` (contact, newsletter), per-request data (search, live stock), or personalisation | **SSR** on the Worker, streaming | Prerendered paths reject POST with 405, and fresh data needs a server |
| Content from a CMS that changes often | SSR + Workers Cache with `Cache-Control`, or prerender + rebuild on publish (deploy hook) | Fresh enough without paying for SSR on every request |
| Panels and logged-in areas | SSR shell + streamed or client-loaded data with skeletons, `noindex` | Fast first paint, data never blocks the shell |

Prerendering setup:

```ts
// react-router.config.ts
import type { Config } from '@react-router/dev/config';
import { prerenderPaths } from './app/content/pages';

export default {
  ssr: true,                       // keep SSR for the routes you don't prerender
  prerender: prerenderPaths,       // string[] or async ({ getStaticPaths }) => string[]
} satisfies Config;
```

Rules that keep prerendering correct:
- **Never prerender a route that exports an `action`.** Point embedded forms at a server-rendered route (`<fetcher.Form action="/contact">`).
- Set `"assets": { "html_handling": "drop-trailing-slash" }` in `wrangler.jsonc`; otherwise `/about` answers with a redirect to `/about/` before serving `about/index.html`.
- The prerender runs locally with `http://localhost:<port>` as the request origin: build canonical, sitemap and Open Graph URLs from `site.url` in `lib/site.ts` (the starter's `absoluteUrl()`), never from `request.url`.
- Prerender reads local binding state (`.wrangler/state`); data that must come from production bindings at build time needs seeding or remote bindings.
- Prerendered pages refresh only on the next build. Tell the user how content updates reach the site.

**Prerendering is server-side rendering at build time:** crawlers and visitors get the same complete HTML as with SSR, served as a static file. It satisfies "SSR for every indexed page"; what it can't do is per-request content.

**Nothing time- or visitor-dependent in prerendered markup.** A prerendered page renders once at build time and hydrates later in the visitor's browser; anything that differs between the two (the current year, "open now", countdowns, greetings, the visitor's city) causes a hydration mismatch, and React then re-renders the whole page in the browser. Compute such values after hydration (an effect), in a server-rendered route, or mark a single text node with `suppressHydrationWarning` when the build-time value is acceptable (the starter's footer year).

Streaming SSR is the default (no `entry.server.tsx` in new projects): browsers get the shell immediately and suspended parts stream in; known bots get the complete document. Run `npx react-router reveal entry.server` only when you need custom headers, a CSP nonce or a different stream timeout.

## 8. Cloudflare bindings and the typed context

In React Router v8 the request context is a `RouterContextProvider`. Give loaders, actions and middleware typed access to the Worker's `env` and `ctx`:

```ts
// app/lib/cloudflare-context.ts
import { createContext } from 'react-router';

export type CloudflareContext = { env: Env; ctx: ExecutionContext };
export const cloudflareContext = createContext<CloudflareContext>();
```

```ts
// workers/app.ts (simplified; the starter adds redirects and trailing-slash handling)
import { createRequestHandler, RouterContextProvider } from 'react-router';
import { cloudflareContext } from '../app/lib/cloudflare-context';

const handler = createRequestHandler(() => import('virtual:react-router/server-build'), import.meta.env.MODE);

export default {
  async fetch(request, env, ctx) {
    const context = new RouterContextProvider();
    context.set(cloudflareContext, { env, ctx });
    return handler(request, context);
  },
} satisfies ExportedHandler<Env>;
```

```ts
// in a route
export async function loader({ context }: Route.LoaderArgs) {
  const { env, ctx } = context.get(cloudflareContext);
  // env.DB, env.CONTENT, ctx.waitUntil(...)
}
```

`import { env } from 'cloudflare:workers'` also works for reading bindings (it's what the scaffold's demo uses); use the typed context when you need `ctx` or want testable loaders. Never create binding-derived clients at module scope: I/O is only allowed inside a request.

Bindings in `wrangler.jsonc` (add only what the project uses; then run `npm run cf-typegen` so `Env` is typed):

```jsonc
{
  "vars": { "TURNSTILE_SITE_KEY": "0x4AAAA…" },
  "d1_databases": [{ "binding": "DB", "database_name": "site", "database_id": "…" }],
  "kv_namespaces": [{ "binding": "CONTENT", "id": "…" }],
  "r2_buckets": [{ "binding": "MEDIA", "bucket_name": "site-media" }],
  "images": { "binding": "IMAGES" },
  "send_email": [{ "name": "EMAIL" }],
  "ratelimits": [{ "name": "LEAD_LIMITER", "namespace_id": "1001", "simple": { "limit": 5, "period": 60 } }]
}
```

- **Turnstile:** the public site key lives in `app/lib/site.ts` (`site.turnstileSiteKey`, so prerendered pages render the widget too; empty disables Turnstile), the secret via `wrangler secret put TURNSTILE_SECRET_KEY`. The starter fails closed when a site key is set but the secret is missing. Verify every token server-side at `https://challenges.cloudflare.com/turnstile/v0/siteverify`; tokens are single-use and expire after 300 s. Test keys exist for development (site key `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA` always pass).
- **Email:** `env.EMAIL.send({ to, from, subject, text, html, replyTo })` through Cloudflare Email Service. Sending to your own verified destination addresses (lead notifications to the business) works on any plan; sending to arbitrary recipients requires onboarding the domain and Workers Paid. Alternatively use the business's existing email provider's HTTP API.
- **Rate limiting:** `const { success } = await env.LEAD_LIMITER.limit({ key })`; periods are 10 or 60 seconds and counts are approximate per location, which is fine for spam protection.
- **D1** for leads, orders and app data; **KV** for read-heavy config and cached content; **R2** for files and media; **Queues** for reliable background work (webhooks, emails) when volumes grow.

## 9. Data loading: indexed pages vs app areas

**Indexed pages:** everything search engines should see comes from the `loader` and is rendered on the server. Await critical data. Defer only genuinely secondary content (e.g. "related articles") by returning an un-awaited promise and rendering it with `<Suspense>` + `<Await>`; bots still receive the complete HTML because the entry waits for all content for known crawlers.

**App areas (panels, accounts):** never block the shell on data.
- Return promises from the loader for slow data and render each with `<Suspense fallback={<TableSkeleton />}>` + `<Await>` (or React's `use()` in a child component). The layout, navigation and page header appear instantly; skeletons that match the final layout fill in.
- Use `clientLoader` (with `HydrateFallback`) for data that only makes sense in the browser, and `useFetcher` for in-place loading and mutations.
- Lazy-load heavy widgets (charts, editors, maps) with `React.lazy` + `Suspense`.
- `<Link prefetch="intent">` on navigation, `shouldRevalidate` to skip needless reloads, pagination, sorting and filtering in the URL.

Use the `url` argument (`({ url })`) for path logic in loaders, actions and middleware: `request.url` can be the internal `.data` URL during client navigations.

## 10. SEO plumbing

**Metadata:** every indexable route exports `meta` built with the shared `seo()` helper (starter: `app/lib/seo.ts`). It returns the title, description, canonical, Open Graph and Twitter tags, robots directives and optional JSON-LD as React Router meta descriptors, always with absolute URLs built from `site.url`.

```tsx
export const meta: Route.MetaFunction = ({ loaderData }) =>
  seo({
    title: 'Sports Massage in Utrecht | Studio Fysio',
    description: 'Hands-on sports massage near Utrecht Centraal. Book online in 30 seconds, same-week appointments.',
    path: '/services/sports-massage',
    image: '/og/sports-massage.jpg',
    jsonLd: [serviceJsonLd(loaderData.service), breadcrumbJsonLd([...])], // serviceJsonLd: your own helper next to the starter's
  });
```

`meta` receives `loaderData` (v8 removed the old `data` argument). React 19 `<title>`/`<meta>` elements inside components also work; pick one approach per project, and prefer the `meta` export so the leaf route's tags win without duplicates.

**Sitemap and robots:** resource routes registered in `routes.ts` (`route('sitemap.xml', 'routes/sitemap.ts')`, `route('robots.txt', 'routes/robots.ts')`) that read the pages list from `content/pages.ts` and `site.url`. The sitemap can be prerendered. The robots route disallows everything on non-production hosts (preview URLs).

**404 and errors:** unmatched URLs return a real 404 rendered by the root `ErrorBoundary`; design that page (search, popular links, contact). For dynamic routes, `throw data(null, { status: 404 })` from the loader when the slug doesn't exist. A splat route that only renders a component returns 200: a soft 404 that hurts SEO.

**JSON-LD:** build it from `content/` and `lib/site.ts` with small typed helpers (`organizationJsonLd`, `localBusinessJsonLd`, `breadcrumbJsonLd`, `productJsonLd` …) and pass it through `seo({ jsonLd })`.

## 11. Redirects, trailing slashes, canonical host

- **Redirect map** for migrations: a `Map` of old path to new path checked at the top of `workers/app.ts`, before React Router, answering `301`. (Old URLs are never prerendered, so they always reach the Worker.)
- **Trailing slashes:** `html_handling: "drop-trailing-slash"` handles prerendered pages; the starter's Worker redirects `/path/` → `/path` for server-rendered routes.
- **Canonical host** (`www` vs apex): configure a Cloudflare Redirect Rule on the zone; it runs before the Worker and also covers static assets.
- **Preview and `workers.dev` URLs:** keep them out of search through the robots route; disable the `workers.dev` route in production if it isn't needed.

## 12. Caching and response headers

- **Static assets:** `public/_headers` gives hashed files a year-long immutable cache:
  ```
  /assets/*
    Cache-Control: public, max-age=31536000, immutable
  ```
- **Security headers:** set them twice, because `_headers` applies only to static files (including prerendered HTML) and never to Worker responses: once in `public/_headers` for `/*`, and once in the Worker (the starter's `workers/app.ts` adds them). At minimum: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN` (or CSP `frame-ancestors`), a restrictive `Permissions-Policy`, and HSTS once HTTPS is stable.
- **SSR responses aren't cached by Cloudflare's CDN**: Workers run in front of the cache, and zone cache rules don't apply to them. Options:
  1. Prerender (best for marketing pages).
  2. **Workers Cache** (`"cache": { "enabled": true }` in `wrangler.jsonc`) caches the Worker's own responses according to `Cache-Control`, with tag-based purging (`Cache-Tag` header + `ctx.cache.purge`). Two cautions: a 200 *without* `Cache-Control` is cached heuristically (around 2 hours), and cookies are not part of the cache key, so personalised or session-dependent responses must never be shared. The starter's root middleware therefore defaults every response to `Cache-Control: private, no-cache` (no shared caching, still back/forward-cache friendly); public routes opt in with a `headers` export, and logged-in areas use `private, no-store`. With Workers Cache enabled, every request, static assets included, is billed as a Worker request.
  3. Short browser caching (`max-age=60`) for semi-static SSR pages when neither of the above fits.
- The route `headers` export applies to both the HTML document and the `.data` request of client navigations.

### Third-party scripts and consent
- Every third-party script (analytics, tag managers, chat, booking, review and map widgets) costs speed and privacy. Load the ones that remain after the user's choices with `defer`, after the main content, or on interaction (a "Load map" button, a chat bubble that loads the widget when clicked).
- Cloudflare Web Analytics on Workers needs its beacon snippet added manually (`<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"…"}'>`, rendered from `root.tsx`).
- When consent is required (cookie-setting tools in the EU), build a small consent banner yourself instead of a heavy consent platform: fixed to the bottom of the viewport (no layout shift), compact (so it can't become the LCP element), rendered after hydration from a stored choice (cookie or `localStorage`), with equal-weight Accept and Reject buttons and a link to the cookie policy. Load the tracking scripts only after consent, and offer a "Cookie settings" link in the footer to change the choice.

## 13. Fonts

Self-host with Fontsource variable packages (hashed, immutable, no third-party connection):

```tsx
// app/root.tsx
import '@fontsource-variable/inter-tight/wght.css';
import interTightLatin from '@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff2?url';

export const links: Route.LinksFunction = () => [
  { rel: 'preload', href: interTightLatin, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
];
```

- Check the exact file names in `node_modules/@fontsource-variable/<family>/files/`.
- Preload only the one or two files used above the fold (usually the latin subset of the display and text faces).
- `font-display: swap` (Fontsource's default) plus a fallback stack with similar metrics. If the swap visibly shifts layout, add a metric-adjusted fallback `@font-face` (`size-adjust`, `ascent-override`).
- Brand fonts the user owns: put the woff2 files in `app/assets/fonts/`, declare `@font-face` in global.css and import the file URLs through Vite so they are hashed.

## 14. Images

- **Build-time variants** (simple, free): `vite-imagetools` generates responsive, hashed AVIF/WebP files from imports (`import hero from './hero.jpg?w=640;960;1280;1920&format=avif;webp&as=picture'`). Add its type declarations (`declare module '*&as=picture'` etc.) in a `.d.ts`. Or run a `sharp` script that writes to `public/images/`. Image processing never runs inside the Worker.
- **Cloudflare Images** when the catalogue is large or edited by non-developers: the `images` binding (`env.IMAGES.input(stream).transform({ width }).output({ format: 'image/avif' })`) or URL transformations (`/cdn-cgi/image/width=800,format=auto/<path>`, which require a custom domain on a Cloudflare zone with Transformations enabled). Allow-list widths so the number of unique transformations stays within the free 5,000 a month or a known budget, and cache transformed responses.
- Every image goes through the shared `Image` component (imagery.md section 7).

## 15. Performance budgets

Per indexed route on a mid-range phone over 4G:

| Metric | Budget |
|---|---|
| LCP | field (real users) < 2.0 s; Lighthouse's simulated slow-4G mobile ≤ 2.5 s (Google's "good" threshold is 2.5 s) |
| CLS | < 0.05 |
| INP | < 150 ms |
| Lighthouse mobile | Performance ≥ 95, Accessibility 100, Best Practices 100, SEO 100 |
| JavaScript (gzip) | React + React Router baseline plus at most about 30 KB of route code; no third-party scripts in the critical path |
| CSS | global.css ≤ 8 KB raw; route CSS small enough that total CSS per page stays under about 40 KB raw |
| Fonts | at most 2 preloaded files, about 100 KB total |
| Hero image | ≤ about 200 KB at mobile width |
| HTML | well under 2 MB uncompressed (Googlebot's fetch limit) |

Measure, don't guess: quality.md lists the commands. For reference, the starter's prerendered page, served compressed, scores Performance 97 with LCP 2.2 s and CLS 0 in Lighthouse mobile; React 19 + React Router 8 cost about 107 KB of gzipped JavaScript before any route code.

## 16. Dependencies

Every dependency must justify its bytes. Fine: `isbot` (comes with the template), a tree-shaking icon package such as `lucide-react`, `@fontsource-variable/*`, `vite-imagetools`, a small validation library for forms if hand-written validation gets unwieldy, `@tanstack/react-table`/`react-virtual` in panels. Avoid on public pages: UI kits, CSS-in-JS runtimes, Tailwind (NGD uses CSS Modules), moment/lodash-style kitchen sinks, animation frameworks in the root bundle, client-side analytics SDKs that block rendering, chat widgets on load. Don't add `@react-router/node`, `@react-router/express` or `@react-router/serve` to a Workers app: their presence switches the app to the Node server entry.

## 17. Configuration and secrets

- Public, non-secret configuration in `wrangler.jsonc` `vars` (`TURNSTILE_SITE_KEY`, feature flags). Site facts that never differ per environment (production URL, contact details) live in `app/lib/site.ts`.
- Secrets with `npx wrangler secret put NAME`; locally in `.dev.vars` (git-ignored). Commit a `.dev.vars.example` with the names and dummy values.
- Re-run `npm run cf-typegen` (`wrangler types`) after changing bindings; the generated `worker-configuration.d.ts` types `Env` and the runtime. It is git-ignored and regenerated on install.
- `wrangler types` learns secret names from `.dev.vars`, which is git-ignored, so a CI typecheck won't see them. Read secrets through a small typed helper with optional fields (the starter's `leadBindings(env)`), so code typechecks with or without `.dev.vars`.
- Never put secrets in client code, `vars`, the repository or DESIGN.md.

## 18. Deploying

```sh
npx wrangler login                         # or CLOUDFLARE_API_TOKEN in CI
npm run deploy                             # react-router build && wrangler deploy
npx wrangler versions upload               # preview URL without promoting to production
npx wrangler deploy --dry-run --outdir .wrangler/dry-run   # check the bundle ("Total Upload")
```

- Custom domain: `"routes": [{ "pattern": "www.example.com", "custom_domain": true }]` in `wrangler.jsonc`, with the zone on Cloudflare.
- Continuous deployment: Workers Builds (connect the Git repository in the Cloudflare dashboard) or CI with `wrangler deploy`. React Router v8 needs Node 22.22 or newer in the build environment.
- Plans: the Free plan allows 10 ms of CPU per request, and React SSR typically needs 10–20 ms. Prerendering keeps most traffic off the Worker; for SSR-heavy sites (shops, panels) recommend Workers Paid.
- Worker size limit is 64 MiB uncompressed on all plans; a starter site is under 1 MB.
- Before go-live, check the zone's AI crawler / bot settings so search crawlers aren't blocked (seo.md section 9).

## 19. Stale guidance to ignore

Plenty of tutorials (and some official pages) predate React Router v8. Don't copy:
- `context.cloudflare.env` / `getLoadContext` returning a plain object / `declare module 'react-router' { interface AppLoadContext }`. In v8, passing a plain object as context makes every request fail with HTTP 500 ("Invalid `context` value provided to `handleRequest`").
- `future.v8_*` or `future.unstable_*` flags in `react-router.config.ts`: they are removed and now cause config errors.
- `react-router-dom`, `@react-router/dev/vite/cloudflare`, `cloudflareDevProxy`, `meta({ data })`.
- Claims that prerendering doesn't work with the Cloudflare Vite plugin (it does in v8), and Worker size limits of 3 MB / 10 MB (now 64 MiB).
- Starter templates still on React Router 7 (several "deploy to Cloudflare" templates are).

## 20. Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Every request returns 500 "Invalid `context` value" | A plain object was passed as context: use `RouterContextProvider` (section 8) |
| Config error mentioning `future.v8_…` | Remove the flag; the behaviour is now default |
| `/about` redirects to `/about/` | Prerendered page with default `html_handling`: set `drop-trailing-slash` |
| Form POST returns 405 with an empty body | The form posts to a prerendered path: post to a server-rendered route instead |
| Sitemap or canonical contains `localhost` | Built from `request.url` during prerender: use `absoluteUrl()` / `site.url` |
| `create-react-router` fails behind a proxy | Run with `NODE_USE_ENV_PROXY=1` |
| The scaffolder refuses the folder or the name | It needs a new, empty folder with a lowercase-hyphenated name: scaffold next to `DESIGN.md`/`design/`, then move them in (section 2) |
| App renders with the Node entry or crashes on Workers | `@react-router/node`/`serve`/`express` is installed: remove it |
| `Env` type is missing a binding | Run `npm run cf-typegen` after editing `wrangler.jsonc` |
| A secret is missing from `Env` in CI only | `.dev.vars` is git-ignored, so `wrangler types` can't see it there: access secrets through a typed helper with optional fields (starter: `leadBindings`) |
| `composes … from '~/…'` fails: "path from fileResolve must be absolute" | Add the explicit `~` alias to `vite.config.ts` (`resolve.alias`) |
| DOM types act strangely (`HTMLSelectElement` not assignable to `Element`, `append` expects a `Response`) | The Workers runtime types redeclare the global `Element` (HTMLRewriter) in the shared tsconfig: use `HTMLElement` generics, structural types or `appendChild` |
| Local Lighthouse: low performance, "page is blocked from indexing" | `vite preview` doesn't compress and the robots route blocks non-production hosts: measure a preview deployment or a compressing static server instead |
