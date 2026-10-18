# SEO: research, structure, implementation

Every indexed ngd page should rank for what its audience searches, render complete HTML on the server, and give search engines (and AI answer engines) clean signals. This file covers keyword research, site structure, on-page and technical SEO, structured data, local and international SEO, AI search, and launch. The React Router implementation details live in architecture.md.

## Contents
1. Keyword research (do it for every niche)
2. The SEO plan deliverable
3. Site structure and URLs
4. On-page essentials
5. Technical SEO checklist
6. Structured data (what still matters in 2026)
7. Local SEO
8. International and multilingual
9. AI search and crawlers
10. Migrating an existing site
11. Launch and monitoring

## 1. Keyword research (do it for every niche)

Do this in phase 2 for anything that will be indexed. The goal is a short, prioritised list of what real people search, mapped to pages, not a giant spreadsheet.

**Inputs:** the offer, audience, location(s) and language(s) from discovery, the competitors the user named, and the existing site's pages (if any). If a named competitor can't be found, say so and use the businesses that actually rank for the main phrases instead.

**Process:**
1. **Seeds.** List 10–20 seed phrases the customer would type: the service or product, the problem, the outcome, plus location modifiers for local businesses ("physiotherapist utrecht", "knee pain running", "sports massage near me").
2. **Expand.** Use what you have:
   - Web search: look at the result titles and headings that rank, "People also ask" style questions, and related searches. Search tools are sometimes limited to one country's results; for other markets, lean on autocomplete with the market's `gl`/`hl`, the competitors' pages and local directories, and say which sources you used.
   - Autocomplete: if network access allows, suggestion endpoints (for example `https://suggestqueries.google.com/complete/search?client=firefox&hl=<lang>&gl=<country>&q=<seed>`) give real query completions for the market. Try each seed plus a handful of modifiers (question words, the city or region, "near me", "price", "best", "for <audience>"); add a–z letter expansion only for the two or three most important seeds. Keep requests few and slow.
   - Competitors: fetch their key pages and note title tags, H1/H2s, page types and topics they cover that the user doesn't.
   - Community language: forums and Q&A threads show how customers describe their problems.
   - An SEO data tool, if one is connected (search volume, difficulty, ranking competitors). Without one, say clearly that volumes are estimates (high/medium/low by evidence: autocomplete presence, competitor focus, result types).
3. **Classify intent:** informational (wants to learn), commercial (comparing options), transactional (ready to buy/book), local (wants a nearby provider), navigational (looking for a brand). Pages must match the intent Google rewards for that query: look at what ranks. If the top results are guides, a sales page won't rank for it, and vice versa.
4. **Cluster.** Group phrases that the same page can satisfy (same intent, overlapping results). One cluster → one page. Two pages targeting the same cluster compete with each other (cannibalisation).
5. **Prioritise.** Relevance to revenue × realistic chance to rank × volume. New sites with little authority win first on specific, long-tail, local and commercial-intent clusters ("sports massage utrecht centrum" before "massage").
6. **Map to the sitemap.** Each indexable page gets one primary cluster and a few secondary phrases/questions. Clusters without a page become new pages, FAQ entries or future articles.

