# NGD panel starter

Panel files to add on top of the base starter (`assets/starter/`): a layout route at `/app` that requires a signed-in user and sends `noindex` and `private, no-store`, server functions that check the session themselves, an app shell, a dashboard that streams its data behind skeletons, a URL-driven table with typed search params and empty and no-result states, and a sign-in placeholder.

Verified with the same versions as the base starter (TanStack Start 1.169 on Cloudflare Workers): typecheck, build, Workers preview; `/app` sends the shell and skeletons at once and streams the widgets after them (browsers; crawlers get the complete document); non-local hosts are redirected to `/login?next=…`; the server functions answer 401 without a session and 403 to cross-site calls (Start's built-in CSRF check); filtering while typing replaces the history entry, a status change adds one, sorting and pagination links are type-checked; the 390px layout has no overflow; no console or hydration errors; no server code in the client bundle.

## Apply

1. Apply the base starter first (`assets/starter/README.md`), then copy this folder's `src/` into the project, keeping the paths. The routes register themselves: `src/routes/app/route.tsx` is the `/app` layout, `app/index.tsx` the dashboard, `app/customers.tsx` the table, `login.tsx` the sign-in page.
2. Keep crawlers out of the panel: in `src/routes/robots[.]txt.ts`, add `'Disallow: /app/'` to the production rules.
3. Edit `src/lib/panel.ts`: navigation, locale, currency, time zone and the interface text (translate `ui`).
4. Run it: `npm run dev` signs in a demo user on localhost. For `npm run preview`, add `PANEL_DEMO_AUTH=true` to `.dev.vars` (the preview reads the copy made at build time, so rebuild after changing it). The demo user never applies on other hosts.

## How the pieces fit

- **Loaders run in two places.** On the first request a route's `beforeLoad` and `loader` run on the server; on client navigation they run in the browser. So they never touch bindings or secrets directly: they call **server functions** (`src/lib/panel.functions.ts`), which always run on the Worker.
- **Every server function is a public endpoint**, reachable without the route that calls it. Each one uses `authMiddleware` (session or 401, `Cache-Control: private, no-store`) and checks the permission it needs. The `beforeLoad` guard in `routes/app/route.tsx` only decides what to render.
- **Don't return a bare `null` from a server function**: it works during SSR but fails over HTTP with a 500. Wrap it (`{ user: null }`).
- **Table state is typed.** `validateSearch` in `routes/app/customers.tsx` turns the URL into `CustomerSearch`; every `<Link search={…}>` is checked against it, and the server function validates the same input again.

## Replace before launch

- **Authentication** in `src/lib/auth.server.ts` (`getSessionUser`): Cloudflare Access for a small internal team, or a session library with D1 or a hosted provider for customer accounts (ngd-panel: `references/panel-architecture.md`, section 2). Until then production redirects every panel request to the sign-in placeholder, so the panel never ships open by accident. Replace `routes/login.tsx` with the provider's sign-in and add sign-out to the shell's user card.
- **Data** in `src/lib/demo-data.server.ts`: real queries with the same shapes, scoped by `user.tenantId`, selecting only the columns the screens show. Types and constants that components import stay in `src/lib/customers.ts`; `*.server.ts` modules never reach the browser.
- **Permissions** in `src/lib/permissions.ts`: your roles and permissions; call `requirePermission` in every server function.

## What's inside

| File | Purpose |
|---|---|
| `routes/app/route.tsx` | `/app` layout: `beforeLoad` guard → redirect to `/login?next=…`, the user in route context, `Cache-Control: private, no-store` and `X-Robots-Tag: noindex` headers, the shell, a layout-level error page |
| `routes/app/index.tsx` | Dashboard: the loader returns server-function promises (not awaited), `<Suspense>` + `<Await>` with skeletons that match the final layout, a `CatchBoundary` with a retry per widget |
| `routes/app/customers.tsx` | Table state in the URL (`q`, `status`, `sort`, `page`) through `validateSearch` and `loaderDeps`; a GET form that works without JavaScript and filters while typing with it (typing replaces history, a select change adds a step); sortable headers with `aria-sort`; pagination; empty and no-result states; 404 past the last page; a scrollable, labelled table region with fewer columns on phones |
| `routes/login.tsx` | Sign-in placeholder: `noindex`, `no-store`, safe `next` redirect once signed in |
| `lib/panel.functions.ts` | The data boundary: `authMiddleware`, `fetchSessionUser`, `fetchKpis`, `fetchRecentActivity`, `fetchCustomers` (with input validation) |
| `components/panel/AppShell` | Sidebar on wide screens, top bar with a popover menu on narrow ones, active link state (`aria-current`), pending-navigation progress bar, theme toggle |
| `components/panel/PageHeader`, `Skeleton` (+ `Loading`), `EmptyState`, `StatusPill`, `PanelError` (+ `WidgetError`), `Icon` | The shared panel primitives, each with its own CSS Module |
| `lib/panel.ts`, `lib/format.ts` | Panel facts and interface text; dates, money and numbers in one locale and time zone so server and browser render the same text |
| `lib/auth.server.ts`, `lib/permissions.ts` | Session user type and the auth stub; roles → permissions |
| `lib/customers.ts`, `lib/demo-data.server.ts` | Shared customer types; deterministic demo data with artificial latency so the skeletons are visible |
