import { createFileRoute, Outlet } from '@tanstack/react-router';
import { SiteHeader } from '~/components/layout/SiteHeader/SiteHeader';
import { SiteFooter } from '~/components/layout/SiteFooter/SiteFooter';
import { site } from '~/lib/site';

/** Pathless layout for public pages (the leading underscore adds no URL segment): header + footer. */
export const Route = createFileRoute('/_site')({
  component: SiteLayout,
});

function SiteLayout() {
  return (
    <>
      <a href="#main" className="visually-hidden">
        {site.ui.skipToContent}
      </a>
      <SiteHeader />
      <main id="main">
        <Outlet />
      </main>
      <SiteFooter />
    </>
  );
}
