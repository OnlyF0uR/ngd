# Panel architecture

How NGD admin and user panels are built on React Router + Cloudflare Workers (the verified implementation of sections 1, 2, 5, 6 and 11 is in `assets/starter-panel/`): where the panel lives, authentication and authorization, data access, loading data without ever blocking the shell, mutations, real-time updates, security and caching. Panels are not indexed, so SEO gives way to speed of use: the shell appears instantly, data streams in behind skeletons, and every action gives immediate feedback.

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

- **Same project, own route prefix** (`/app`, `/admin`, `/account`): the default when it shares the brand and design system with a public site or store. A layout route for the prefix carries the auth middleware, the app shell and `noindex` headers.
- **Separate Worker on a subdomain** (`app.example.com`): when the panel has a different security boundary, team or release cadence. Share the design system through a package or copied tokens and primitives.
- Panels are never prerendered. Keep server rendering for the shell (fast first paint, server-side auth); the data inside streams or loads on the client.

```ts
// app/routes.ts (excerpt)
layout('routes/panel/layout.tsx', [
  ...prefix('app', [
    index('routes/panel/dashboard.tsx'),
    route('customers', 'routes/panel/customers.tsx'),
    route('customers/:id', 'routes/panel/customer.tsx'),
    route('settings/*', 'routes/panel/settings.tsx'),
  ]),
]),
route('login', 'routes/auth/login.tsx'),
```

## 2. Authentication

Pick with the user, based on who logs in:

| Situation | Recommendation |
|---|---|
| Internal admin panel for a small team | **Cloudflare Access** (Zero Trust) in front of `/admin/*`: login with Google, Microsoft, GitHub or one-time codes, no auth code in the app. Still verify the `Cf-Access-Jwt-Assertion` header in middleware (defense in depth). |
| Customer/user portal (accounts on the public site or shop) | Session auth with an HttpOnly cookie, through a maintained library that runs on Workers with D1 (for example Better Auth) or a hosted identity provider (Clerk, WorkOS, Auth0, Supabase Auth…). Passwordless email links or codes are often the best UX for occasional users. |
| B2B SaaS with company accounts | A provider with organisations, SSO (SAML/OIDC) and SCIM when customers need it. |
| Store accounts on a commerce platform | The platform's customer accounts API. |

Rules regardless of the choice:
- Never write your own password hashing or token crypto; use the library's.
- Session cookies: `HttpOnly; Secure; SameSite=Lax; Path=/`, sensible expiry, rotation on privilege change, server-side revocation.
- Rate-limit login and code verification (Rate Limiting binding), and offer MFA for admins.
- Load the session in **middleware** on the panel layout route and put the user in a typed context, so every loader and action below it can rely on it:

```ts
// app/lib/auth-context.ts
import { createContext } from 'react-router';
export type SessionUser = { id: string; name: string; role: 'owner' | 'admin' | 'member' | 'viewer'; tenantId: string };
export const userContext = createContext<SessionUser>();

// app/routes/panel/layout.tsx
export const middleware: Route.MiddlewareFunction[] = [
  async ({ request, context, url }, next) => {
    const { env } = context.get(cloudflareContext);
    const user = await getSessionUser(request, env);           // your auth library
    if (!user) throw redirect(`/login?next=${encodeURIComponent(url.pathname + url.search)}`);
    context.set(userContext, user);
    const response = await next();
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  },
];
```

Validate the `next` parameter before redirecting to it (relative paths only) to avoid open redirects.

## 3. Authorization and multi-tenancy

- Model **roles → permissions** (`can(user, 'invoices.delete')`), defined in one module.
- Check permissions **on the server in every loader and action**. Hiding a button is UX, not security.
- Multi-tenant data: every query is scoped by the tenant ID from the session (`WHERE tenant_id = ?`), never by an ID taken from the URL alone. Return 404 (not 403) for records outside the tenant, so IDs don't leak.
- Keep an **audit log** (who, what, when, before/after) for admin actions on important records; show it in the UI where it helps.

## 4. Data access

- **D1** (SQLite) for app data with migrations (`wrangler d1 migrations create/apply`). A typed query layer helps: a light query builder or ORM that supports D1 (for example Drizzle or Kysely), or hand-written prepared statements in `*.server.ts` modules.
- **External APIs** (an existing backend, a commerce platform, a CRM): call them from server-only modules with service credentials from Worker secrets; never expose tokens to the browser.
- Keep types and constants that components need (status lists, sort keys, record types) in a shared module next to the server-only one (`customers.ts` beside `customers.server.ts`): the build refuses any client import of a `*.server.ts` module.
- Index the columns you filter and sort by; paginate everything; select only the columns the screen shows.
- **R2** for files (uploads, exports) with size and type checks, served through signed or authorised routes.
- **KV** for configuration and cached reference data; **Queues** for slow or retried work (emails, exports, webhooks).

## 5. Loading data: shell first, skeletons, streaming

The rule: **the shell (navigation, page header, layout) renders immediately; data never blocks it.**

1. **Layout loader**: only what the shell needs (user, tenant, navigation counts). It's fast (session lookup).
2. **Page loaders return promises for anything slow**, without awaiting them. React Router streams them in:

