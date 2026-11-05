import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { fetchSessionUser } from '~/lib/panel.functions';
import { panelHead, panel } from '~/lib/panel';
import { AppShell } from '~/components/panel/AppShell/AppShell';
import { PanelError } from '~/components/panel/PanelError/PanelError';
import styles from './layout.module.css';

/**
 * Layout for everything under /app: requires a signed-in user, is never indexed and never stored in a
 * shared cache. The guard decides what to render (on the server for the first request, in the browser
 * on client navigation); the data itself is protected in the server functions (lib/panel.functions.ts).
 */
export const Route = createFileRoute('/app')({
  beforeLoad: async ({ location }) => {
    const { user } = await fetchSessionUser();
    if (!user) throw redirect({ to: '/login', search: { next: location.href } });
    return { user };
  },
  headers: () => ({ 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' }),
  head: () => panelHead(panel.ui.overview),
  component: PanelLayout,
  // Screens have their own error component inside the shell; this one is for when the shell can't render
  errorComponent: ({ error }) => (
    <main id="main" className={styles.error}>
      <PanelError error={error} />
    </main>
  ),
});

function PanelLayout() {
  const { user } = Route.useRouteContext();
  return (
    <AppShell user={user}>
      <Outlet />
    </AppShell>
  );
}
