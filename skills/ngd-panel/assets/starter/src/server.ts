import handler, { createServerEntry } from '@tanstack/react-start/server-entry';
import { redirects } from '~/content/redirects';
import { site } from '~/lib/site';

/*
 * The Worker entry (wrangler.jsonc "main"). Runs for every request that isn't a static file:
 * server-rendered pages, server routes, server functions. Prerendered pages and assets are served
 * by Workers Static Assets without reaching this code (their headers come from public/_headers).
 */
const PRODUCTION_HOST = new URL(site.url).host;

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export default createServerEntry({
  async fetch(request) {
    const url = new URL(request.url);

    // 1. Moved pages: permanent redirects. Old URLs are never prerendered, so they always reach the Worker.
    const target = redirects.get(url.pathname);
    if (target) return Response.redirect(new URL(target, url).href, 301);

    // 2. One URL per page: drop trailing slashes (prerendered pages are handled by assets.html_handling).
    if (url.pathname.length > 1 && url.pathname.endsWith('/') && (request.method === 'GET' || request.method === 'HEAD')) {
      url.pathname = url.pathname.replace(/\/+$/, '') || '/';
      return Response.redirect(url.href, 301);
    }

    // 3. TanStack Start: server functions, server routes, then server rendering.
    const response = await handler.fetch(request);

    const headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) if (!headers.has(name)) headers.set(name, value);
    // Shared caches (Workers Cache, if enabled) must never store a personalised response by accident.
    // Routes that are safe to cache publicly set their own Cache-Control (route `headers` or the Response).
    if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'private, no-cache');
    // Preview deployments and workers.dev must never be indexed (prerendered files there rely on robots.txt)
    if (url.host !== PRODUCTION_HOST) headers.set('X-Robots-Tag', 'noindex, nofollow');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
});
