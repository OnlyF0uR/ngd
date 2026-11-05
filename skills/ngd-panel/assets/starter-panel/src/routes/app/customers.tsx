import { useEffect, useRef, type FormEvent, type ReactNode } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { CUSTOMER_STATUSES, type CustomerSort, type CustomerStatus } from '~/lib/customers';
import { fetchCustomers, PAGE_SIZE, parseCustomerSearch, type CustomerSearch } from '~/lib/panel.functions';
import { formatDate, formatMoney } from '~/lib/format';
import { fill, panel, panelHead } from '~/lib/panel';
import { PageHeader } from '~/components/panel/PageHeader/PageHeader';
import { EmptyState } from '~/components/panel/EmptyState/EmptyState';
import { StatusPill, type Tone } from '~/components/panel/StatusPill/StatusPill';
import { PanelError } from '~/components/panel/PanelError/PanelError';
import { Icon } from '~/components/panel/Icon';
import styles from './customers.module.css';

const TONES: Record<CustomerStatus, Tone> = { active: 'success', trial: 'info', overdue: 'warning', churned: 'neutral' };

/**
 * The table state lives in the URL (?q=&status=&sort=name&page=2): shareable, reloadable and back-button
 * friendly. validateSearch types and cleans it, so every Link below that changes it is type-checked;
 * the server function validates it again (never trust the browser).
 */
export const Route = createFileRoute('/app/customers')({
  validateSearch: parseCustomerSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => fetchCustomers({ data: deps }),
  head: () => panelHead(panel.ui.customers),
  component: Customers,
  errorComponent: ({ error }) => <PanelError error={error} />,
  notFoundComponent: () => <PanelError error={{ status: 404 }} />,
});

function Customers() {
  const { rows, total, page } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { q = '', status = '' } = search;
  const filtered = Boolean(q || status);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const searchRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLSelectElement>(null);

  // Back/forward changes the URL without remounting the form: keep the fields in step (unless someone is typing)
  useEffect(() => {
    if (searchRef.current && document.activeElement !== searchRef.current) searchRef.current.value = q;
    if (statusRef.current) statusRef.current.value = status;
  }, [q, status]);

  /** The form's fields as table state: empty fields dropped, back to page 1, the current sort kept. */
  const formSearch = (form: HTMLFormElement): CustomerSearch =>
    parseCustomerSearch({ ...Object.fromEntries(new FormData(form)), sort: search.sort });

  /**
   * Filter as you type and on select. Typing is debounced and replaces the history entry (Back shouldn't
   * replay every keystroke); a select change is a real step.
   */
  const onFilterChange = (form: HTMLFormElement, typing: boolean) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => navigate({ search: formSearch(form), replace: typing, resetScroll: false }), typing ? 300 : 0);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearTimeout(timer.current);
    navigate({ search: formSearch(event.currentTarget), resetScroll: false });
  };

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <>
      <PageHeader title={panel.ui.customers} description={panel.ui.customersIntro} />

      {/* Works without JavaScript as a plain GET form; with it, results update while typing */}
      <form
        method="get"
        role="search"
        className={styles.toolbar}
        onChange={(event) => onFilterChange(event.currentTarget, (event.target as HTMLElement).getAttribute('name') === 'q')}
        onSubmit={onSubmit}
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
        {search.sort && <input type="hidden" name="sort" value={search.sort} />}
        <button type="submit" className={styles.apply}>
          {panel.ui.apply}
        </button>
      </form>

      {total === 0 ? (
        filtered ? (
          <EmptyState
            icon="search"
            title={panel.ui.noResultsTitle}
            text={panel.ui.noResultsText}
            action={
              <Link to="/app/customers" search={{}} className={styles.clear}>
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
                  <SortHeader label={panel.ui.columns.name} column="name" search={search} />
                  <SortHeader label={panel.ui.columns.company} column="company" search={search} optional />
                  <th scope="col">{panel.ui.columns.status}</th>
                  <th scope="col" className={styles.optional}>
                    {panel.ui.columns.plan}
                  </th>
                  <SortHeader label={panel.ui.columns.mrr} column="mrr" search={search} numeric />
                  <SortHeader label={panel.ui.columns.created} column="created" search={search} optional />
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
            <PageLink search={{ ...search, page: page > 2 ? page - 1 : undefined }} disabled={page <= 1} rel="prev">
              <Icon name="chevronLeft" />
              {panel.ui.previous}
            </PageLink>
            <PageLink search={{ ...search, page: page + 1 }} disabled={to >= total} rel="next">
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
  search,
  numeric = false,
  optional = false,
}: {
  label: string;
  column: CustomerSort;
  search: CustomerSearch;
  numeric?: boolean;
  /** Hidden on narrow screens, where only the columns people scan for stay visible */
  optional?: boolean;
}) {
  const sort = search.sort ?? '-created';
  const active = sort.replace(/^-/, '') === column;
  const desc = active && sort.startsWith('-');
  const next = active && !desc ? (`-${column}` as const) : column;
  return (
    <th
      scope="col"
      aria-sort={active ? (desc ? 'descending' : 'ascending') : undefined}
      className={[numeric && styles.numeric, optional && styles.optional].filter(Boolean).join(' ') || undefined}
    >
      <Link
        to="/app/customers"
        search={parseCustomerSearch({ ...search, sort: next, page: undefined })}
        resetScroll={false}
        replace
        className={styles.sort}
      >
        {label}
        <span aria-hidden="true" className={styles.sortMark}>
          {active ? (desc ? '↓' : '↑') : ''}
        </span>
      </Link>
    </th>
  );
}

function PageLink({ search, disabled, rel, children }: { search: CustomerSearch; disabled: boolean; rel: string; children: ReactNode }) {
  if (disabled)
    return (
      <span className={styles.pageLink} aria-disabled="true">
        {children}
      </span>
    );
  return (
    <Link to="/app/customers" search={search} rel={rel} resetScroll={false} className={styles.pageLink}>
      {children}
    </Link>
  );
}
