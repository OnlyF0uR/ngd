# Panel architecture

How NGD admin and user panels are built on TanStack Start + Cloudflare Workers (the verified implementation of sections 1, 2, 5, 6 and 11 is in `assets/starter-panel/`): where the panel lives, authentication and authorization, data access, loading data without ever blocking the shell, mutations, real-time updates, security and caching. Panels are not indexed, so SEO gives way to speed of use: the shell appears instantly, data streams in behind skeletons, and every action gives immediate feedback.

## Contents
1. Where the panel lives
2. Authentication
3. Authorization and multi-tenancy
4. Data access
5. Loading data: shell first, skeletons, streaming
6. Tables, filters and URLs
7. Mutations and optimistic UI
8. Real-time and background work
9. Errors and resilience
10. Security checklist
11. Not indexed, not cached
12. Testing

## 1. Where the panel lives

- **Same project, own route prefix** (`/app`, `/admin`, `/account`): the default when it shares the brand and design system with a public site or store. A layout route for the prefix carries the session guard, the app shell and `noindex` headers; server functions carry the real checks (section 2).
- **Separate Worker on a subdomain** (`app.example.com`): when the panel has a different security boundary, team or release cadence. Share the design system through a package or copied tokens and primitives.
- Panels are never prerendered. Keep server rendering for the shell (fast first paint, server-side auth); the data inside streams or loads on the client.

Routes are files (architecture.md section 4); the folder's `route.tsx` is the panel layout:

```
src/routes/
  app/
    route.tsx            /app layout: session guard, noindex + no-store headers, the shell
    index.tsx            /app (dashboard)
    customers.tsx        /app/customers
    customers.$id.tsx    /app/customers/:id
    settings/            /app/settings/…
  login.tsx              /login
```

## 2. Authentication

Pick with the user, based on who logs in:

| Situation | Recommendation |
|---|---|
| Internal admin panel for a small team | **Cloudflare Access** (Zero Trust) in front of `/admin/*`: login with Google, Microsoft, GitHub or one-time codes, no auth code in the app. Still verify the `Cf-Access-Jwt-Assertion` header in the server-function auth middleware (defense in depth). |
| Customer/user portal (accounts on the public site or shop) | Session auth with an HttpOnly cookie, through a maintained library that runs on Workers with D1 (for example Better Auth) or a hosted identity provider (Clerk, WorkOS, Auth0, Supabase Auth…). Passwordless email links or codes are often the best UX for occasional users. |
| B2B SaaS with company accounts | A provider with organisations, SSO (SAML/OIDC) and SCIM when customers need it. |
| Store accounts on a commerce platform | The platform's customer accounts API. |

Rules regardless of the choice:
- Never write your own password hashing or token crypto; use the library's.
- Session cookies: `HttpOnly; Secure; SameSite=Lax; Path=/`, sensible expiry, rotation on privilege change, server-side revocation.
- Rate-limit login and code verification (Rate Limiting binding), and offer MFA for admins.
- **Two layers, both needed** (the panel starter has both). Route loaders run in the browser on client navigation, and every server function is a public HTTP endpoint, so:
  1. **Server functions check the session themselves**, through a function middleware that puts the user in their context. This is the real protection.
  2. **The layout route's `beforeLoad` guard** asks a server function who is signed in and redirects to the sign-in page if nobody is. It decides what to render; it protects nothing on its own.

```ts
// src/lib/panel.functions.ts
const authMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  setResponseHeader('Cache-Control', 'private, no-store');
  const user = await getSessionUser(getRequest());               // your auth library (src/lib/auth.server.ts)
  if (!user) {
    setResponseStatus(401);
    throw new Error('Unauthorized');
  }
  return next({ context: { user } });
});

export const fetchSessionUser = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getSessionUser(getRequest());
  return { user: user ? { name: user.name, role: user.role } : null }; // an object: a bare null fails over HTTP
});

export const fetchInvoices = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(parseInvoiceSearch)
  .handler(({ data, context }) => {
    requirePermission(context.user, 'invoices.view');
    return listInvoices(context.user.tenantId, data);
  });

// src/routes/app/route.tsx
export const Route = createFileRoute('/app')({
  beforeLoad: async ({ location }) => {
    const { user } = await fetchSessionUser();
    if (!user) throw redirect({ to: '/login', search: { next: location.href } });
    return { user };                                              // Route.useRouteContext() in the shell
  },
  headers: () => ({ 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' }),
  component: PanelLayout,
});
```

Validate the `next` parameter before redirecting to it (relative paths only) to avoid open redirects.

