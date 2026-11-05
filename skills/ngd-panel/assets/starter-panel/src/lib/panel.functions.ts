import { notFound } from '@tanstack/react-router';
import { createMiddleware, createServerFn } from '@tanstack/react-start';
import { getRequest, setResponseHeader, setResponseStatus } from '@tanstack/react-start/server';
import { getSessionUser } from './auth.server';
import { requirePermission } from './permissions';
import { CUSTOMER_SORTS, CUSTOMER_STATUSES, type CustomerSort } from './customers';
import { getKpis, getRecentActivity, listCustomers } from './demo-data.server';

/*
 * Server functions are the panel's data boundary. Each one is a public HTTP endpoint, reachable
 * without the route that calls it, so each one checks the session itself (authMiddleware) and the
 * permission it needs. The route guard in routes/app/route.tsx only decides what to render.
 */

/** Signed-in user or 401; never cached by a shared cache. */
const authMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  setResponseHeader('Cache-Control', 'private, no-store');
  const user = await getSessionUser(getRequest());
  if (!user) {
    setResponseStatus(401);
    throw new Error('Unauthorized');
  }
  return next({ context: { user } });
});

/**
 * For route guards: who is signed in. Only what the shell shows. Wrapped in an object on purpose:
 * a server function that returns a bare `null` fails over HTTP (500), though it works during SSR.
 */
export const fetchSessionUser = createServerFn({ method: 'GET' }).handler(async () => {
  setResponseHeader('Cache-Control', 'private, no-store');
  const user = await getSessionUser(getRequest());
  return { user: user ? { name: user.name, email: user.email, role: user.role } : null };
});

export const fetchKpis = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(({ context }) => getKpis(context.user.tenantId));

export const fetchRecentActivity = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(({ context }) => getRecentActivity(context.user.tenantId));

export const PAGE_SIZE = 20;

/** The customers table's URL state, validated: used by the route (validateSearch) and again on the server. */
export type CustomerSearch = {
  q?: string;
  status?: (typeof CUSTOMER_STATUSES)[number];
  sort?: `${'' | '-'}${CustomerSort}`;
  page?: number;
};

export function parseCustomerSearch(raw: Record<string, unknown>): CustomerSearch {
  const q = typeof raw.q === 'string' ? raw.q.trim().slice(0, 100) : '';
  const status = CUSTOMER_STATUSES.find((s) => s === raw.status);
  const sortRaw = typeof raw.sort === 'string' ? raw.sort : '';
  const sortKey = CUSTOMER_SORTS.find((s) => s === sortRaw.replace(/^-/, ''));
  const sort = sortKey && sortRaw !== '-created' ? (`${sortRaw.startsWith('-') ? '-' : ''}${sortKey}` as const) : undefined;
  const page = Number(raw.page);
  return {
    ...(q && { q }),
    ...(status && { status }),
    ...(sort && { sort }),
    ...(Number.isInteger(page) && page > 1 && { page }),
  };
}

export const fetchCustomers = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator((input: Record<string, unknown>) => parseCustomerSearch(input))
  .handler(async ({ data, context }) => {
    requirePermission(context.user, 'customers.view');
    const sort = data.sort ?? '-created';
    const page = data.page ?? 1;
    const { rows, total } = await listCustomers(context.user.tenantId, {
      q: data.q ?? '',
      status: data.status ?? '',
      sort: sort.replace(/^-/, '') as CustomerSort,
      desc: sort.startsWith('-'),
      page,
      pageSize: PAGE_SIZE,
    });
    // Past the last page (an old link): answer 404 instead of an empty table
    if (page > 1 && rows.length === 0) throw notFound();
    return { rows, total, page };
  });
