# NGD panel starter

Panel files to add on top of the base starter (`assets/starter/`): a layout route that requires a signed-in user and sends `noindex` and `private, no-store`, an app shell, a dashboard that streams its data behind skeletons, a URL-driven table with empty and no-result states, and a sign-in placeholder.

Verified with the same versions as the base starter (React Router 8.4 on Cloudflare Workers): typecheck, build, Workers preview; `/app` streams its widgets after the skeletons; non-local hosts are redirected to `/login` (document and data requests); filters, sorting and pagination work with and without JavaScript; Back undoes a filter step; the 390px layout has no overflow; no console or hydration errors; `ngd-audit.mjs` passes on the panel code.

## Apply

1. Apply the base starter first (`assets/starter/README.md`), then copy this folder's `app/` into the project, keeping the paths.
2. Register the routes in `app/routes.ts` (add `prefix` to the import):
   ```ts
   // Panel: auth middleware, noindex and no-store live in its layout route
   layout('routes/panel/layout.tsx', [
     ...prefix('app', [
       index('routes/panel/dashboard.tsx'),
       route('customers', 'routes/panel/customers.tsx'),
     ]),
   ]),
   route('login', 'routes/auth/login.tsx'),
   ```
3. Keep crawlers out of the panel: in `app/routes/robots.ts`, add `'Disallow: /app/'` to the production rules.
4. Edit `app/lib/panel.ts`: navigation, locale, currency, time zone and the interface text (translate `ui`).
5. Run it: `npm run dev` signs in a demo user on localhost. For `npm run preview`, add `PANEL_DEMO_AUTH=true` to `.dev.vars` (the preview reads the copy made at build time, so rebuild after changing it). The demo user never applies on other hosts.

## Replace before launch

- **Authentication** in `app/lib/auth.server.ts` (`getSessionUser`): Cloudflare Access for a small internal team, or a session library with D1 or a hosted provider for customer accounts (ngd-panel: `references/panel-architecture.md`, section 2). Until then production redirects every panel request to the sign-in placeholder, so the panel never ships open by accident. Replace `routes/auth/login.tsx` with the provider's sign-in and add sign-out to the shell's user card.
- **Data** in `app/lib/demo-data.server.ts`: real queries with the same shapes, scoped by `user.tenantId`, selecting only the columns the screens show. Types and constants that components import stay in `app/lib/customers.ts`, because the build refuses client imports of `*.server.ts` modules.
- **Permissions** in `app/lib/permissions.ts`: your roles and permissions; call `requirePermission` in every loader and action.

## What's inside

| File | Purpose |
|---|---|
| `routes/panel/layout.tsx` | Middleware: session check → redirect to `/login?next=…`, typed `userContext`, `Cache-Control: private, no-store`, `X-Robots-Tag: noindex`; the shell; a layout-level error page |
| `routes/panel/dashboard.tsx` | Loader returns promises (not awaited), `<Suspense>` + `<Await>` with skeletons that match the final layout, a retryable error per widget |
| `routes/panel/customers.tsx` | Table state in the URL (`q`, `status`, `sort`, `page`), validated in the loader; a GET form that works without JavaScript and filters while typing with it (typing replaces history, a select change adds a step); sortable headers with `aria-sort`; pagination; empty and no-result states; a scrollable, labelled table region with fewer columns on phones |
| `routes/auth/login.tsx` | Sign-in placeholder: `noindex`, `no-store`, safe `next` redirect once signed in |
| `components/panel/AppShell` | Sidebar on wide screens, top bar with a popover menu on narrow ones, active link state, pending-navigation progress bar, theme toggle |
| `components/panel/PageHeader`, `Skeleton` (+ `Loading`), `EmptyState`, `StatusPill`, `PanelError` (+ `WidgetError`), `Icon` | The shared panel primitives, each with its own CSS Module |
| `lib/panel.ts`, `lib/format.ts` | Panel facts and interface text; dates, money and numbers in one locale and time zone so server and browser render the same text |
| `lib/auth-context.ts`, `lib/auth.server.ts`, `lib/permissions.ts` | Session user type and context, the auth stub, roles → permissions |
| `lib/customers.ts`, `lib/demo-data.server.ts` | Shared customer types; deterministic demo data with artificial latency so the skeletons are visible |
