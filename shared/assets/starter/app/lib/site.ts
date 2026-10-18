/**
 * Single source of truth for site-wide facts. The header, footer, contact page, JSON-LD,
 * sitemap and robots.txt all read from here, so a phone number or URL changes in one place.
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
  defaultOgImage: '/og/default.jpg',
  logo: '/logo.png',
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
  nav: [
    { label: 'Services', href: '/#services' },
    { label: 'About', href: '/#about' },
    { label: 'Contact', href: '/contact' },
  ],
  primaryCta: { label: 'Get in touch', href: '/contact' },
} as const;

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

export const whatsappHref = (number: string, text?: string) =>
  `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
