/**
 * Demo data with artificial latency, so skeletons and streaming are visible during development.
 * Replace these functions with real queries (D1 prepared statements, an API client) that keep the
 * same shapes, scope every query by tenant, and select only the columns the screens show.
 */
import type { Customer, CustomerQuery, CustomerStatus } from './customers';

const FIRST = ['Anna', 'Bram', 'Chloe', 'Daan', 'Eva', 'Finn', 'Gwen', 'Hugo', 'Iris', 'Jens', 'Kim', 'Lars', 'Mila', 'Noah'];
const LAST = ['de Vries', 'Jansen', 'Bakker', 'Visser', 'Smit', 'Meijer', 'Mulder', 'Bos'];
const COMPANIES = ['Northwind', 'Harbour & Co', 'Kestrel Labs', 'Oak Studio', 'Pine Logistics', 'Quarry Works', 'Lumen Dental'];
const PLANS = [
  { name: 'Starter', mrr: 2900 },
  { name: 'Team', mrr: 7900 },
  { name: 'Business', mrr: 19900 },
];
const STATUS_CYCLE: CustomerStatus[] = ['active', 'active', 'trial', 'active', 'overdue', 'active', 'churned'];
const DAY = 86_400_000;

// Deterministic, so server and client agree and screenshots are stable.
const CUSTOMERS: Customer[] = Array.from({ length: 42 }, (_, i) => {
  const first = FIRST[i % FIRST.length];
  const company = COMPANIES[(i * 5) % COMPANIES.length];
  const plan = PLANS[(i * 7) % PLANS.length];
  const status = STATUS_CYCLE[(i * 3) % STATUS_CYCLE.length];
  return {
    id: `c${String(i + 1).padStart(3, '0')}`,
    name: `${first} ${LAST[(i * 3) % LAST.length]}`,
    company,
    email: `${first.toLowerCase()}@${company.toLowerCase().replace(/[^a-z]+/g, '')}.example`,
    status,
    plan: plan.name,
    mrr: status === 'churned' ? 0 : plan.mrr,
    createdAt: new Date(Date.UTC(2026, 0, 5) + i * 6 * DAY).toISOString(),
  };
});

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function listCustomers(_tenantId: string, query: CustomerQuery) {
  await delay(120);
  const needle = query.q.trim().toLowerCase();
  const filtered = CUSTOMERS.filter(
    (c) =>
      (!query.status || c.status === query.status) &&
      (!needle || `${c.name} ${c.company} ${c.email}`.toLowerCase().includes(needle)),
  );
  const key = { name: 'name', company: 'company', mrr: 'mrr', created: 'createdAt' }[query.sort] as keyof Customer;
  filtered.sort((a, b) => {
    const order = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
    return query.desc ? -order : order;
  });
  const start = (query.page - 1) * query.pageSize;
  return { rows: filtered.slice(start, start + query.pageSize), total: filtered.length };
}

export async function getKpis(_tenantId: string) {
  await delay(700);
  const live = CUSTOMERS.filter((c) => c.status !== 'churned');
  return {
    mrr: live.reduce((sum, c) => sum + c.mrr, 0),
    active: CUSTOMERS.filter((c) => c.status === 'active').length,
    trials: CUSTOMERS.filter((c) => c.status === 'trial').length,
    overdue: CUSTOMERS.filter((c) => c.status === 'overdue').length,
  };
}

export async function getRecentActivity(_tenantId: string) {
  await delay(1200);
  const events = ['signed up', 'upgraded to Business', 'paid an invoice', 'missed a payment', 'invited two colleagues', 'started a trial'];
  return CUSTOMERS.slice(-6)
    .reverse()
    .map((c, i) => ({ id: `${c.id}-${i}`, who: c.name, company: c.company, what: events[i % events.length], at: c.createdAt }));
}
