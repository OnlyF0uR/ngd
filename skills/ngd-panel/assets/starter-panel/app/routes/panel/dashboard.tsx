import { Suspense } from 'react';
import { Await, Link } from 'react-router';
import type { Route } from './+types/dashboard';
import { userContext } from '~/lib/auth-context';
import { getKpis, getRecentActivity } from '~/lib/demo-data.server';
import { formatDateTime, formatMoney, formatNumber } from '~/lib/format';
import { panel, panelMeta } from '~/lib/panel';
import { PageHeader } from '~/components/panel/PageHeader/PageHeader';
import { Loading, Skeleton } from '~/components/panel/Skeleton/Skeleton';
import { PanelError, WidgetError } from '~/components/panel/PanelError/PanelError';
import styles from './dashboard.module.css';

export const meta: Route.MetaFunction = () => panelMeta(panel.ui.overview);

/** Slow data is returned as promises, not awaited: the shell and header render at once, the rest streams in. */
export function loader({ context }: Route.LoaderArgs) {
  const user = context.get(userContext);
  return {
    kpis: getKpis(user.tenantId),
    activity: getRecentActivity(user.tenantId),
  };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <PageHeader title={panel.ui.overview} description={panel.ui.overviewIntro} />

      <section aria-labelledby="kpi-title" className={styles.section}>
        <h2 id="kpi-title" className="visually-hidden">
          {panel.ui.keyFigures}
        </h2>
        <Suspense fallback={<KpiSkeleton />}>
          <Await resolve={loaderData.kpis} errorElement={<WidgetError />}>
            {(kpis) => (
              <ul role="list" className={styles.kpis}>
                <Kpi label={panel.ui.kpis.mrr} value={formatMoney(kpis.mrr)} />
                <Kpi label={panel.ui.kpis.active} value={formatNumber(kpis.active)} />
                <Kpi label={panel.ui.kpis.trials} value={formatNumber(kpis.trials)} />
                <Kpi label={panel.ui.kpis.overdue} value={formatNumber(kpis.overdue)} attention={kpis.overdue > 0} />
              </ul>
            )}
          </Await>
        </Suspense>
      </section>

      <section aria-labelledby="activity-title" className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 id="activity-title" className={styles.sectionTitle}>
            {panel.ui.recentActivity}
          </h2>
          <Link to="/app/customers" prefetch="intent" className={styles.more}>
            {panel.ui.viewAll}
          </Link>
        </div>
        <Suspense fallback={<ActivitySkeleton rows={6} />}>
          <Await resolve={loaderData.activity} errorElement={<WidgetError />}>
            {(items) => (
              <ol role="list" className={styles.activity}>
                {items.map((item) => (
                  <li key={item.id} className={styles.activityItem}>
                    <span>
                      <strong>{item.who}</strong> ({item.company}) {item.what}
                    </span>
                    <time dateTime={item.at} className={styles.time}>
                      {formatDateTime(item.at)}
                    </time>
                  </li>
                ))}
              </ol>
            )}
          </Await>
        </Suspense>
      </section>
    </>
  );
}

function Kpi({ label, value, attention = false }: { label: string; value: string; attention?: boolean }) {
  return (
    <li className={styles.kpi} data-attention={attention || undefined}>
      <span className={styles.kpiLabel}>{label}</span>
      <span className={styles.kpiValue}>{value}</span>
    </li>
  );
}

/** Same grid, heights and spacing as the real cards, so nothing moves when they arrive. */
function KpiSkeleton() {
  return (
    <Loading className={styles.kpis}>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className={styles.kpi}>
          <Skeleton width="55%" height="0.875rem" />
          <Skeleton width="40%" height="2rem" />
        </div>
      ))}
    </Loading>
  );
}

function ActivitySkeleton({ rows }: { rows: number }) {
  return (
    <Loading className={styles.activity}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={styles.activityItem}>
          <Skeleton width={`${50 + ((i * 13) % 30)}%`} height="1rem" />
          <Skeleton width="7rem" height="0.875rem" />
        </div>
      ))}
    </Loading>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <PanelError error={error} />;
}
