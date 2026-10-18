import { Outlet, redirect } from 'react-router';
import type { Route } from './+types/layout';
import { cloudflareContext } from '~/lib/cloudflare-context';
import { userContext } from '~/lib/auth-context';
import { getSessionUser } from '~/lib/auth.server';
import { panelMeta, panel } from '~/lib/panel';
import { AppShell } from '~/components/panel/AppShell/AppShell';
import { PanelError } from '~/components/panel/PanelError/PanelError';
import styles from './layout.module.css';

/**
 * Everything under this layout requires a signed-in user, is never indexed and never stored in a
 * shared cache. Runs for document and data requests alike, before any loader or action below it.
 */
export const middleware: Route.MiddlewareFunction[] = [
  async ({ request, context, url }, next) => {
    const { env } = context.get(cloudflareContext);
    const user = await getSessionUser(request, env);
    if (!user) throw redirect(`/login?next=${encodeURIComponent(url.pathname + url.search)}`);
    context.set(userContext, user);
    const response = await next();
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  },
];

export const meta: Route.MetaFunction = () => panelMeta(panel.ui.overview);

/** Only what the shell needs, and fast: no slow queries here, they would block every screen. */
export function loader({ context }: Route.LoaderArgs) {
  const { name, email, role } = context.get(userContext);
  return { user: { name, email, role } };
}

export default function PanelLayout({ loaderData }: Route.ComponentProps) {
  return (
    <AppShell user={loaderData.user}>
      <Outlet />
    </AppShell>
  );
}

/** Errors in the layout itself (the shell can't render); screens have their own boundary inside the shell. */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return (
    <main id="main" className={styles.error}>
      <PanelError error={error} />
    </main>
  );
}
