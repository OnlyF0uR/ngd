import type { Route } from './+types/robots';
import { site } from '~/lib/site';

/**
 * Production allows crawling and points to the sitemap; every other host (preview URLs,
 * workers.dev) is kept out of search. Not prerendered, because the answer depends on the host.
 * Decide AI crawler access with the user (references/core/seo.md section 9) and add rules here.
 */
export function loader({ url }: Route.LoaderArgs) {
  const production = url.host === new URL(site.url).host;
  const body = production
    ? ['User-agent: *', 'Allow: /', 'Disallow: /api/', '', `Sitemap: ${site.url}/sitemap.xml`, ''].join('\n')
    : ['User-agent: *', 'Disallow: /', ''].join('\n');
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
