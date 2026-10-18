import { Outlet } from 'react-router';
import { SiteHeader } from '~/components/layout/SiteHeader/SiteHeader';
import { SiteFooter } from '~/components/layout/SiteFooter/SiteFooter';
import { site } from '~/lib/site';

export default function SiteLayout() {
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
