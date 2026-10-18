import { useEffect, useRef } from 'react';
import { Form, Link, useSearchParams, useSubmit } from 'react-router';
import type { Route } from './+types/customers';
import { userContext } from '~/lib/auth-context';
import { requirePermission } from '~/lib/permissions';
import { CUSTOMER_SORTS, CUSTOMER_STATUSES, type CustomerSort, type CustomerStatus } from '~/lib/customers';
import { listCustomers } from '~/lib/demo-data.server';
import { formatDate, formatMoney } from '~/lib/format';
import { fill, panel, panelMeta } from '~/lib/panel';
import { PageHeader } from '~/components/panel/PageHeader/PageHeader';
import { EmptyState } from '~/components/panel/EmptyState/EmptyState';
import { StatusPill, type Tone } from '~/components/panel/StatusPill/StatusPill';
import { PanelError } from '~/components/panel/PanelError/PanelError';
import { Icon } from '~/components/panel/Icon';
import styles from './customers.module.css';

const PAGE_SIZE = 20;
const TONES: Record<CustomerStatus, Tone> = { active: 'success', trial: 'info', overdue: 'warning', churned: 'neutral' };

export const meta: Route.MetaFunction = () => panelMeta(panel.ui.customers);

/**
 * The table state lives in the URL (?q=&status=&sort=-created&page=2): shareable, reloadable and
 * back-button friendly. Fast, essential data is awaited; validate every parameter.
 */
export async function loader({ context, url }: Route.LoaderArgs) {
  const user = context.get(userContext);
  requirePermission(user, 'customers.view');
  const params = url.searchParams;
  const q = (params.get('q') ?? '').slice(0, 100);
  const status = CUSTOMER_STATUSES.find((s) => s === params.get('status')) ?? '';
  const sortParam = params.get('sort') ?? '-created';
  const sort: CustomerSort = CUSTOMER_SORTS.find((s) => s === sortParam.replace(/^-/, '')) ?? 'created';
  const desc = sortParam.startsWith('-');
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1);
  const { rows, total } = await listCustomers(user.tenantId, { q, status, sort, desc, page, pageSize: PAGE_SIZE });
  return { rows, total, page, q, status, sort: `${desc ? '-' : ''}${sort}`, filtered: Boolean(q || status) };
}