## 3. Authorization and multi-tenancy

- Model **roles → permissions** (`can(user, 'invoices.delete')`), defined in one module.
- Check permissions **on the server in every server function and server route handler**. Hiding a button is UX, not security.
- Multi-tenant data: every query is scoped by the tenant ID from the session (`WHERE tenant_id = ?`), never by an ID taken from the URL alone. Return 404 (not 403) for records outside the tenant, so IDs don't leak.
- Keep an **audit log** (who, what, when, before/after) for admin actions on important records; show it in the UI where it helps.

## 4. Data access

- **D1** (SQLite) for app data with migrations (`wrangler d1 migrations create/apply`). A typed query layer helps: a light query builder or ORM that supports D1 (for example Drizzle or Kysely), or hand-written prepared statements in `*.server.ts` modules.
- **External APIs** (an existing backend, a commerce platform, a CRM): call them from server-only modules with service credentials from Worker secrets; never expose tokens to the browser.
- Keep types and constants that components need (status lists, sort keys, record types) in a shared module next to the server-only one (`customers.ts` beside `customers.server.ts`). Components and loaders reach data only through server functions (`*.functions.ts`); `*.server.ts` modules never reach the browser.
- Index the columns you filter and sort by; paginate everything; select only the columns the screen shows.
- **R2** for files (uploads, exports) with size and type checks, served through signed or authorised routes.
- **KV** for configuration and cached reference data; **Queues** for slow or retried work (emails, exports, webhooks).

## 5. Loading data: shell first, skeletons, streaming

The rule: **the shell (navigation, page header, layout) renders immediately; data never blocks it.**

1. **Layout guard** (`beforeLoad`): only what the shell needs (user, tenant, navigation counts). It's fast (session lookup).
2. **Page loaders return server-function promises for anything slow**, without awaiting them. TanStack Start streams them in:

```tsx
// src/routes/app/index.tsx
export const Route = createFileRoute('/app/')({
  loader: () => ({ kpis: fetchKpis(), activity: fetchRecentActivity() }), // not awaited: streams in
  component: Dashboard,
});

function Dashboard() {
  const { kpis, activity } = Route.useLoaderData();
  return (
    <>
      <PageHeader title="Overview" actions={<NewInvoiceButton />} />
      <Widget name="kpis">
        <Suspense fallback={<KpiSkeleton />}>
          <Await promise={kpis}>{(data) => <KpiCards kpis={data} />}</Await>
        </Suspense>
      </Widget>
      <Widget name="activity">
        <Suspense fallback={<ActivitySkeleton rows={6} />}>
          <Await promise={activity}>{(items) => <ActivityList items={items} />}</Await>
        </Suspense>
      </Widget>
    </>
  );
}

/** One failing widget shows its own error with a retry; the rest of the screen keeps working. */
function Widget({ name, children }: { name: string; children: ReactNode }) {
  return (
    <CatchBoundary getResetKey={() => name} errorComponent={({ reset }) => <WidgetError reset={reset} />}>
      {children}
    </CatchBoundary>
  );
}
```

3. **Skeletons mirror the final layout** (same heights, columns and spacing) so nothing jumps when data arrives. Build them from one `Skeleton` primitive (shimmer in motion.md, still under reduced motion).
4. **Client-side navigations** keep the previous screen visible with a slim progress indicator (`useRouterState({ select: (s) => s.status === 'pending' })`) instead of blanking the page. Streamed sections show their skeletons.
5. **Browser-only data or client caching:** `ssr: false` (or `'data-only'`) on a route whose data only exists in the browser; the router's own cache (`staleTime`) or TanStack Query for data you want to keep across navigations (reference lists, user preferences).
6. **Lazy-load heavy components** (charts, rich-text editors, maps, PDF viewers) with `React.lazy` + `Suspense`, so they don't weigh down the first load.
7. **Preload** likely next screens: links preload code and data on hover and focus (`defaultPreload: 'intent'` in `src/router.tsx`).
8. **Avoid needless reloads:** give expensive routes a `staleTime`, and key loaders on exactly what they depend on (`loaderDeps`), so a change elsewhere doesn't refetch the whole dashboard.

## 6. Tables, filters and URLs

