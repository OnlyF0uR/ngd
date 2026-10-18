# Commerce architecture, SEO and compliance

How an NGD webstore is put together on React Router + Cloudflare Workers: choosing the commerce backend, rendering and caching the catalogue, cart and checkout, orders and webhooks, store SEO, and the legal requirements that shape the UI. Verify provider APIs against their current docs before building; they change more often than the patterns here.

## Contents
1. Choosing the commerce backend
2. Rendering and caching the catalogue
3. Cart
4. Checkout and payments
5. Orders, webhooks and fulfilment
6. Search
7. Product media
8. Money, tax and markets
9. Store SEO
10. Legal and compliance (EU focus)
11. Analytics
12. Performance specifics

## 1. Choosing the commerce backend

The storefront is always ours (React Router on Workers). Where products, orders and payments live depends on the business:

| Option | Good for | Watch out for |
|---|---|---|
| **Shopify, headless** (Storefront API + Shopify checkout) | Merchants already on Shopify; big catalogues; inventory, POS, apps; non-technical staff | Checkout runs on Shopify; Storefront API rate limits; app scripts don't carry over to a headless storefront |
| **Stripe** (Products/Prices + Checkout or Payment Element) | Small catalogues, digital goods, subscriptions, simple physical shops | Catalogue management is basic; you build order handling (D1) and emails |
| **Mollie / Adyen / PayPal** + own catalogue | EU merchants who need local payment methods | You build catalogue and order management (D1 + an ngd-panel admin) |
| **Merchant of record** (Paddle, Lemon Squeezy and similar) | Software and digital products sold worldwide; they handle VAT and invoicing | Fees; less control over checkout |
| **Open-source headless** (Medusa, Saleor, Vendure) | Full control, custom flows | Runs on separate hosting (not Workers); more operations |
| **Custom on Cloudflare** (D1 catalogue, R2 media, Stripe/Mollie payments, ngd-panel admin) | Small, stable catalogues with specific needs | Most build effort; you own inventory, tax and edge cases |

Decide with the user using: catalogue size and variant complexity, who manages products daily, markets and payment methods, existing platform and data (migration), digital vs physical vs subscriptions, B2B pricing, budget and fees. Record the choice and its reasons in DESIGN.md.

Keep the integration behind a small server-only module (`app/lib/commerce.server.ts`) exposing what the UI needs (`getCollection`, `getProduct`, `searchProducts`, `getCart`, `addToCart` …), so pages don't depend on one provider's API shape and a migration stays possible.

## 2. Rendering and caching the catalogue

- **Product and category pages are indexed:** server-render them (or prerender when the catalogue is small and changes rarely). Price, availability, currency, images and the description must be in the HTML (structured data depends on it).
- **Prerender** works for catalogues of up to a few hundred products that change rarely: build the path list from the commerce API in `react-router.config.ts` and trigger a rebuild (deploy hook) when products change.
- **SSR + Workers Cache** for larger or frequently changing catalogues: public catalogue routes return `Cache-Control: public, max-age=60, stale-while-revalidate=600` and a `Cache-Tag` (`product-<id>`, `collection-<handle>`); a product-update webhook purges those tags. Anything personalised (cart counts, customer prices, logged-in state) stays out of cached HTML: load it client-side with a fetcher, or mark the response `private, no-store`.
- **Stock freshness:** cached pages may show slightly old availability. Re-check stock when adding to the cart and at checkout, and refresh low-stock indicators client-side if exact numbers matter.
- **Data per request:** fetch in parallel (`Promise.all`), select only the fields the page renders, and keep HTML lean (no full product JSON dumps; Googlebot reads only the first 2 MB).

## 3. Cart

- Keep the cart server-side (provider cart API, or a cart in KV or D1 keyed by an HttpOnly cookie) so it survives devices and refreshes. The cart ID cookie is `HttpOnly; Secure; SameSite=Lax`.
- Add to cart with `useFetcher` (`fetcher.Form method="post" action="/cart"`). Show the optimistic quantity immediately from `fetcher.formData`, open the cart drawer, and announce the change in a polite live region.
- Without JavaScript the same form posts to `/cart` and redirects back, so add-to-cart still works.
- Cart, checkout and account responses: `Cache-Control: private, no-store` and `noindex`.

