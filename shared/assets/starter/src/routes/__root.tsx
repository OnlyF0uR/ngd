import type { ReactNode } from 'react';
import { createRootRoute, HeadContent, Link, Scripts, type ErrorComponentProps } from '@tanstack/react-router';
// Global styles: self-hosted fonts, generated color tokens, then the small global layer. Everything else is CSS Modules.
// (Swap the font family for the chosen preset's typefaces.)
import '@fontsource-variable/inter-tight/wght.css';
import interTightLatin from '@fontsource-variable/inter-tight/files/inter-tight-latin-wght-normal.woff2?url';
import '~/styles/tokens.css';
import '~/styles/global.css';
import { site } from '~/lib/site';
import styles from './root.module.css';

export const Route = createRootRoute({
  head: () => ({
    meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    links: [
      { rel: 'preload', href: interTightLatin, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
      { rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
      // Add when the files exist: { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      // { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }, { rel: 'manifest', href: '/site.webmanifest' },
    ],
  }),
  shellComponent: RootDocument,
  // Designed 404 and error pages. Unmatched URLs get a real 404 status.
  notFoundComponent: () => <ErrorPage notFound />,
  errorComponent: ({ error }: ErrorComponentProps) => <ErrorPage error={error instanceof Error ? error : undefined} />,
});

/*
 * Only for sites with a light/dark toggle: applies the saved choice before first paint (no flash).
 * The toggle sets document.documentElement.dataset.theme and localStorage 'theme'.
 * Delete this and the <script> below if the site follows the system setting only.
 */
const THEME_SCRIPT = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang={site.locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ErrorPage({ notFound = false, error }: { notFound?: boolean; error?: Error }) {
  const title = notFound ? site.ui.notFoundTitle : site.ui.errorTitle;
  const detail = notFound ? site.ui.notFoundText : site.ui.errorText;
  const stack = import.meta.env.DEV ? error?.stack : undefined;

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
          <Link key={item.label} to={item.to} hash={'hash' in item ? item.hash : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>
      {stack && <pre className={styles.stack}>{stack}</pre>}
    </main>
  );
}