export default function Customers({ loaderData }: Route.ComponentProps) {
  const { rows, total, page, q, status, sort, filtered } = loaderData;
  const [searchParams] = useSearchParams();
  const submit = useSubmit();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const searchRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLSelectElement>(null);

  // Back/forward changes the URL without remounting the form: keep the fields in step (unless someone is typing)
  useEffect(() => {
    if (searchRef.current && document.activeElement !== searchRef.current) searchRef.current.value = q;
    if (statusRef.current) statusRef.current.value = status;
  }, [q, status]);

  /**
   * Filter as you type and on select; drops empty fields and resets to page 1. Typing is debounced and
   * replaces the history entry (Back shouldn't replay every keystroke); a select change is a real step.
   */
  const onFilterChange = (form: HTMLFormElement, typing: boolean) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => {
        const next = new URLSearchParams();
        for (const [key, value] of new FormData(form)) if (typeof value === 'string' && value) next.set(key, value);
        submit(next, { method: 'get', replace: typing, preventScrollReset: true });
      },
      typing ? 300 : 0,
    );
  };

  const withParams = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) (value === null ? next.delete(key) : next.set(key, value));
    const query = next.toString();
    return query ? `?${query}` : '.';
  };

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <>
      <PageHeader title={panel.ui.customers} description={panel.ui.customersIntro} />

      {/* Works without JavaScript as a plain GET form; with it, results update while typing */}
      <Form
        method="get"
        role="search"
        className={styles.toolbar}
        onChange={(event) => onFilterChange(event.currentTarget, (event.target as HTMLElement).getAttribute('name') === 'q')}
      >
        <label className={styles.search}>
          <span className="visually-hidden">{panel.ui.search}</span>
          <Icon name="search" className={styles.searchIcon} />
          <input ref={searchRef} type="search" name="q" defaultValue={q} placeholder={panel.ui.searchPlaceholder} autoComplete="off" />
        </label>
        <label className={styles.select}>
          <span className="visually-hidden">{panel.ui.status}</span>
          <select ref={statusRef} name="status" defaultValue={status}>
            <option value="">{panel.ui.allStatuses}</option>
            {CUSTOMER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {panel.ui.statuses[s]}
              </option>
            ))}
          </select>
        </label>
        {sort !== '-created' && <input type="hidden" name="sort" value={sort} />}
        <button type="submit" className={styles.apply}>
          {panel.ui.apply}
        </button>
      </Form>

      {total === 0 ? (
        filtered ? (
          <EmptyState
            icon="search"
            title={panel.ui.noResultsTitle}
            text={panel.ui.noResultsText}
            action={
              <Link to="." className={styles.clear}>
                {panel.ui.clearFilters}
              </Link>
            }
          />
        ) : (
          <EmptyState title={panel.ui.noCustomersTitle} text={panel.ui.noCustomersText} />
        )
      ) : (
        <>
          {/* Wide tables scroll inside a labelled, focusable region instead of stretching the page */}
          <div className={styles.tableWrap} role="region" aria-label={panel.ui.customersTable} tabIndex={0}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <SortHeader label={panel.ui.columns.name} column="name" sort={sort} href={withParams} />
                  <SortHeader label={panel.ui.columns.company} column="company" sort={sort} href={withParams} optional />
                  <th scope="col">{panel.ui.columns.status}</th>
                  <th scope="col" className={styles.optional}>
                    {panel.ui.columns.plan}
                  </th>
                  <SortHeader label={panel.ui.columns.mrr} column="mrr" sort={sort} href={withParams} numeric />
                  <SortHeader label={panel.ui.columns.created} column="created" sort={sort} href={withParams} optional />
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className={styles.name}>{c.name}</span>
                      <span className={styles.email}>{c.email}</span>
                    </td>
                    <td className={styles.optional}>{c.company}</td>
                    <td>
                      <StatusPill tone={TONES[c.status]}>{panel.ui.statuses[c.status]}</StatusPill>
                    </td>
                    <td className={styles.optional}>{c.plan}</td>
                    <td className={styles.numeric}>{formatMoney(c.mrr)}</td>
                    <td className={styles.optional}>
                      <time dateTime={c.createdAt}>{formatDate(c.createdAt)}</time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav className={styles.pagination} aria-label={panel.ui.pagination}>
            <span className={styles.count}>{fill(panel.ui.showing, { from, to, total })}</span>
            <PageLink to={withParams({ page: page > 2 ? String(page - 1) : null })} disabled={page <= 1} rel="prev">
              <Icon name="chevronLeft" />
              {panel.ui.previous}
            </PageLink>
            <PageLink to={withParams({ page: String(page + 1) })} disabled={to >= total} rel="next">
              {panel.ui.next}
              <Icon name="chevronRight" />
            </PageLink>
          </nav>
        </>
      )}
    </>
  );
}

function SortHeader({
  label,
  column,
  sort,
  href,
  numeric = false,
  optional = false,
}: {
  label: string;
  column: CustomerSort;
  sort: string;
  href: (changes: Record<string, string | null>) => string;
  numeric?: boolean;
  /** Hidden on narrow screens, where only the columns people scan for stay visible */
  optional?: boolean;
}) {
  const active = sort.replace(/^-/, '') === column;
  const desc = active && sort.startsWith('-');
  const next = active && !desc ? `-${column}` : column;
  return (
    <th
      scope="col"
      aria-sort={active ? (desc ? 'descending' : 'ascending') : undefined}
      className={[numeric && styles.numeric, optional && styles.optional].filter(Boolean).join(' ') || undefined}
    >
      <Link to={href({ sort: next, page: null })} preventScrollReset replace className={styles.sort}>
        {label}
        <span aria-hidden="true" className={styles.sortMark}>
          {active ? (desc ? '↓' : '↑') : ''}
        </span>
      </Link>
    </th>
  );
}

function PageLink({ to, disabled, rel, children }: { to: string; disabled: boolean; rel: string; children: React.ReactNode }) {
  if (disabled) return <span className={styles.pageLink} aria-disabled="true">{children}</span>;
  return (
    <Link to={to} rel={rel} preventScrollReset className={styles.pageLink}>
      {children}
    </Link>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <PanelError error={error} />;
}