- Keep table state in the URL (`?q=&status=open&sort=name&page=2`) so views are shareable, reloadable and back-button friendly. `validateSearch` turns it into a typed object (drop invalid values and defaults), `loaderDeps: ({ search }) => search` passes it to the loader, and the server function validates it again. Update it with a plain `<form method="get">` (works without JavaScript) enhanced with `navigate({ search })`, and with `<Link search={…}>` for sorting and pagination: both are type-checked against the route's search schema.
- Server-side pagination, sorting and filtering for anything beyond a few hundred rows; return the total count for "1–25 of 1,240".
- Debounce search input (about 300ms) and use `replace` navigation for keystroke updates so history stays clean.
- Saved views (named filter sets) for power users, stored per user.
- Very long client-side lists: virtualise rows (a virtualization library such as TanStack Virtual).

## 7. Mutations and optimistic UI

- **Mutations are server functions** (`createServerFn({ method: 'POST' })` with the auth middleware, a `.validator` and a permission check). Call them through `useServerFn(fn)` (it handles a thrown `redirect`), then `router.invalidate()` so the screen's loaders reload.
- **Inline actions** (toggle, rename, assign, archive): render the optimistic state right away (React's `useOptimistic`, or local state); if the call fails, the UI reverts and a toast explains why.
- **Full forms** (create/edit record): validate on the server and return field errors as data (`{ ok: false, errors }` with `setResponseStatus(400)`) instead of throwing, so the form shows field-level messages; navigate (or toast) on success. A form that must also work without JavaScript posts to a route's server handler instead (architecture.md section 9).
- One server function per intent (`archiveInvoice`, `assignInvoice`) beats one function with an `intent` switch: each gets its own permission check and input schema.
- Guard unsaved changes with `useBlocker({ shouldBlockFn: () => dirty, enableBeforeUnload: true })`, which covers in-app navigation and tab closes.
- Undo beats confirmation for reversible actions (archive, remove from list): act immediately, offer "Undo" in the toast. Confirm only destructive, irreversible actions, and name what will be destroyed.
- Bulk actions run on the server in one request (or a Queue job for large sets) and report progress.

## 8. Real-time and background work

- Most panels need no websockets: reload on window focus and on an interval for live-ish data (`router.invalidate()` every 30–60 s on screens that need it, or TanStack Query's `refetchInterval`).
- Server-Sent Events from a server route (a `GET` handler returning a `text/event-stream` response) for one-way live feeds (job progress, notifications).
- Durable Objects with WebSockets for collaborative or truly real-time features (presence, live editing, chat).
- Long tasks (exports, imports, bulk updates) run in Queues or Workflows; the UI shows a job with status and notifies when done.

## 9. Errors and resilience

- An `errorComponent` on the panel layout and on each major route, plus a `CatchBoundary` around every streamed widget, so one failing widget doesn't take down the page. `notFoundComponent` (or `throw notFound()`) for records that don't exist or belong to another tenant.
- Errors say what happened and what to do (retry button, contact support), never a raw stack trace in production.
- Log server errors with context (route, user ID, tenant) to Workers observability; never log secrets or personal data unnecessarily.

## 10. Security checklist

- [ ] Every server function and server route handler checks authentication and permission; tenant scoping on every query. A direct call without a session gets 401, not data.
- [ ] Inputs validated and size-limited on the server (a `.validator` schema per server function); outputs escaped (React does this by default; never inject unsanitised HTML).
- [ ] Sessions: HttpOnly, Secure, SameSite=Lax cookies, expiry, revocation; MFA for admins.
- [ ] CSRF: same-site cookies; Start's built-in check rejects cross-site server-function calls (`Sec-Fetch-Site`/`Origin`). Server route handlers that change data (`POST` handlers) need their own origin check.
- [ ] Login and sensitive actions are rate-limited; brute-force protection on codes.
- [ ] File uploads: type and size checks, stored in R2 under random keys, served through authorised routes.
- [ ] Secrets only in Worker secrets; least-privilege API tokens.
- [ ] Audit log for admin actions; data export and deletion for user accounts (GDPR).
- [ ] Security headers on panel responses; a strict Content-Security-Policy if third-party scripts are absent.

## 11. Not indexed, not cached

- `X-Robots-Tag: noindex, nofollow` on every panel document (the layout route's `headers`) plus `robots.txt` disallowing the panel prefix. Login pages may be indexable if people search for them; usually they shouldn't be.
- `Cache-Control: private, no-store` on everything behind login: the layout route's `headers` covers the documents, the auth middleware covers the server-function responses.
- No analytics on sensitive screens, or only privacy-friendly, aggregate tracking.

## 12. Testing

- Playwright smoke tests for the critical paths: login, list → detail → edit → save, a permission-denied case, logout.
- Seed data for local development (`wrangler d1 execute --local --file seed.sql`), including empty and very large tenants to check empty states and pagination.
