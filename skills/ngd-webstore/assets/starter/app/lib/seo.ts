import type { MetaDescriptor } from 'react-router';
import { site } from './site';

export type JsonLd = Record<string, unknown>;

export type SeoInput = {
  /** Full title, about 50–60 characters, brand at the end: "Sports Massage in Utrecht | Studio Fysio" */
  title: string;
  /** About 150–160 characters: benefit, proof, call to action */
  description: string;
  /** Canonical path of this page, e.g. "/services/sports-massage" (no trailing slash except "/") */
  path: string;
  /** Social card, 1200×630; root-relative or absolute */
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'article' | 'product';
  /** Thank-you pages, internal search, panels, cart/checkout */
  noindex?: boolean;
  jsonLd?: JsonLd | JsonLd[];
  /** hreflang alternates for multilingual sites: list every version including this one, plus x-default */
  alternates?: { hrefLang: string; path: string }[];
};

/** Absolute URL on the production origin. Never derive this from request.url (prerender runs on localhost). */
export const absoluteUrl = (path: string) => new URL(path, site.url).href;

/** Meta descriptors for a route's `meta` export: title, description, canonical, Open Graph, Twitter, robots, JSON-LD. */
export function seo(input: SeoInput): MetaDescriptor[] {
  const url = absoluteUrl(input.path);
  const image = absoluteUrl(input.image ?? site.defaultOgImage);
  const tags: MetaDescriptor[] = [
    { title: input.title },
    { name: 'description', content: input.description },
    { tagName: 'link', rel: 'canonical', href: url },
    { property: 'og:type', content: input.type ?? 'website' },
    { property: 'og:site_name', content: site.name },
    { property: 'og:locale', content: site.ogLocale },
    { property: 'og:title', content: input.title },
    { property: 'og:description', content: input.description },
    { property: 'og:url', content: url },
    { property: 'og:image', content: image },
    { name: 'twitter:card', content: 'summary_large_image' },
  ];
  if (input.imageAlt) tags.push({ property: 'og:image:alt', content: input.imageAlt });
  if (input.noindex) tags.push({ name: 'robots', content: 'noindex, follow' });
  for (const alt of input.alternates ?? []) {
    tags.push({ tagName: 'link', rel: 'alternate', hrefLang: alt.hrefLang, href: absoluteUrl(alt.path) });
  }
  const jsonLd = input.jsonLd === undefined ? [] : Array.isArray(input.jsonLd) ? input.jsonLd : [input.jsonLd];
  for (const item of jsonLd) tags.push({ 'script:ld+json': item });
  return tags;
}

/* ---------- JSON-LD builders: describe only what is visible on the page ---------- */

export function organizationJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    logo: absoluteUrl(site.logo),
    sameAs: site.socials,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: site.contact.email,
      telephone: site.contact.phone,
    },
  };
}

/** Use instead of organizationJsonLd for businesses customers visit or that serve an area.
 *  Pick the most specific schema.org type (Dentist, Restaurant, HomeAndConstructionBusiness …). */
export function localBusinessJsonLd(type = 'LocalBusiness', extra: JsonLd = {}): JsonLd {
  const { address } = site.contact;
  return {
    '@context': 'https://schema.org',
    '@type': type,
    name: site.name,
    url: site.url,
    image: absoluteUrl(site.defaultOgImage),
    telephone: site.contact.phone,
    email: site.contact.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: address.street,
      postalCode: address.postalCode,
      addressLocality: address.city,
      addressCountry: address.country,
    },
    sameAs: site.socials,
    ...extra, // geo, openingHoursSpecification, priceRange, areaServed
  };
}

export function websiteJsonLd(): JsonLd {
  return { '@context': 'https://schema.org', '@type': 'WebSite', name: site.name, url: site.url };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
