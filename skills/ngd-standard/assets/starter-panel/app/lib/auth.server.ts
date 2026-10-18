import type { SessionUser } from './auth-context';

/**
 * Who is signed in? Replace this with the chosen authentication (ngd-panel: references/panel-architecture.md,
 * section 2): Cloudflare Access for a small internal team (verify the Cf-Access-Jwt-Assertion header), a
 * session library with D1 or a hosted provider for customer accounts.
 *
 * Until then the panel is closed everywhere except on your own machine: `npm run dev`, or `npm run preview`
 * with PANEL_DEMO_AUTH=true in .dev.vars, signs in a demo user on localhost only.
 */
const DEMO_USER: SessionUser = { id: 'demo', name: 'Demo User', email: 'demo@example.com', role: 'owner', tenantId: 'demo' };

export async function getSessionUser(request: Request, env: Env): Promise<SessionUser | null> {
  const { hostname } = new URL(request.url);
  const local = hostname === 'localhost' || hostname === '127.0.0.1';
  const demo = import.meta.env.DEV || (env as { PANEL_DEMO_AUTH?: string }).PANEL_DEMO_AUTH === 'true';
  return local && demo ? DEMO_USER : null;
}

/** Only same-site paths, so ?next= can't send someone to another site after signing in. */
export function safeNext(value: string | null, fallback = '/app'): string {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') ? value : fallback;
}