```tsx
// app/routes/panel/dashboard.tsx
export function loader({ context }: Route.LoaderArgs) {
  const user = context.get(userContext);
  const { env } = context.get(cloudflareContext);
  return {
    kpis: getKpis(env, user.tenantId),          // not awaited: streams in
    activity: getRecentActivity(env, user.tenantId),
  };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <PageHeader title="Overview" actions={<NewInvoiceButton />} />
      <Suspense fallback={<KpiSkeleton />}>
        <Await resolve={loaderData.kpis} errorElement={<WidgetError />}>
          {(kpis) => <KpiCards kpis={kpis} />}
        </Await>
      </Suspense>
      <Suspense fallback={<ActivitySkeleton rows={6} />}>
        <Await resolve={loaderData.activity} errorElement={<WidgetError />}>
          {(items) => <ActivityList items={items} />}
        </Await>
      </Suspense>
    </>
  );
}
```

3. **Skeletons mirror the final layout** (same heights, columns and spacing) so nothing jumps when data arrives. Build them from one `Skeleton` primitive (shimmer in motion.md, still under reduced motion).
4. **Client-side navigations** keep the previous screen visible with a slim progress indicator (`useNavigation().state !== 'idle'`) instead of blanking the page. Streamed sections show their skeletons.
5. **`clientLoader`** (with `HydrateFallback`) for data that only exists in the browser or that you want to cache across navigations (reference lists, user preferences).
6. **Lazy-load heavy components** (charts, rich-text editors, maps, PDF viewers) with `React.lazy` + `Suspense`, so they don't weigh down the first load.
7. **Prefetch** likely next screens with `<Link prefetch="intent">`.
8. **Avoid needless reloads:** `shouldRevalidate` on expensive routes, so a toggle elsewhere doesn't refetch the whole dashboard.

## 6. Tables, filters and URLs

- Keep table state in the URL (`?q=&status=open&sort=-created&page=2`) so views are shareable, reloadable and back-button friendly. Read it in the loader from `url.searchParams`; update it with `<Form method="get">` (works without JavaScript) or `useSearchParams`.
- Server-side pagination, sorting and filtering for anything beyond a few hundred rows; return the total count for "1–25 of 1,240".
- Debounce search input (about 300ms) and use `replace` navigation for keystroke updates so history stays clean.
- Saved views (named filter sets) for power users, stored per user.
- Very long client-side lists: virtualise rows (a virtualization library such as TanStack Virtual).

## 7. Mutations and optimistic UI

- **Inline actions** (toggle, rename, assign, archive): `useFetcher` posting to the route's action. Render the optimistic state from `fetcher.formData` right away; if the action fails, the UI reverts and a toast explains why.
- **Full forms** (create/edit record): `<Form method="post">` with server-side validation returning `data({ errors }, { status: 400 })`, field-level messages, and a redirect (or toast) on success.
- Discriminate multiple actions in one route with an `intent` field (`<button name="intent" value="archive">`).
- Guard unsaved changes with `useBlocker` (and `beforeunload` for tab closes).
- Undo beats confirmation for reversible actions (archive, remove from list): act immediately, offer "Undo" in the toast. Confirm only destructive, irreversible actions, and name what will be destroyed.
- Bulk actions run on the server in one request (or a Queue job for large sets) and report progress.

## 8. Real-time and background work

- Most panels need no websockets: revalidate on window focus and on an interval for live-ish data (`useRevalidator().revalidate()`, every 30–60 s on screens that need it).
- Server-Sent Events from a resource route for one-way live feeds (job progress, notifications).
- Durable Objects with WebSockets for collaborative or truly real-time features (presence, live editing, chat).
- Long tasks (exports, imports, bulk updates) run in Queues or Workflows; the UI shows a job with status and notifies when done.

## 9. Errors and resilience

- An `ErrorBoundary` on the panel layout and on each major route, plus `errorElement` on every `<Await>`, so one failing widget doesn't take down the page.
- Errors say what happened and what to do (retry button, contact support), never a raw stack trace in production.
- Log server errors with context (route, user ID, tenant) to Workers observability; never log secrets or personal data unnecessarily.

## 10. Security checklist

- [ ] Every loader and action checks authentication and permission server-side; tenant scoping on every query.
- [ ] Inputs validated and size-limited on the server (a schema per action); outputs escaped (React does this by default; never inject unsanitised HTML).
- [ ] Sessions: HttpOnly, Secure, SameSite=Lax cookies, expiry, revocation; MFA for admins.
- [ ] CSRF: same-site cookies plus an origin check on actions (React Router's `allowedActionOrigins` config covers cross-origin form posts).
- [ ] Login and sensitive actions are rate-limited; brute-force protection on codes.
- [ ] File uploads: type and size checks, stored in R2 under random keys, served through authorised routes.
- [ ] Secrets only in Worker secrets; least-privilege API tokens.
- [ ] Audit log for admin actions; data export and deletion for user accounts (GDPR).
- [ ] Security headers on panel responses; a strict Content-Security-Policy if third-party scripts are absent.

## 11. Not indexed, not cached

- `X-Robots-Tag: noindex, nofollow` on every panel response (middleware) plus `robots.txt` disallowing the panel prefix. Login pages may be indexable if people search for them; usually they shouldn't be.
- `Cache-Control: private, no-store` on everything behind login, including `.data` requests (middleware covers both).
- No analytics on sensitive screens, or only privacy-friendly, aggregate tracking.

## 12. Testing

- Playwright smoke tests for the critical paths: login, list → detail → edit → save, a permission-denied case, logout.
- Seed data for local development (`wrangler d1 execute --local --file seed.sql`), including empty and very large tenants to check empty states and pagination.
