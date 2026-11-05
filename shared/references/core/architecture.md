# Architecture: TanStack Start on Cloudflare Workers

How every new ngd project is built: the latest TanStack Start (React, file-based TanStack Router, server functions) with server rendering, deployed to Cloudflare Workers, styled with CSS Modules, organised so shared code lives in one place. Facts here were verified against TanStack Start 1.169 (`@tanstack/react-router` 1.170) and the Cloudflare tooling of November 2026. Versions move, so **check before you build** (section 1) and treat the agent skills shipped inside the installed packages (`node_modules/@tanstack/*/skills/`) as the version-matched API reference.

**Existing project on React Router** (`react-router.config.ts`, `app/routes.ts`, `workers/app.ts`): keep it on React Router and read `architecture-react-router.md` instead. Don't migrate it unless the user asks.

## Contents
1. Always the latest version
2. Scaffold a new project
3. Upgrade an existing project
4. Project structure
5. Styling architecture
6. Extracting common code
7. Rendering strategy
8. Cloudflare bindings
9. Data loading, server functions and forms
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
npm view @tanstack/react-start version     # latest stable TanStack Start
npm view @tanstack/react-router version
npm view @cloudflare/vite-plugin dist-tags wrangler version
```

- New projects use the latest stable `@tanstack/react-start` and `@tanstack/react-router` (1.169 / 1.170 at the time of writing). Both release often; minor versions are compatible.
- Use the latest **stable** `@cloudflare/vite-plugin` that the scaffolder installs (1.x today). Version 2.0 is a beta with breaking changes (config moves to `cloudflare.config.ts` and deploys go through a separate `cf` CLI); don't adopt betas without the user asking.
- When an API detail is unclear, read the skills that ship with the installed packages: `node_modules/@tanstack/start-client-core/skills/start-core/` (server functions, server routes, middleware, execution model, deployment), `node_modules/@tanstack/router-core/skills/router-core/` (data loading, search params, navigation, auth and guards, SSR) and `node_modules/@tanstack/react-start/skills/`. They match the installed version; blog posts and older answers often don't (section 19).

## 2. Scaffold a new project

```sh
npm create cloudflare@latest -- my-site --framework=tanstack-start
# non-interactive (agents, CI):
CI=true npx -y create-cloudflare@latest my-site --framework=tanstack-start --platform=workers --no-deploy --no-git --no-open -y
```

This runs the official TanStack Start template and adds the Cloudflare files: `wrangler.jsonc`, `@cloudflare/vite-plugin` in `vite.config.ts`, Wrangler, type generation. Behind a corporate or sandbox proxy, the template download may need `NODE_USE_ENV_PROXY=1`.

**Where it lands.** The scaffolder creates a new folder and refuses a non-empty one, and its name must be lowercase with hyphens (`kinetic-physio`, not `Kinetic Physio`). If phases 1–3 already put `DESIGN.md` and `design/` in the current folder, scaffold into a new folder named after the project, then move `DESIGN.md` and `design/` into it, and continue there. (Or scaffold into a temporary folder and move its contents into the current one, if the user wants the project at the current path.)

**Then clean it up for NGD** (the verified starter files in `assets/starter/` give you the replacements; its README lists every file and step):
1. Remove Tailwind, the devtools and the router CLI: `npm rm tailwindcss @tailwindcss/vite @tailwindcss/typography @tanstack/react-devtools @tanstack/react-router-devtools @tanstack/devtools-vite @tanstack/router-cli`; delete `src/components/`, `src/styles.css`, the demo routes (`src/routes/about.tsx`, `src/routes/index.tsx`) and `tsr.config.json`. NGD styling is CSS Modules plus a small global stylesheet (section 5).
2. Copy the starter files you need and overwrite `vite.config.ts`, `tsconfig.json`, `src/router.tsx` and `src/routes/__root.tsx`: the shell, `src/server.ts`, `src/styles/global.css`, `src/lib/*` (site config, SEO helper, lead handling), the sitemap and robots routes, `public/_headers`, and the components you'll use (StepForm, Reveal, Image). For a panel, add `assets/starter-panel/` on top (its README explains the routes).
3. **`wrangler.jsonc` (merge, don't overwrite):** set `name`; set `"main": "./src/server.ts"` (the template's `@tanstack/react-start/server-entry` skips the starter's server entry, so redirects and security headers would silently not run); replace the template's old `compatibility_date` with today's date; keep its `nodejs_compat` flag; add `"assets": { "html_handling": "drop-trailing-slash" }`, public `vars` and the bindings you need (section 8).
4. Add `"typecheck": "tsc --noEmit"` to the `package.json` scripts.
5. Generate `src/styles/tokens.css` with `node <skill-dir>/scripts/palette.mjs --brand "#hex" --out src/styles/tokens.css`, with the same options as the chosen preset's tokens (`--mode light|dark` for a fixed default, `--neutral-hue` if used; both token sets are always emitted so `data-theme` bands work). Regenerate it whenever palette.mjs changes: components rely on every token it emits.
6. Set the production URL, contact details and navigation in `src/lib/site.ts` (`site.url` is the one source for absolute URLs), and the pages and what gets prerendered in `src/content/pages.ts`.
7. Run `npm run build && npm run typecheck` before writing features. The build (and `npm run dev`) generates `src/routeTree.gen.ts`, the typed route tree the typecheck reads; commit it.

## 3. Upgrade an existing project

- **TanStack Start project:** update to the latest release (`npm i @tanstack/react-start@latest @tanstack/react-router@latest`), then build and typecheck. Read the package changelogs for anything marked breaking.
- **React Router project** (v7 or v8): stay on React Router and follow `architecture-react-router.md` section 3. Moving it to TanStack Start is a rewrite of every route file, not a dependency bump: only on the user's request, as a planned migration (TanStack ships a guide in `node_modules/@tanstack/react-router/skills/lifecycle/migrate-from-react-router/`).
- **Remix v2, React Router v6, Next.js or anything else:** plan the migration with the user first.
- Always tell the user before a major-version upgrade or a framework change, and run the full verification afterwards.

## 4. Project structure

```
src/
  router.tsx               createRouter: intent preloading, scroll restoration, type registration
  server.ts                Worker entry (wrangler "main"): redirects, trailing slash, security headers, Cache-Control default, noindex off-production
  routeTree.gen.ts         GENERATED by the build and dev server from src/routes. Commit it; never edit it.
  routes/                  file-based routing (the file name is the URL)
    __root.tsx             document shell (<html lang>, <HeadContent />, <Scripts />), global CSS, fonts, 404 and error pages
    _site.tsx              pathless layout (leading underscore: no URL segment) for public pages: header + footer
    _site/
      index.tsx + index.module.css       /
      contact.tsx + contact.module.css   /contact (has the lead form's POST handler; never prerendered)
      services.tsx …       one file (+ module) per page
      about/               a bigger page becomes a folder: about/index.tsx + its one-off sections in -components/
    sitemap[.]xml.ts, robots[.]txt.ts    server routes ([.] escapes the dot)
    app/                   panel (ngd-panel): route.tsx is the /app layout, index.tsx, customers.tsx …
  styles/
    tokens.css             GENERATED by scripts/palette.mjs: color ramps + semantic color tokens. Don't hand-edit.
    global.css             small: cascade layers, non-color tokens, reset, base element styles (budget: section 5)
    typography.module.css  shared text styles that modules `compose` (eyebrow, display, lead, prose)
  components/
    ui/                    primitives used everywhere: Button/ButtonLink, Icon, Field, Input, Badge, Card, Skeleton, Dialog
    layout/                SiteHeader, MobileNav, SiteFooter, Section (full width with the gutter; no centred container)
    sections/              page sections: Hero, LogoWall, FeatureGrid, Testimonials, Faq, CtaBand, Pricing, Stats …
    forms/                 StepForm (conversational lead form) and its fields
    media/                 Image (responsive image contract), Video
  lib/
    site.ts                single source of truth: name, production URL (site.url), locale, contact details, socials, navigation
    seo.ts                 seo() head builder and JSON-LD helpers
    *.functions.ts         server functions (createServerFn): the data boundary for loaders and components
    *.server.ts            server-only code (bindings, Turnstile, lead delivery, database access); never imported by components
  content/                 typed content: services, FAQs, testimonials, team, pages list (feeds pages, JSON-LD, sitemap, prerender list)
  hooks/                   small shared hooks
public/                    favicon set, _headers, og images, other static files
design/                    NGD artifacts (presets, seo-plan.md, references, screenshots). Not deployed.
DESIGN.md                  the design brief
```

Routing rules worth knowing:
- `index.tsx` is the folder's own URL, `route.tsx` inside a folder is that folder's layout, `$id.tsx` is a path param, `$.tsx` a splat. Files and folders starting with `-` are ignored by the router: put a route's private components in `-components/`. CSS files are never routes, so `contact.module.css` can sit next to `contact.tsx`.
- `createFileRoute('/_site/contact')` takes the route's id (its path including pathless segments like `_site`). With `npm run dev` running, the dev server fills a new, empty route file with a template and corrects a wrong id; the build doesn't. Never edit `routeTree.gen.ts`.

Naming: components and their modules in PascalCase (`Button.tsx`, `Button.module.css`), routes in kebab-case, CSS Module classes in camelCase (`styles.heroTitle`). Import with the `~/` alias (`~/components/ui/Button/Button`).

## 5. Styling architecture

**Files and order** (imported in `src/routes/__root.tsx`): the font CSS, `tokens.css`, then `global.css`. Vite bundles them into the root stylesheet. Each component and route imports its own `.module.css`; TanStack Start links every matched route's CSS in `<HeadContent />` during server rendering (also for code-split routes, and in dev), so there is no flash of unstyled content.

**global.css budget:** at most about 8 KB / 250 lines. It may contain only:
- the `@layer reset, base;` declaration;
- non-color tokens on `:root`: type scale, font stacks, spacing, radii, shadows, motion, z-index, the gutter and text measure, header height;
- a modern reset (box-sizing, margins, media defaults, form font inheritance);
- base element styles: `html`/`body` (background, color, font, `text-rendering`), headings scale, links, `:focus-visible`, `::selection`, `.visually-hidden`, `prefers-reduced-motion` defaults, view-transition timings.

Reset and base live in cascade layers; CSS Modules are unlayered, so component styles always win without specificity fights. Everything else lives in modules. If global.css grows past the budget, something component-specific leaked into it: move it.

**CSS Module rules:**
- One module per component or route, next to it. No plain `.css` imports outside `__root.tsx`.
- Use semantic tokens (`var(--color-text-muted)`, `var(--space-6)`, `var(--radius-md)`), never raw hex values or magic numbers that should be tokens.
- Share text styles through `composes`: `.title { composes: display from '~/styles/typography.module.css'; }`. This needs the explicit `~` alias in `vite.config.ts` (the starter has it); tsconfig paths alone don't reach CSS. Share behaviour through components, not copy-pasted CSS.
- A parent restyling a child component must not rely on stylesheet order (CSS chunk order between modules isn't guaranteed): give the child a prop (`variant`, `size`), or use a more specific selector in the parent (`.actions .cta`).
- Keep selectors flat (native nesting at most two levels deep), avoid `:global` except for third-party markup.
- Responsive components use container queries (`container-type: inline-size` on the component root) so they adapt wherever they're placed; page-level layout uses a few media queries.
- Dark bands: `data-theme="dark"` on a section flips all tokens inside it.
- Current links: TanStack Router's `Link` sets `aria-current="page"` (and `data-status="active"`) on the active link; style `[aria-current='page']`. It also adds an `active` class, which carries no styles. Links to a section root (`/`, `/app`) that shouldn't stay current on every child page need `activeOptions={{ exact: true }}`; in-page links (`hash`) need `activeOptions={{ includeHash: true }}`.
- No inline `style` except to pass dynamic custom properties (`style={{ '--progress': '40%' }}`).
- No Tailwind, no CSS-in-JS runtime, no UI kit stylesheets.

## 6. Extracting common code

Duplication is the enemy of a site that stays beautiful as it grows.
- **Second use extracts.** The second time a UI pattern appears, make it a component in `components/`; the third time a piece of logic repeats, make it a function in `lib/` or a hook.
- **Layers:** primitives (`ui/`) know nothing about the business; sections compose primitives and accept content as props; routes compose sections, load data and own only page-specific layout.
- **One source of truth for facts:** navigation, contact details, opening hours, social links and the production URL live in `lib/site.ts` and feed the header, footer, contact page, JSON-LD and sitemap.
- **Content as data:** lists of services, FAQs, testimonials, team members and plans live in `content/*.ts` as typed arrays. Pages render them, JSON-LD reuses them, the sitemap enumerates them.
- **Typed links:** navigation entries hold route paths (`{ label: 'Contact', to: '/contact' }`, in-page targets with `hash`), and every `Link`/`ButtonLink` checks them against the route tree. A link to a page that doesn't exist fails the typecheck, so create the page (or remove the link) instead of casting.
- **Server-only code** goes in `*.server.ts` files, reached only through server functions or server route handlers, so it can never leak into the client bundle.
- **Don't over-abstract:** prefer small composable components over one mega-component with twenty props. A section used once stays in the route's `-components/` folder until a second use appears.

## 7. Rendering strategy

| Page kind | Strategy | Why |
|---|---|---|
| Marketing and content pages whose content only changes on deploy (home, services, about, legal, articles) | **Prerender** at build time | Served by Workers Static Assets without running the Worker: fastest response, free requests, complete HTML for crawlers |
| Pages with a POST handler (contact, newsletter), per-request data (search, live stock), or personalisation | **SSR** on the Worker, streaming | Prerendered paths reject POST with 405, and fresh data needs a server |
| Content from a CMS that changes often | SSR + Workers Cache with `Cache-Control`, or prerender + rebuild on publish (deploy hook) | Fresh enough without paying for SSR on every request |
| Panels and logged-in areas | SSR shell + streamed data with skeletons, `noindex`, `private, no-store` | Fast first paint, data never blocks the shell |

Prerendering setup, driven by one list:

```ts
// vite.config.ts (excerpt; the starter has the full file)
import { prerenderPaths } from './src/content/pages';

tanstackStart({
  prerender: {
    enabled: true,
    autoStaticPathsDiscovery: false, // only the listed paths…
    crawlLinks: false,               // …never whatever the pages link to
    autoSubfolderIndex: false,       // /about → about.html
    failOnError: true,
  },
  pages: prerenderPaths.map((path) => ({ path })),
}),
```

Rules that keep prerendering correct:
- **Keep discovery and crawling off.** By default Start prerenders every static route it finds and follows links, which would turn `/contact` (a POST handler) into a static file that answers 405. The list in `content/pages.ts` is the single source.
- Set `"assets": { "html_handling": "drop-trailing-slash" }` in `wrangler.jsonc` so `/about` serves `about.html` directly.
- The prerender runs locally with `http://localhost:<port>` as the request origin: build canonical, sitemap and Open Graph URLs from `site.url` in `lib/site.ts` (the starter's `absoluteUrl()`), never from the request URL.
- Prerender reads local binding state (`.wrangler/state`); data that must come from production bindings at build time needs seeding or remote bindings.
- Prerendered pages refresh only on the next build. Tell the user how content updates reach the site.

**Prerendering is server-side rendering at build time:** crawlers and visitors get the same complete HTML as with SSR, served as a static file. It satisfies "SSR for every indexed page"; what it can't do is per-request content.

**Nothing time- or visitor-dependent in prerendered markup.** A prerendered page renders once at build time and hydrates later in the visitor's browser; anything that differs between the two (the current year, "open now", countdowns, greetings, the visitor's city) causes a hydration mismatch, and React then re-renders the whole page in the browser. Compute such values after hydration (an effect), in a server-rendered route, or mark a single text node with `suppressHydrationWarning` when the build-time value is acceptable (the starter's footer year).

**Streaming:** server rendering streams by default. Browsers get the shell and `<Suspense>` fallbacks immediately and the rest as it resolves; known crawlers (detected with `isbot`) get the complete document. Headless browsers count as crawlers (their user agent says `HeadlessChrome`), so test streaming with a normal user agent. Per-route `ssr: false` or `ssr: 'data-only'` exist for browser-only screens; children can only be more restrictive than their parent.

## 8. Cloudflare bindings

Read bindings and the execution context from the Workers runtime module, inside server-only code (server functions, server route handlers, `*.server.ts`):

```ts
// src/lib/leads.server.ts
import { env, waitUntil } from 'cloudflare:workers';

export async function deliverLead(lead: Lead) {
  await env.DB.prepare('INSERT INTO leads …').bind(…).run();
  waitUntil(notifyOwner(lead)); // runs after the response
}
```

- Never import `cloudflare:workers` (or a `*.server.ts` module) from a component or a route's loader directly: loaders also run in the browser (section 9). Go through a server function or a server route.
- `env` is per request in spirit: don't create binding-derived clients or read request data at module scope; I/O is only allowed inside a request. `process.env.X` at module scope is `undefined` on Workers.
- Request details (headers, cookies, IP, URL) come from `@tanstack/react-start/server` inside server code: `getRequest()`, `getRequestHeader()`, `getCookie()`, `setResponseHeader()`, `setResponseStatus()`.

Bindings in `wrangler.jsonc` (add only what the project uses; then run `npm run cf-typegen` so `Env` is typed):

```jsonc
{
  "vars": { "FEATURE_X": "on" },
  "d1_databases": [{ "binding": "DB", "database_name": "site", "database_id": "…" }],
  "kv_namespaces": [{ "binding": "CONTENT", "id": "…" }],
  "r2_buckets": [{ "binding": "MEDIA", "bucket_name": "site-media" }],
  "images": { "binding": "IMAGES" },
  "send_email": [{ "name": "EMAIL" }],
  "ratelimits": [{ "name": "LEAD_LIMITER", "namespace_id": "1001", "simple": { "limit": 5, "period": 60 } }]
}
```

- **Turnstile:** the public site key lives in `src/lib/site.ts` (`site.turnstileSiteKey`, so prerendered pages render the widget too; empty disables Turnstile), the secret via `wrangler secret put TURNSTILE_SECRET_KEY`. The starter fails closed when a site key is set but the secret is missing. Verify every token server-side at `https://challenges.cloudflare.com/turnstile/v0/siteverify`; tokens are single-use and expire after 300 s. Test keys exist for development (site key `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA` always pass).
- **Email:** `env.EMAIL.send({ to, from, subject, text, html, replyTo })` through Cloudflare Email Service. Sending to your own verified destination addresses (lead notifications to the business) works on any plan; sending to arbitrary recipients requires onboarding the domain and Workers Paid. Alternatively use the business's existing email provider's HTTP API.
- **Rate limiting:** `const { success } = await env.LEAD_LIMITER.limit({ key })`; periods are 10 or 60 seconds and counts are approximate per location, which is fine for spam protection.
- **D1** for leads, orders and app data; **KV** for read-heavy config and cached content; **R2** for files and media; **Queues** for reliable background work (webhooks, emails) when volumes grow.

## 9. Data loading, server functions and forms

**Where code runs.** A route's `beforeLoad` and `loader` run on the server for the first request (SSR) and **in the browser** on client navigation. Components render in both. Server functions (`createServerFn`), server route handlers (`server.handlers`) and `*.server.ts` modules run only on the Worker. So:
- Loaders call server functions for anything that needs bindings, secrets or private data: `loader: () => fetchServices()`. Never `fetch('/api/…')` from a loader (relative URLs fail during SSR), and never import server-only modules into a loader.
- Put server functions in `lib/*.functions.ts`; they may import `*.server.ts`. The build replaces their bodies with an RPC stub in the client bundle.
- **Every server function is a public HTTP endpoint**, reachable without the route that calls it. Check authentication and permissions inside it (a function middleware, as in the panel starter), and validate its input with `.validator(…)`. A route guard (`beforeLoad`) only decides what to render.
- Start rejects cross-site server-function calls by default (its CSRF middleware checks `Sec-Fetch-Site`/`Origin`; requests without either get 403). Server route handlers (`server.handlers`) are plain HTTP endpoints without that check.
- **Don't return a bare `null` (or `undefined`) from a server function**: it works during SSR but fails over HTTP with a 500. Return an object (`{ user: null }`).

**Indexed pages:** everything search engines should see is rendered on the server. Await critical data in the loader. Defer only genuinely secondary content (e.g. "related articles") by returning an un-awaited promise and rendering it with `<Suspense>` + `<Await promise={…}>`; crawlers still receive the complete HTML.

**App areas (panels, accounts):** never block the shell on data.
- Return server-function promises from the loader for slow data and render each with `<Suspense fallback={<TableSkeleton />}>` + `<Await>`. The layout, navigation and page header appear instantly; skeletons that match the final layout fill in. Wrap each widget in a `CatchBoundary` so one failure doesn't take down the screen; `router.invalidate()` reloads.
- Table state (filters, sorting, pagination) lives in the URL: `validateSearch` turns it into a typed object, `loaderDeps: ({ search }) => search` reloads when it changes, and `<Link search={…}>`/`navigate({ search })` are type-checked against it.
- Lazy-load heavy widgets (charts, editors, maps) with `React.lazy` + `Suspense`.
- The router preloads a link's code and data on hover/focus (`defaultPreload: 'intent'` in `src/router.tsx`).

**Forms that must work without JavaScript** (lead forms, newsletter, search): post a real `<form method="post" action="/contact">` to a route with a **server route handler**. One handler serves both paths (the starter's `routes/_site/contact.tsx`):

```tsx
export const Route = createFileRoute('/_site/contact')({
  server: {
    handlers: {
      POST: async ({ request, next }) => {
        const { status, result } = await handleLeadSubmission(request);
        // With JavaScript: StepForm posts with fetch and asks for JSON
        if (request.headers.get('Accept')?.includes('application/json')) return Response.json(result, { status });
        // Without: fall through to render this page with the result
        setResponseStatus(status);
        return next({ context: { leadResult: result } });
      },
    },
  },
  loader: ({ serverContext }) => ({ leadResult: serverContext?.leadResult ?? null }),
  component: Contact,
});
```

- `next({ context })` renders the page; the data arrives in the loader as **`serverContext`** (a top-level loader argument, not part of `context`). `next()` returns a marker, not a `Response`: return it directly and set the status with `setResponseStatus` before.
- Validate on the server, answer with the right status (400 invalid, 429 rate-limited, 503 no destination), and never show "thanks" for a submission that went nowhere.
- Forms that only need to work with JavaScript (panel edits) call a server function: `useServerFn(saveCustomer)` and then `router.invalidate()` to reload the screen's data.

## 10. SEO plumbing

**Metadata:** every indexable route has a `head` built with the shared `seo()` helper (starter: `src/lib/seo.ts`). It returns the title, description, canonical, Open Graph and Twitter tags, robots directives, hreflang alternates and JSON-LD as TanStack `head` data (`meta`, `links`, `scripts`), always with absolute URLs built from `site.url`.

```tsx
export const Route = createFileRoute('/_site/services/sports-massage')({
  loader: () => fetchService('sports-massage'),
  head: ({ loaderData }) =>
    seo({
      title: 'Sports Massage in Utrecht | Studio Fysio',
      description: 'Hands-on sports massage near Utrecht Centraal. Book online in 30 seconds, same-week appointments.',
      path: '/services/sports-massage',
      image: '/og/sports-massage.jpg',
      jsonLd: [serviceJsonLd(loaderData), breadcrumbJsonLd([...])], // serviceJsonLd: your own helper next to the starter's
    }),
  component: SportsMassage,
});
```

- Child routes' `title` and same-named `meta` win over the parent's; `<HeadContent />` in the root renders the merged result and updates it on client navigation.
- **JSON-LD must be escaped.** Start writes `head` script children verbatim, so a `</script>` inside any string (a review, a product name) would end the tag. The starter's `seo()` escapes through `jsonForScript()`; use it for every inline JSON script.
- **Sitemap and robots:** server routes (`src/routes/sitemap[.]xml.ts`, `robots[.]txt.ts`) that read the pages list from `content/pages.ts` and `site.url`. The sitemap is prerendered (it's in the prerender list as `/sitemap.xml`). The robots route disallows everything on non-production hosts (preview URLs).
- **404 and errors:** unmatched URLs render the root `notFoundComponent` with a real 404 status; design that page (search, popular links, contact). For dynamic routes, `throw notFound()` from the loader (or the server function) when the slug doesn't exist. A splat route that only renders a component returns 200: a soft 404 that hurts SEO.
- **JSON-LD content:** build it from `content/` and `lib/site.ts` with small typed helpers (`organizationJsonLd`, `localBusinessJsonLd`, `breadcrumbJsonLd`, `productJsonLd` …) and pass it through `seo({ jsonLd })`.

## 11. Redirects, trailing slashes, canonical host

- **Redirect map** for migrations: a `Map` of old path to new path (`src/content/redirects.ts`) checked at the top of `src/server.ts`, before TanStack Start, answering `301`. (Old URLs are never prerendered, so they always reach the Worker.)
- **Trailing slashes:** `html_handling: "drop-trailing-slash"` handles prerendered pages; the starter's server entry redirects `/path/` → `/path` for server-rendered routes.
- **Canonical host** (`www` vs apex): configure a Cloudflare Redirect Rule on the zone; it runs before the Worker and also covers static assets.
- **Preview and `workers.dev` URLs:** the starter keeps them out of search twice: the robots route disallows every non-production host, and the server entry adds `X-Robots-Tag: noindex` to the Worker's responses (prerendered files are served without the Worker, so robots.txt covers those). Put previews that must stay private behind Cloudflare Access. Once `routes` holds the custom domain, Wrangler turns the `workers.dev` address off by default (`workers_dev` defaults to false when routes exist, and version preview URLs follow it); set `"preview_urls": true` if you still want preview URLs for testing.

## 12. Caching and response headers

- **Static assets:** `public/_headers` gives hashed files a year-long immutable cache:
  ```
  /assets/*
    Cache-Control: public, max-age=31536000, immutable
  ```
- **Security headers:** set them twice, because `_headers` applies only to static files (including prerendered HTML) and never to Worker responses: once in `public/_headers` for `/*`, and once in `src/server.ts`. At minimum: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN` (or CSP `frame-ancestors`), a restrictive `Permissions-Policy`, and HSTS once HTTPS is stable.
- **Per-route headers:** a route's `headers: () => ({ 'Cache-Control': '…' })` option sets them on its server-rendered document; server functions and handlers use `setResponseHeader()`.
- **SSR responses aren't cached by Cloudflare's CDN**: Workers run in front of the cache, and zone cache rules don't apply to them. Options:
  1. Prerender (best for marketing pages).
  2. **Workers Cache** (`"cache": { "enabled": true }` in `wrangler.jsonc`) caches the Worker's own responses according to `Cache-Control`, with tag-based purging (`Cache-Tag` header + `ctx.cache.purge`). Two cautions: a 200 *without* `Cache-Control` is cached heuristically (around 2 hours), and cookies are not part of the cache key, so personalised or session-dependent responses must never be shared. The starter's server entry therefore defaults every response without one to `Cache-Control: private, no-cache` (no shared caching, still back/forward-cache friendly); public routes opt in with a route `headers` option, and logged-in areas use `private, no-store`. With Workers Cache enabled, every request, static assets included, is billed as a Worker request.
  3. Short browser caching (`max-age=60`) for semi-static SSR pages when neither of the above fits.

### Third-party scripts and consent
- Every third-party script (analytics, tag managers, chat, booking, review and map widgets) costs speed and privacy. Load the ones that remain after the user's choices with `defer`, after the main content, or on interaction (a "Load map" button, a chat bubble that loads the widget when clicked).
- Cloudflare Web Analytics on Workers needs its beacon snippet added manually (`<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"…"}'>`, rendered from `__root.tsx`).
- When consent is required (cookie-setting tools in the EU), build a small consent banner yourself instead of a heavy consent platform: fixed to the bottom of the viewport (no layout shift), compact (so it can't become the LCP element), rendered after hydration from a stored choice (cookie or `localStorage`), with equal-weight Accept and Reject buttons and a link to the cookie policy. Load the tracking scripts only after consent, and offer a "Cookie settings" link in the footer to change the choice.

## 13. Fonts

Self-host with Fontsource variable packages (hashed, immutable, no third-party connection):

```tsx
// src/routes/__root.tsx
import '@fontsource-variable/inter-tight/wght.css';
import interTightLatin from '@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff2?url';

export const Route = createRootRoute({
  head: () => ({
    links: [{ rel: 'preload', href: interTightLatin, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' }],
  }),
  // …
});
```

- Check the exact file names in `node_modules/@fontsource-variable/<family>/files/`.
- Preload only the one or two files used above the fold (usually the latin subset of the display and text faces).
- `font-display: swap` (Fontsource's default) plus a fallback stack with similar metrics. If the swap visibly shifts layout, add a metric-adjusted fallback `@font-face` (`size-adjust`, `ascent-override`).
- Brand fonts the user owns: put the woff2 files in `src/assets/fonts/`, declare `@font-face` in global.css and import the file URLs through Vite so they are hashed.

## 14. Images

- **Build-time variants** (simple, free): `vite-imagetools` generates responsive, hashed AVIF/WebP files from imports (`import hero from './hero.jpg?w=640;960;1280;1920&format=avif;webp&as=picture'`). The starter's `src/types/imagetools.d.ts` declares the query imports. Or run a `sharp` script that writes to `public/images/`. Image processing never runs inside the Worker.
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
| JavaScript (gzip) | React + TanStack Start baseline plus at most about 30 KB of route code; no third-party scripts in the critical path |
| CSS | global.css ≤ 8 KB raw; route CSS small enough that total CSS per page stays under about 40 KB raw |
| Fonts | at most 2 preloaded files, about 100 KB total |
| Hero image | ≤ about 200 KB at mobile width |
| HTML | well under 2 MB uncompressed (Googlebot's fetch limit) |

Measure, don't guess: quality.md lists the commands. For reference, the starter's prerendered home page, served compressed, scores Performance 99, Accessibility 100 and SEO 100 with LCP 2.2 s and CLS 0 in Lighthouse mobile; React 19 + TanStack Start cost about 108 KB of gzipped JavaScript before any route code (React Router 8 costs the same).

## 16. Dependencies

Every dependency must justify its bytes. Fine: a tree-shaking icon package such as `lucide-react`, `@fontsource-variable/*`, `vite-imagetools`, a small validation library (Zod or Valibot) for server-function input and forms if hand-written validation gets unwieldy, `@tanstack/react-query` in panels that need client-side caching, `@tanstack/react-table`/`react-virtual` in panels. Avoid on public pages: UI kits, CSS-in-JS runtimes, Tailwind (NGD uses CSS Modules), moment/lodash-style kitchen sinks, animation frameworks in the root bundle, client-side analytics SDKs that block rendering, chat widgets on load. Leave the TanStack devtools out of production builds (the starter removes them).

## 17. Configuration and secrets

- Public, non-secret configuration in `wrangler.jsonc` `vars` (feature flags). Site facts that never differ per environment (production URL, contact details, the public Turnstile key) live in `src/lib/site.ts`.
- Secrets with `npx wrangler secret put NAME`; locally in `.dev.vars` (git-ignored). Commit a `.dev.vars.example` with the names and dummy values. `npm run preview` reads the copy of `.dev.vars` made at build time: rebuild after changing it.
- Re-run `npm run cf-typegen` (`wrangler types`) after changing bindings; the generated `worker-configuration.d.ts` types `Env` and the `cloudflare:workers` module.
- `wrangler types` learns secret names from `.dev.vars`, which is git-ignored, so a CI typecheck won't see them. Read secrets through a small typed helper with optional fields (the starter's `leadBindings()`), so code typechecks with or without `.dev.vars`.
- Never put secrets in client code, `vars`, the repository or DESIGN.md.

## 18. Deploying

```sh
npx wrangler login                         # or CLOUDFLARE_API_TOKEN in CI
npm run deploy                             # vite build && wrangler deploy
npx wrangler versions upload               # preview URL without promoting to production
npx wrangler deploy --dry-run --outdir .wrangler/dry-run   # check the bundle ("Total Upload")
```

- The build writes `dist/client` (static assets and prerendered HTML) and `dist/server` (the Worker plus a generated `wrangler.json`); `wrangler deploy` picks them up.
- Custom domain: `"routes": [{ "pattern": "www.example.com", "custom_domain": true }]` in `wrangler.jsonc`, with the zone on Cloudflare.
- Continuous deployment: Workers Builds (connect the Git repository in the Cloudflare dashboard) or CI with `wrangler deploy`. Use Node 22.12 or newer in the build environment.
- Plans: the Free plan allows 10 ms of CPU per request, and React SSR typically needs 10–20 ms. Prerendering keeps most traffic off the Worker; for SSR-heavy sites (shops, panels) recommend Workers Paid.
- Worker size limit is 64 MiB uncompressed on all plans; a starter site is under 1 MB.
- Before go-live, check the zone's AI crawler / bot settings so search crawlers aren't blocked (seo.md section 9).

## 19. Stale guidance to ignore

TanStack Start moved fast on its way to 1.0, and many tutorials describe earlier APIs. Don't copy:
- **Vinxi:** `app.config.ts`, `@tanstack/start` (without `react-`), `createAPIFileRoute`/`createServerFileRoute` and the `app/` directory layout. Start is a Vite plugin now (`tanstackStart()` in `vite.config.ts`), server routes are `server.handlers` on `createFileRoute`, the source lives in `src/`.
- **Nitro presets for Cloudflare** (`target: 'cloudflare-module'`, `nitro({ preset: … })`): on Workers use `@cloudflare/vite-plugin` with `viteEnvironment: { name: 'ssr' }`.
- `getWebRequest()`, `getEvent()` and other h3-era helpers: use `getRequest()` and friends from `@tanstack/react-start/server`.
- `process.env` for bindings or secrets on Workers: use `import { env } from 'cloudflare:workers'`.
- `"main": "@tanstack/react-start/server-entry"` together with a custom `src/server.ts`: the template's value bypasses the custom entry; point `main` at the file.
- React Router patterns (`loader` exports, `action`, `useFetcher`, `meta` exports, `routes.ts`): they belong to existing React Router projects (`architecture-react-router.md`).

## 20. Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Redirects, security headers or `noindex` missing from Worker responses | `wrangler.jsonc` `main` still points at `@tanstack/react-start/server-entry`: set `"main": "./src/server.ts"` |
| `/contact` (or another form route) answers POST with 405 | It was prerendered: keep `autoStaticPathsDiscovery` and `crawlLinks` off and leave it out of `content/pages.ts` prerender list |
| `/about` redirects to `/about/` | Prerendered page with default `html_handling`: set `drop-trailing-slash` (and `autoSubfolderIndex: false`) |
| Typecheck: `server` does not exist on the route options, or a new route is unknown | `src/routeTree.gen.ts` is stale or was generated by the plain `tsr` CLI: run `npm run build` (or keep `npm run dev` running), then typecheck |
| Typecheck error on a `Link` `to`, `search` or `params` | The target route doesn't exist or expects other search params: create the route or pass what its `validateSearch` requires; don't cast |
| A server function returns 500 over HTTP but works during SSR | It returned a bare `null`/`undefined`: return an object |
| A direct call to a server function answers 403 "Forbidden" | Start's CSRF check: the request lacks a same-origin `Sec-Fetch-Site`/`Origin`. Expected for cross-site calls |
| The no-JavaScript form result doesn't show on the page | The loader read `context`; the handler's `next({ context })` data arrives as the loader's `serverContext` argument |
| JSON-LD breaks the page or shows as text | An unescaped `</script>` in head script children: build it with `seo()` / `jsonForScript()` |
| Sitemap or canonical contains `localhost` | Built from the request URL during prerender: use `absoluteUrl()` / `site.url` |
| Streaming seems not to work in a headless test (whole page at once) | The `HeadlessChrome` user agent counts as a crawler and gets the complete document: test with a normal user agent |
| A redirect to the same page with `?x=true` after a form | The router normalises search params (`?sent=1` becomes `?sent=true` with a 307): redirect to the normalised form |
| The scaffolder refuses the folder or the name | It needs a new, empty folder with a lowercase-hyphenated name: scaffold next to `DESIGN.md`/`design/`, then move them in (section 2) |
| `Env` type is missing a binding | Run `npm run cf-typegen` after editing `wrangler.jsonc` |
| A secret is missing from `Env` in CI only | `.dev.vars` is git-ignored, so `wrangler types` can't see it there: access secrets through a typed helper with optional fields (starter: `leadBindings`) |
| `npm run preview` ignores a changed `.dev.vars` | The preview uses the copy made at build time: rebuild |
| `composes … from '~/…'` fails: "path from fileResolve must be absolute" | Add the explicit `~` alias to `vite.config.ts` (`resolve.alias`) |
| DOM types act strangely (`HTMLSelectElement` not assignable to `Element`, `append` expects a `Response`) | The Workers runtime types redeclare the global `Element` (HTMLRewriter) in the shared tsconfig: use `HTMLElement` generics, structural types or `appendChild` |
| Local Lighthouse: low performance, "page is blocked from indexing" | `vite preview` doesn't compress and the robots route blocks non-production hosts: measure a preview deployment or a compressing static server (`npx serve dist/client`) instead |
