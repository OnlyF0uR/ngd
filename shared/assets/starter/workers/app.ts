import { createRequestHandler, RouterContextProvider } from 'react-router';
import { cloudflareContext } from '../app/lib/cloudflare-context';
import { redirects } from '../app/content/redirects';

const handler = createRequestHandler(() => import('virtual:react-router/server-build'), import.meta.env.MODE);

// Static files get these from public/_headers; Worker responses get them here.
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Moved pages: permanent redirects. Old URLs are never prerendered, so they always reach the Worker.
    const target = redirects.get(url.pathname);
    if (target) return Response.redirect(new URL(target, url).href, 301);

    // 2. One URL per page: drop trailing slashes (prerendered pages are handled by assets.html_handling).
    if (url.pathname.length > 1 && url.pathname.endsWith('/') && (request.method === 'GET' || request.method === 'HEAD')) {
      url.pathname = url.pathname.replace(/\/+$/, '') || '/';
      return Response.redirect(url.href, 301);
    }

    // 3. React Router with typed access to bindings and the execution context.
    const context = new RouterContextProvider();
    context.set(cloudflareContext, { env, ctx });
    const response = await handler(request, context);

    const headers = new Headers(response.headers);
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) if (!headers.has(name)) headers.set(name, value);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
} satisfies ExportedHandler<Env>;