**Check the language of the market.** When the site's language differs from the market's main language (an English-only site for a Dutch city, a German site in Switzerland's French part), compare demand in both languages early. It often changes the language decision or adds a second language, and it is the kind of finding the user must hear before the presets.

Share a summary with the user: the proposed sitemap, the primary keyword per page, and any surprising opportunities. Their market knowledge often corrects the list.

## 2. The SEO plan deliverable

Write `design/seo-plan.md`:

```markdown
# SEO plan: {project}
Market: {country/region, language(s)} · Data source: {tool or "estimates from search results and autocomplete"}

## Keyword map
| Priority | Page | URL | Primary cluster | Intent | Demand (volume or high/medium/low) | Evidence |
|---|---|---|---|---|---|---|

## Page by page
### {Page name} — `/url`
- Secondary phrases and questions: …
- Title (≈50–60 chars): …
- Meta description (≈150–160 chars): …
- H1: … · Schema: …

## Content gaps and future pages
## Internal linking plan (hub → spokes)
## Competitor notes
```

Two parts keep it readable: the map for decisions, the page blocks for implementation. Evidence says where the demand estimate comes from (a tool's volume, autocomplete presence, what ranks, competitor focus), so the user can judge it. Titles and descriptions are drafts the copy phase refines.

## 3. Site structure and URLs

- **Shallow and logical:** every important page within three clicks of the homepage; hub pages (services, categories) link to spokes (individual services, products, articles) and back.
- **URLs:** lowercase, hyphenated, short, descriptive, in the page language, no dates or IDs unless needed: `/services/sports-massage`, `/blog/runner-knee-exercises`. Pick one trailing-slash policy and redirect the other form.
- **One URL per piece of content.** Parameters that don't change content (tracking, sort order) must not create indexable duplicates: the page's canonical always points to the clean URL, and section 5 says which variants are blocked or `noindex`.
- **Navigation and footer links are real `<a href>` links** rendered on the server; no click-handler-only navigation.
- **Breadcrumbs** on anything deeper than one level (visible + BreadcrumbList data).

### Filters, sorting and faceted navigation

Listings with filters (shops, directories, job boards, property or event listings) can generate millions of URL combinations. Crawlers waste their time on them and the duplicates dilute the pages that matter. Decide per filter:
- **Worth ranking** (a real search demand: "women's trail running shoes", "vegan restaurants in Utrecht"): make it a real landing page with a clean path (`/shoes/trail-running/women`), its own title, H1, short intro copy, a self-referencing canonical and a place in the sitemap and the internal links.
- **Everything else** (sort order, price ranges, most attribute combinations): keep the parameters in the query string with one consistent order and separator (`?color=green&size=42`), link them with `rel="nofollow"` if you like, and block the parameters in robots.txt (`Disallow: /*?*sort=`, `Disallow: /*?*price=`). Blocking crawling is the strongest control for this case; canonical tags alone are only a hint and don't stop the crawling. Alternatively, keep purely visual filter state out of the URL.
- **Empty or nonsensical combinations** return a 404 status, not an empty 200 page.
- **Pagination** stays crawlable and self-canonical (section 5); don't block `?page=`.

## 4. On-page essentials

For every indexable page:
- **Title:** unique, about 50–60 characters, primary phrase near the front, brand at the end ("Sports Massage in Utrecht | Studio Fysio"). Google may rewrite titles that are too long or too generic.
- **Meta description:** unique, about 150–160 characters (about 120 shows on mobile), benefit + proof + call to action. Not a ranking factor, but it drives clicks.
- **One H1** that matches the page's promise and includes the primary phrase naturally; a logical H2/H3 hierarchy (don't skip levels for styling; style with classes).
- **Content that fully answers the intent**, original and specific (non-commodity content is what both search and AI features reward), with the primary phrase used naturally and related questions answered.
- **Internal links** with descriptive anchor text to and from related pages.
- **Images** with descriptive alt text, sensible file names (`sports-massage-room.webp`), explicit dimensions, modern formats.
- **Canonical** link to the page's own clean absolute URL.
- **Open Graph and Twitter tags:** `og:title`, `og:description`, `og:image` (1200×630, absolute URL), `og:url`, `og:type`, `og:locale`, `twitter:card=summary_large_image`.
- **E-E-A-T signals:** real about page, real people with credentials, contact details, policies, reviews, dates on articles with authors.

## 5. Technical SEO checklist

- **Server-rendered HTML** for every indexable route: all text, links, metadata and structured data present in the initial response (React Router SSR or prerendering; architecture.md). Don't rely on client-side rendering.
- **Keep the HTML lean:** Googlebot reads only the first 2 MB of uncompressed HTML. Avoid inlining huge data blobs into the page for hydration.
- **Correct status codes:** 200 for pages, 301 for permanent moves, 404 for unknown URLs (a real 404 status from the catch-all route, not a 200 "not found" page), 410 for deliberately removed content, 503 during maintenance.
- **Crawl and index rules.** robots.txt controls *crawling*; `noindex` (a `<meta name="robots">` tag or an `X-Robots-Tag` header) controls *indexing*. A crawler only sees `noindex` on pages it may crawl, so a public page that must stay out of search gets `noindex` and stays crawlable. `Disallow` is for URLs that shouldn't be crawled at all: endless filter combinations, and private areas where a login does the real protecting. Use this table:

  | URL type | robots.txt | `noindex` | Sitemap |
  |---|---|---|---|
  | Public pages, landing pages for valuable filters | allowed | no | yes |
  | Thank-you and confirmation pages, internal search results, cart, checkout | allowed | yes | no |
  | Sort, price and other low-value filter parameters | `Disallow` the parameter | not needed (not crawled) | no |
  | Logged-in areas (`/account`, `/app`, `/admin`) and API routes (`/api/`) | `Disallow` the prefix | yes (header from the layout route), plus authentication | no |
  | Preview deployments and `workers.dev` hosts | `Disallow: /` (the starter does this per host) | header on every Worker response; prerendered files rely on robots.txt | no |

  Login protects private areas; robots.txt only keeps polite crawlers away. For preview URLs that must stay private, put them behind Cloudflare Access instead of relying on robots rules. Reference the sitemap in robots.txt with an absolute URL.
- **`sitemap.xml`:** generated from the route/content source, only canonical, indexable, 200-status URLs, absolute URLs, accurate `<lastmod>` (only when content meaningfully changed; `priority` and `changefreq` are ignored). Split above 50,000 URLs with a sitemap index.
- **Canonical tags** in the server HTML; client-side code must never change them to a different value.
- **Mobile-first:** Google indexes the smartphone rendering. Same content on mobile and desktop.
- **Core Web Vitals** "good" at the 75th percentile: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1. Aim well below those (quality.md budgets).
- **HTTPS everywhere**, one canonical host (redirect `www`/apex to the chosen one), HSTS once stable.
- **No intrusive interstitials** (popups covering content on mobile).
- **Language:** `<html lang>` set correctly per page.
- **Favicon and manifest** so search results and bookmarks look right.
- **Pagination:** crawlable `<a href>` links to `?page=2` etc.; each page self-canonical (don't canonicalise page 2 to page 1). "Load more" buttons need a paginated link fallback because crawlers don't click buttons.

## 6. Structured data (what still matters in 2026)

Use JSON-LD in a `<script type="application/ld+json">`, rendered on the server, describing only what's visible on the page. Validate with the Rich Results Test and Schema.org validator.

| Page | Types | Notes |
|---|---|---|
| Home | `Organization` (or `LocalBusiness` subtype), `WebSite` | name, url, logo, sameAs (social profiles), contactPoint; shop-wide return and shipping policies live on `Organization` |
| Local business | `LocalBusiness` subtype (`Dentist`, `Restaurant`, `HomeAndConstructionBusiness`…) | address, geo, telephone, openingHoursSpecification, priceRange, areaServed |
| Service page | `Service` (+ `provider`), `BreadcrumbList` | no rich result, but clarifies entities |
| Product | `Product` with `Offer` (price, currency, availability), images, brand, sku/gtin, variants | merchant listings and product snippets; ratings only from genuine customer reviews |
| Article / blog | `Article` or `BlogPosting` | headline, image, datePublished, dateModified, author with a profile URL |
| Event | `Event` | only for physical, publicly bookable events (online-event rich results are gone) |
| Video | `VideoObject` | for pages where a video is the main content |
| Breadcrumbs | `BreadcrumbList` | rich result on desktop only now, still useful for structure |

Things that changed (don't promise these to users):
- **FAQ rich results are gone for all sites** (removed May 2026). FAQ *content* still helps users and long-tail queries; FAQPage markup is optional and earns no rich result.
- **HowTo** and the **sitelinks search box** rich results are gone.
- **Review stars for your own business:** self-serving reviews on `LocalBusiness`/`Organization` (reviews of yourself, on your own site) are not eligible for review snippets. Never mark up fake or incentivised reviews.

## 7. Local SEO

For businesses serving a place:
- Name, address and phone (NAP) identical everywhere: footer, contact page, structured data, Google Business Profile, directories.
- A `LocalBusiness` subtype with opening hours and geo coordinates on the home and contact pages.
- A contact/location page with directions, parking, public transport, an embedded map that loads on click (a static map image with a link costs nothing up front).
- Service-area pages only when each has genuinely different content (local projects, team, testimonials, specifics). Thin copies with swapped city names are doorway pages and get ignored or penalised.
- Encourage real reviews on Google Business Profile; show them on the site (without self-serving review markup).

## 8. International and multilingual

- Separate URLs per language (`/en/…`, `/nl/…` or separate domains); never switch language by cookie or IP on the same URL.
- `hreflang` links on every version listing all versions *including itself*, plus `x-default` (the language picker or main version). Links must be reciprocal or Google ignores them.
- Translate slugs, titles, descriptions and alt text; do keyword research per language.
- Let users switch language; don't force redirects based on IP.

## 9. AI search and crawlers

- Google treats "optimising for AI Overviews / AI Mode" as ordinary SEO: be indexed, eligible for snippets, and offer original, helpful content. No special markup or `llms.txt` is needed (Google ignores `llms.txt`; adding one is harmless but optional).
- Write answer-first sections with clear headings and facts that can be quoted (prices, hours, specifics), and keep entity information consistent (Organization data, about page, profiles).
- Decide with the user whether AI crawlers may use the content. Search crawlers (Googlebot, Bingbot, OAI-SearchBot, Claude-SearchBot) drive visibility; training crawlers (GPTBot, ClaudeBot, Google-Extended for Gemini) don't. Express the choice in robots.txt.
- **Cloudflare check (important):** Cloudflare's AI crawler controls can block legitimate search crawlers. Since September 2026 its "training" bot category includes mixed-purpose crawlers such as Googlebot and Bingbot, and new domains may block AI bots by default. Before launch, review the zone's AI Crawl Control / bot settings and make sure Googlebot and Bingbot are allowed; Cloudflare's managed robots.txt prepends its own rules to yours, so check the served `/robots.txt` too.

## 10. Migrating an existing site

Rankings belong to URLs. When replacing a site:
1. Crawl the old site (sitemap, navigation, top pages by traffic if the user can share Search Console data) and list every URL.
2. Map each old URL to the most relevant new URL. Keep URLs unchanged where possible.
3. Implement permanent (301) redirects for every changed URL (architecture.md shows where), and never redirect everything to the homepage.
4. Keep the content that ranked; improve it rather than delete it.
5. After launch: submit the new sitemap, watch Search Console coverage and 404 reports for a few weeks, fix leftovers.

## 11. Launch and monitoring

- Production URL decided, canonical host enforced, staging/preview hosts `noindex`.
- Verify the domain in Google Search Console (a DNS TXT record, easy on Cloudflare) and Bing Webmaster Tools; submit the sitemap.
- Check the live robots.txt, sitemap, canonical tags, status codes and structured data on production URLs.
- Analytics running (and consent handled where needed).
- After a few weeks: review queries and pages in Search Console, find pages ranking on page 2 for good phrases, and improve those first.