## 4. Checkout and payments

- **Prefer a hosted checkout** (Shopify, Stripe Checkout, Mollie hosted pages): it keeps card data out of your systems (lowest PCI scope), comes with local payment methods and wallets, and handles 3-D Secure. Brand it (logo, colors, fonts) so the transition feels continuous.
- Offer the payment methods the market expects (cards, Apple Pay/Google Pay, PayPal, and local methods such as iDEAL/Wero in the Netherlands, Bancontact in Belgium, Klarna for buy-now-pay-later). Confirm availability with the provider.
- Create the checkout session on the server (a route action) with the cart contents re-priced server-side; never trust client-side prices.
- A custom checkout (Payment Element and similar) is a bigger project: one page or an accordion of three steps, guest by default, express wallets on top, address autocomplete, inline validation, clear totals including shipping and VAT, and an unambiguous final button ("Order and pay").

## 5. Orders, webhooks and fulfilment

- Payment providers confirm payments by **webhook**: a resource route (`/webhooks/<provider>`) that verifies the signature, is idempotent (store event IDs), records the order in D1 (or relies on the platform's order system), triggers confirmation email, adjusts inventory, and purges cache tags. Return 2xx quickly; push slow work to `ctx.waitUntil` or a Queue.
- The success page reads the order by session ID server-side; it never trusts query parameters alone.
- Transactional emails: order confirmation (with withdrawal information, see section 10), shipping confirmation with tracking, delivery, review request a few days after delivery. Send through Cloudflare Email Service (domain onboarded, Workers Paid) or the provider's emails.
- An admin for orders, products and returns: the platform's own admin, or an ngd-panel admin for custom stacks.

## 6. Search

- Small catalogues (up to a few thousand products): a prebuilt JSON index searched client-side, or SQLite full-text search (FTS5) in D1.
- Platforms: use their search APIs (predictive search for suggestions).
- UX: instant suggestions for products, categories and popular queries; typo tolerance; a no-results page with alternatives. Internal search result pages are `noindex`.

## 7. Product media

- Real product photography is non-negotiable for trust. AI may create backgrounds or lifestyle scenes around unaltered product photos, never the product itself (imagery.md).
- Several angles per product, variant-specific images (each color), a consistent aspect ratio across the catalogue (4:5 or 1:1), and a detail or scale shot.
- Serve through the platform's image CDN with width parameters, or through Cloudflare Images (binding or URL transformations) with an allow-list of widths. Grid images get accurate `sizes`; only the first row is eager.
- Zoom loads the large image on demand, not up front.

## 8. Money, tax and markets

- Store money as integers in minor units (cents) with a currency code; format with `Intl.NumberFormat(locale, { style: 'currency', currency })`.
- Consumers in the EU see prices **including VAT**; show shipping costs before checkout (a free-shipping threshold in the header bar and cart). Cross-border EU sales may need VAT per destination country (OSS); confirm the setup with the user and the payment/commerce provider (Stripe Tax, Shopify Markets, merchant of record).
- Unit prices (per kg, per litre) where the law requires them for the product type.
- Multiple markets: per-market URLs (`/nl/`, `/de/` or subdomains) with hreflang, prices and currency per market, and a suggestion banner instead of forced geo-redirects.

## 9. Store SEO

- **Category pages are the money pages.** Target commercial clusters ("linen shirts women", "trail running shoes"), with a short unique intro, curated subcategory links, good product ordering and an FAQ or buying guide below the grid.
- **Product pages:** unique descriptions (never the manufacturer's copy alone), descriptive title (brand + product + key attribute), breadcrumbs, multiple images with good alt text, reviews rendered as HTML.
- **Structured data:** `Product` with `offers` (price, priceCurrency, availability, itemCondition, url), brand, sku/gtin/mpn, images; variants as `ProductGroup` with `hasVariant` and `variesBy`; `aggregateRating`/`review` only from genuine customer reviews. Shop-wide return and shipping policies go on `Organization` (`hasMerchantReturnPolicy`, `hasShippingService`); per-product exceptions on the `Offer`. Sale prices and dates via `priceSpecification`/`validFrom`/`validThrough`. Validate with the Rich Results Test.
- **One URL per product.** Variant selections use a query parameter (`?color=sage`) with the canonical pointing to the product URL, unless a variant has its own real search demand.
- **Faceted navigation:** filter URLs multiply endlessly. Keep only a few valuable filter combinations indexable (with clean, stable URLs and their own intro copy); for the rest, use parameters you block in robots.txt (`Disallow: /*?*sort=`) or keep filters in client state. Return 404 for empty or nonsense combinations. Canonical tags alone are a weak fix.
- **Pagination:** crawlable `?page=2` links, each page self-canonical; "load more" buttons also need those links.
- **Out of stock:** keep the page (200) with alternatives and back-in-stock signup. Discontinued for good: 301 to the closest replacement or the category; 410 when nothing fits.
- **Feeds:** a Google Merchant Center product feed (`/feeds/google.xml` resource route) unlocks free product listings; Meta and others accept similar feeds.
- `noindex`: cart, checkout, account, search results, sort and filter variants you don't want indexed.

## 10. Legal and compliance (EU focus)

Check the user's markets; these are the common EU requirements that shape the UI (not legal advice: tell the user to have terms and policies reviewed):
- **Price transparency:** prices including VAT; delivery costs and total price clear before the order; unit prices where required.
- **Discounts (Omnibus rule):** any announced price reduction shows the prior price, meaning the lowest price in the 30 days before the reduction, and percentages are calculated from it. Store price history to support this.
- **Reviews:** state whether and how you verify that reviews come from real customers; never publish fake or incentivised reviews without disclosure.
- **Right of withdrawal:** 14 days for most consumer goods, with exceptions (perishables, personalised items, sealed hygiene products once unsealed…). Explain it in a returns page and the order confirmation.
- **Withdrawal function (required since 19 June 2026 for online contracts):** a clearly labelled "Withdraw from contract here" function, continuously available and prominent during the withdrawal period. It leads to a short form (name, which order, where to send confirmation) with a final "Confirm withdrawal" button, and the shop sends an acknowledgement with date and time on a durable medium (email) without undue delay. Build it into the account's order page and as a public page (order number + email) linked from the footer and the confirmation email.
- **Order button:** the final checkout button says unambiguously that ordering means paying ("Order and pay"). Hosted checkouts handle this; custom checkouts must.
- **Company information:** legal name, address, registration and VAT numbers, contact email/phone (imprint or footer + terms).
- **Product safety:** online listings show the manufacturer (or responsible person in the EU), product identifiers, and warnings or safety information where applicable.
- **Accessibility:** consumer e-commerce must meet the European Accessibility Act (build to WCAG 2.2 AA; micro-enterprises are exempt), including an accessibility statement in the terms or a dedicated page.
- **Privacy and cookies:** privacy policy, consent for non-essential cookies and tracking, data export/deletion for accounts.

## 11. Analytics

Track the funnel with consent where required: `view_item_list`, `view_item`, `add_to_cart`, `view_cart`, `begin_checkout`, `purchase` (from the webhook or confirmation page, deduplicated). Watch category → product → cart → checkout drop-off and fix the worst step first.

## 12. Performance specifics

- Product grids: explicit image dimensions, `sizes` that match the grid, lazy below the first row, and `content-visibility: auto` on long lists.
- Prefetch product pages on intent (`<Link prefetch="intent">`) and morph the card image into the product image with a view transition.
- Render reviews, ratings and recommendations server-side from APIs instead of third-party widget scripts.
- Every marketing script, chat and review widget must justify its cost; load on interaction or after the main content.
