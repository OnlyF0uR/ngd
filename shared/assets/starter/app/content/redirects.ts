/**
 * Permanent redirects for URLs that moved (site migrations, renamed pages).
 * Checked in workers/app.ts before React Router runs. Map each old path to its
 * most relevant new page; never send everything to the homepage.
 */
export const redirects = new Map<string, string>([
  // ['/old-services.html', '/services'],
]);
