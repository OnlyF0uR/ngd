import { useRef } from 'react';
import { Link } from '@tanstack/react-router';
import { site, telHref } from '~/lib/site';
import { ButtonLink } from '~/components/ui/Button/Button';
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

        <nav className={styles.nav} aria-label={site.ui.mainNav}>
          {site.nav.map((item) =>
            // In-page anchors never mark themselves as the current page; real pages get aria-current="page"
            'hash' in item ? (
              <Link key={item.label} to={item.to} hash={item.hash} className={styles.navLink} activeOptions={{ includeHash: true }}>
                {item.label}
              </Link>
            ) : (
              <Link key={item.label} to={item.to} className={styles.navLink}>
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className={styles.actions}>
          <ButtonLink to={site.primaryCta.to} className={styles.cta}>
            {site.primaryCta.label}
          </ButtonLink>
          <button type="button" className={styles.menuButton} popoverTarget="site-menu" aria-label={site.ui.openMenu}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>

      <div id="site-menu" popover="auto" ref={menuRef} className={styles.sheet}>
        <button type="button" className={styles.close} popoverTarget="site-menu" popoverTargetAction="hide" aria-label={site.ui.closeMenu}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <nav aria-label={site.ui.mobileNav}>
          <ul role="list" className={styles.sheetList}>
            {site.nav.map((item) => (
              <li key={item.label}>
                <Link to={item.to} hash={'hash' in item ? item.hash : undefined} onClick={closeMenu}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.sheetFooter}>
          <ButtonLink to={site.primaryCta.to} size="lg" arrow onClick={closeMenu}>
            {site.primaryCta.label}
          </ButtonLink>
          <a href={telHref(site.contact.phone)} className={styles.phone}>
            {site.contact.phone}
          </a>
        </div>
      </div>
    </header>
  );
}
