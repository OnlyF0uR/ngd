import { pages } from '~/content/pages';
import { absoluteUrl } from '~/lib/seo';

const escapeXml = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);

/** Canonical, indexable URLs only. Prerendered at build time (see content/pages.ts). */
export function loader() {
  const urls = pages
    .filter((page) => !page.noindex)
    .map((page) => {
      const lastmod = page.lastModified ? `<lastmod>${page.lastModified}</lastmod>` : '';
      return `  <url><loc>${escapeXml(absoluteUrl(page.path))}</loc>${lastmod}</url>`;
    })
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
