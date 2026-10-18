import { isRouteErrorResponse, Link, Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import type { Route } from './+types/root';
// Fonts: self-hosted variable fonts (swap the family for the chosen preset's typefaces)
import '@fontsource-variable/inter-tight/wght.css';
import interTightLatin from '@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff2?url';
// Global styles: generated color tokens first, then the small global layer. Everything else is CSS Modules.
import './styles/tokens.css';
import './styles/global.css';
import { site } from './lib/site';
import styles from './root.module.css';

export const links: Route.LinksFunction = () => [
  { rel: 'preload', href: interTightLatin, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
  { rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
  // Add when the files exist: { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
  // { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }, { rel: 'manifest', href: '/site.webmanifest' },
];

/**
 * Shared caches (Workers Cache, if enabled) must never store a personalised response by accident.
 * Routes that are safe to cache publicly set their own Cache-Control in a `headers` export.
 */
export const middleware: Route.MiddlewareFunction[] = [
  async (_args, next) => {
    const response = await next();
    if (!response.headers.has('Cache-Control')) response.headers.set('Cache-Control', 'private, no-cache');
    return response;
  },
];

/*
 * Only for sites with a light/dark toggle: applies the saved choice before first paint (no flash).
 * The toggle sets document.documentElement.dataset.theme and localStorage 'theme'.
 * Delete this and the <script> below if the site follows the system setting only.
 */
const THEME_SCRIPT = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={site.locale} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

/** Designed 404 and error pages. Unmatched URLs get a real 404 status from here. */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  const title = notFound ? site.ui.notFoundTitle : site.ui.errorTitle;
  const detail = notFound ? site.ui.notFoundText : site.ui.errorText;
  const stack = import.meta.env.DEV && error instanceof Error ? error.stack : undefined;

  return (
    <main className={styles.error}>
      <title>{`${title} | ${site.name}`}</title>
      <meta name="robots" content="noindex" />
      <p className={styles.code}>{notFound ? '404' : 'Error'}</p>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.detail}>{detail}</p>
      <nav className={styles.links} aria-label={site.ui.helpfulLinks}>
        <Link to="/">{site.ui.home}</Link>
        {site.nav.map((item) => (
          <Link key={item.href} to={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
      {stack && <pre className={styles.stack}>{stack}</pre>}
    </main>
  );
}
