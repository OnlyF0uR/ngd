import { createFileRoute, redirect } from '@tanstack/react-router';
import { fetchSessionUser } from '~/lib/panel.functions';
import { panel, panelHead } from '~/lib/panel';
import styles from './login.module.css';

/** Only same-site paths, so ?next= can't send someone to another site after signing in. */
const safeNext = (value: string | undefined) =>
  value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') ? value : panel.home;

/**
 * Placeholder until authentication is chosen (ngd-panel: references/panel-architecture.md, section 2).
 * Replace it with your provider's sign-in (or remove it behind Cloudflare Access); keep `safeNext` for the
 * redirect after signing in.
 */
export const Route = createFileRoute('/login')({
  validateSearch: (raw: Record<string, unknown>): { next?: string } => (typeof raw.next === 'string' ? { next: raw.next } : {}),
  beforeLoad: async ({ search }) => {
    if ((await fetchSessionUser()).user) throw redirect({ href: safeNext(search.next) });
  },
  headers: () => ({ 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' }),
  head: () => panelHead(panel.ui.signInTitle),
  component: Login,
});

function Login() {
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
