import { useRef } from 'react';
import { Link, NavLink } from 'react-router';
import { site, telHref } from '~/lib/site';
import { Button } from '~/components/ui/Button/Button';
import styles from './SiteHeader.module.css';

/**
 * Sticky header with a no-JavaScript mobile menu: the Popover API gives open/close,
 * light dismiss and Escape for free. Links close the menu so client navigation feels right.
 */
export function SiteHeader() {
  const menuRef = useRef<HTMLDivElement>(null);
  const closeMenu = () => menuRef.current?.hidePopover?.();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo} aria-label={`${site.name}, home`}>
          {site.name}
        </Link>

        <nav className={styles.nav} aria-label="Main">
          {site.nav.map((item) => (
            <NavLink key={item.href} to={item.href} className={styles.navLink} prefetch="intent">
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.actions}>
          <Button to={site.primaryCta.href} className={styles.cta} prefetch="intent">
            {site.primaryCta.label}
          </Button>
          <button type="button" className={styles.menuButton} popoverTarget="site-menu" aria-label="Open menu">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>

      <div id="site-menu" popover="auto" ref={menuRef} className={styles.sheet}>
        <button type="button" className={styles.close} popoverTarget="site-menu" popoverTargetAction="hide" aria-label="Close menu">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <nav aria-label="Mobile">
          <ul role="list" className={styles.sheetList}>
            {site.nav.map((item) => (
              <li key={item.href}>
                <Link to={item.href} onClick={closeMenu}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.sheetFooter}>
          <Button to={site.primaryCta.href} size="lg" arrow onClick={closeMenu}>
            {site.primaryCta.label}
          </Button>
          <a href={telHref(site.contact.phone)} className={styles.phone}>
            {site.contact.phone}
          </a>
        </div>
      </div>
    </header>
  );
}
