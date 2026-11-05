import { Suspense, type ReactNode } from 'react';
import { Await, CatchBoundary, createFileRoute, Link } from '@tanstack/react-router';
import { fetchKpis, fetchRecentActivity } from '~/lib/panel.functions';
import { formatDateTime, formatMoney, formatNumber } from '~/lib/format';
import { panel, panelHead } from '~/lib/panel';
import { PageHeader } from '~/components/panel/PageHeader/PageHeader';
import { Loading, Skeleton } from '~/components/panel/Skeleton/Skeleton';
import { PanelError, WidgetError } from '~/components/panel/PanelError/PanelError';
import styles from './dashboard.module.css';

/** Slow data is returned as promises, not awaited: the shell and header render at once, the rest streams in. */
export const Route = createFileRoute('/app/')({
  loader: () => ({ kpis: fetchKpis(), activity: fetchRecentActivity() }),
  head: () => panelHead(panel.ui.overview),
  component: Dashboard,
  errorComponent: ({ error }) => <PanelError error={error} />,
});

/** One failing widget says so and offers a retry; the rest of the screen keeps working. */
function Widget({ name, children }: { name: string; children: ReactNode }) {
  return (
    <CatchBoundary getResetKey={() => name} errorComponent={({ reset }) => <WidgetError reset={reset} />}>
      {children}
    </CatchBoundary>
  );
}

function Dashboard() {
  const loaderData = Route.useLoaderData();
  return (
    <>
      <PageHeader title={panel.ui.overview} description={panel.ui.overviewIntro} />

      <section aria-labelledby="kpi-title" className={styles.section}>
        <h2 id="kpi-title" className="visually-hidden">
          {panel.ui.keyFigures}
        </h2>
        <Widget name="kpis">
          <Suspense fallback={<KpiSkeleton />}>
            <Await promise={loaderData.kpis}>
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
        </Widget>
      </section>

      <section aria-labelledby="activity-title" className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 id="activity-title" className={styles.sectionTitle}>
            {panel.ui.recentActivity}
          </h2>
          <Link to="/app/customers" className={styles.more}>
            {panel.ui.viewAll}
          </Link>
        </div>
        <Widget name="activity">
          <Suspense fallback={<ActivitySkeleton rows={6} />}>
            <Await promise={loaderData.activity}>
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
        </Widget>
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
