/**
 * Single source of truth for site-wide facts and interface text. The header, footer, forms,
 * contact page, JSON-LD, sitemap and robots.txt all read from here, so a phone number, URL or
 * button label changes in one place. Translate `ui` for non-English sites.
 */
export const site = {
  name: 'Studio Example',
  legalName: 'Studio Example B.V.',
  /** Production origin without a trailing slash. Canonicals, sitemap and Open Graph URLs use it,
   *  because during prerendering the request origin is localhost. */
  url: 'https://www.example.com',
  /** <html lang> and og:locale */
  locale: 'en',
  ogLocale: 'en_US',
  description: 'One-sentence description of what the business offers and for whom.',
  defaultOgImage: '/og/default.png', // 1200×630; screenshot.mjs can render it from an HTML card (imagery.md)
  logo: '/logo.png',
  /** Public Turnstile site key (not a secret). This is Cloudflare's always-passing TEST key, so local
   *  development works with the test secret in .dev.vars. Replace it with the real key before launch.
   *  An empty string disables Turnstile entirely (client and server). */
  turnstileSiteKey: '1x00000000000000000000AA',
  contact: {
    email: 'hello@example.com',
    phone: '+31 20 123 4567',
    /** International format without + or spaces, for wa.me links. Empty string hides WhatsApp. */
    whatsapp: '31201234567',
    address: {
      street: 'Example Street 1',
      postalCode: '1000 AA',
      city: 'Amsterdam',
      country: 'NL',
    },
  },
  socials: ['https://www.instagram.com/example', 'https://www.linkedin.com/company/example'],
  /** `to` is a route path and is type-checked against the routes: a link to a page that doesn't exist
   *  fails `npm run typecheck`. In-page targets use `hash` (no #). */
  nav: [
    { label: 'Services', to: '/', hash: 'services' },
    { label: 'About', to: '/', hash: 'about' },
    { label: 'Contact', to: '/contact' },
  ],
  primaryCta: { label: 'Get in touch', to: '/contact' },
  /** Legal pages linked from the footer and forms. The starter's pages are placeholders to replace before launch. */
  legal: [
    { label: 'Privacy', to: '/privacy' },
    { label: 'Terms', to: '/terms' },
  ],
  /** Interface text used by the starter components. */
  ui: {
    skipToContent: 'Skip to content',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    mainNav: 'Main',
    mobileNav: 'Mobile',
    footerNav: 'Footer',
    footerExplore: 'Explore',
    footerContact: 'Contact',
    home: 'Home',
    notFoundTitle: 'We couldn’t find that page',
    notFoundText: 'The link may be broken or the page may have moved. These might help:',
    errorTitle: 'Something went wrong',
    errorText: 'Please try again in a moment. If it keeps happening, contact us and we’ll sort it out.',
    helpfulLinks: 'Helpful links',
    form: {
      step: 'Step {current} of {total}',
      continue: 'Continue',
      back: 'Back',
      sending: 'Sending…',
      optional: '(optional)',
      verifying: 'One moment, we’re checking that you’re not a robot. Then press send again.',
      offline: 'We couldn’t send your answers. Check your connection and try again; your answers are still here.',
    },
  },
} as const;

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

export const whatsappHref = (number: string, text?: string) => `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
