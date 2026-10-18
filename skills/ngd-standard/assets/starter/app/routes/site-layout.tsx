import { Outlet } from 'react-router';
import { SiteHeader } from '~/components/layout/SiteHeader/SiteHeader';
import { SiteFooter } from '~/components/layout/SiteFooter/SiteFooter';

export default function SiteLayout() {
  return (
    <>
      <a href="#main" className="visually-hidden">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        <Outlet />
      </main>
      <SiteFooter />
    </>
  );
}
