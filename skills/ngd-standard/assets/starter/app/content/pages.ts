/**
 * Every indexable page, in one place. Feeds the sitemap and the prerender list
 * (react-router.config.ts). Keep this file plain data: the build config imports it.
 *
 * prerender: true  → built to static HTML, served without running the Worker (fastest, free).
 * prerender: false → server-rendered per request. Required for routes with an `action`
 *                    (prerendered paths reject POST) or per-request data.
 */
export type PageEntry = {
  path: string;
  prerender: boolean;
  /** ISO date of the last meaningful content change; omit rather than guess */
  lastModified?: string;
  /** Keep out of the sitemap (e.g. thank-you pages) */
  noindex?: boolean;
};

export const pages: PageEntry[] = [
  { path: '/', prerender: true },
  { path: '/contact', prerender: false },
];

export const prerenderPaths = [...pages.filter((p) => p.prerender).map((p) => p.path), '/sitemap.xml'];
