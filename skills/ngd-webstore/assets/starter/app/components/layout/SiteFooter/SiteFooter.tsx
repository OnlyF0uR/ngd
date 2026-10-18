import { Link } from 'react-router';
import { site, telHref, whatsappHref } from '~/lib/site';
import styles from './SiteFooter.module.css';

/** Rich footer: navigation, full contact details (consistent NAP for local SEO), socials, legal. */
export function SiteFooter() {
  const { contact, ui } = site;
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Link to="/" className={styles.logo}>
            {site.name}
          </Link>
          <p className={styles.tagline}>{site.description}</p>
        </div>

        <nav aria-label={ui.footerNav} className={styles.column}>
          <h2 className={styles.heading}>{ui.footerExplore}</h2>
          <ul role="list">
            {site.nav.map((item) => (
              <li key={item.href}>
                <Link to={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.column}>
          <h2 className={styles.heading}>{ui.footerContact}</h2>
          <address>
            <ul role="list">
              <li>
                {contact.address.street}, {contact.address.postalCode} {contact.address.city}
              </li>
              <li>
                <a href={telHref(contact.phone)}>{contact.phone}</a>
              </li>
              <li>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </li>
              {contact.whatsapp && (
                <li>
                  <a href={whatsappHref(contact.whatsapp)} rel="noopener">
                    WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </address>
        </div>
      </div>

      <div className={styles.bottom}>
        {/* Prerendered pages keep the build-time year until the next deploy; suppress the harmless mismatch */}
        <p suppressHydrationWarning>
          © {new Date().getFullYear()} {site.legalName}
        </p>
        <ul role="list" className={styles.legal}>
          {site.legal.map((page) => (
            <li key={page.href}>
              <Link to={page.href}>{page.label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
