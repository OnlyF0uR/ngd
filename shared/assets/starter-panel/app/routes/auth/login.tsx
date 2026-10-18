import { redirect } from 'react-router';
import type { Route } from './+types/login';
import { cloudflareContext } from '~/lib/cloudflare-context';
import { getSessionUser, safeNext } from '~/lib/auth.server';
import { panel, panelMeta } from '~/lib/panel';
import styles from './login.module.css';

export const meta: Route.MetaFunction = () => panelMeta(panel.ui.signInTitle);

export const headers: Route.HeadersFunction = () => ({
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow',
});

/**
 * Placeholder until authentication is chosen (ngd-panel: references/panel-architecture.md, section 2).
 * Replace it with your provider's sign-in (or remove it behind Cloudflare Access); keep `safeNext` for the
 * redirect after signing in.
 */
export async function loader({ request, context, url }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  if (await getSessionUser(request, env)) throw redirect(safeNext(url.searchParams.get('next')));
  return null;
}

export default function Login() {
  return (
    <main id="main" className={styles.page}>
      <div className={styles.card}>
        <p className={styles.brand}>{panel.name}</p>
        <h1 className={styles.title}>{panel.ui.signInTitle}</h1>
        <p className={styles.text}>{panel.ui.signInNotConfigured}</p>
      </div>
    </main>
  );
}
