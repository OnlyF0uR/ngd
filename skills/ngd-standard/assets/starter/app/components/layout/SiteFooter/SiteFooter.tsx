import { Link } from 'react-router';
import { site, telHref, whatsappHref } from '~/lib/site';
import styles from './SiteFooter.module.css';

/** Rich footer: navigation, full contact details (consistent NAP for local SEO), socials, legal. */
export function SiteFooter() {
  const { contact } = site;
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Link to="/" className={styles.logo}>
            {site.name}
          </Link>
          <p className={styles.tagline}>{site.description}</p>
        </div>

        <nav aria-label="Footer" className={styles.column}>
          <h2 className={styles.heading}>Explore</h2>
          <ul role="list">
            {site.nav.map((item) => (
              <li key={item.href}>
                <Link to={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <address className={styles.column}>
          <h2 className={styles.heading}>Contact</h2>
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

      <div className={styles.bottom}>
        <p>
          © {new Date().getFullYear()} {site.legalName}
        </p>
        <ul role="list" className={styles.legal}>
          <li>
            <Link to="/privacy">Privacy</Link>
          </li>
          <li>
            <Link to="/terms">Terms</Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
