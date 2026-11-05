import { env } from 'cloudflare:workers';

export type Role = 'owner' | 'admin' | 'member' | 'viewer';
export type SessionUser = { id: string; name: string; email: string; role: Role; tenantId: string };

/**
 * Who is signed in? Replace this with the chosen authentication (ngd-panel: references/panel-architecture.md,
 * section 2): Cloudflare Access for a small internal team (verify the Cf-Access-Jwt-Assertion header), a
 * session library with D1 or a hosted provider for customer accounts.
 *
 * Until then the panel is closed everywhere except on your own machine: `npm run dev`, or `npm run preview`
 * with PANEL_DEMO_AUTH=true in .dev.vars, signs in a demo user on localhost only.
 */
const DEMO_USER: SessionUser = { id: 'demo', name: 'Demo User', email: 'demo@example.com', role: 'owner', tenantId: 'demo' };

export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  const { hostname } = new URL(request.url);
  const local = hostname === 'localhost' || hostname === '127.0.0.1';
  const demo = import.meta.env.DEV || (env as { PANEL_DEMO_AUTH?: string }).PANEL_DEMO_AUTH === 'true';
  return local && demo ? DEMO_USER : null;
}
