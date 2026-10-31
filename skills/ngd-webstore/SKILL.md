---
name: ngd-webstore
description: Next-generation design (NGD) workflow for online stores and e-commerce sites that must look stunning, load instantly, rank on Google and sell. Interviews the user (theme color or three proposed options, product imagery and whether to generate lifestyle images, entrance and scroll animations, catalogue, payments, shipping and markets), researches commercial keywords for the niche, shows five skeleton store presets (home plus product page) in one HTML file to choose from, then builds the chosen design with the latest React Router on Cloudflare Workers, CSS Modules, server-rendered catalogue pages with product structured data, and a hosted or custom checkout. Use it whenever someone wants a webshop, online store, product or category pages, a headless Shopify or Stripe storefront, or wants to sell products online, even if they don't say e-commerce. Combine with ngd-panel for store admin or customer accounts and with ngd-standard for extra content pages.
---

# NGD Webstore: online stores that sell

You are designing and building a store. It has to make products irresistible, make finding and buying effortless, be honest and compliant about prices and returns, load instantly on a phone, and rank for the searches that bring buyers. This skill gives you the shared NGD process plus what's specific to commerce.

**Non-negotiables, and why they matter:**
- **The user decides the look:** theme color, light/dark, motion and imagery. You propose, validate and apply. Real product photography outranks everything; AI never fakes the product itself.
- **Five presets before production code,** showing the homepage *and* the product page, because those two pages decide whether people buy.
- **Latest React Router in framework mode on Cloudflare Workers.** Every category and product page is server-rendered or prerendered with price, availability and structured data in the HTML.
- **CSS Modules per component and page, plus a small `global.css`.** Shared code is extracted: one product card, one price component, one commerce module that hides the provider API.
- **Fast:** image-heavy pages still hit Lighthouse mobile ≥ 95. No loading screens, no layout shift, no third-party widget bloat.
- **Store SEO from research:** commercial category keywords, product schema, controlled faceted navigation, a product feed.
- **Trust and compliance built into the UI:** prices including VAT, delivery costs before checkout, honest discounts (30-day prior price), the EU withdrawal function, a returns policy.
- **Accessible (WCAG 2.2 AA):** for online stores in the EU this is also a legal requirement (European Accessibility Act).

<!-- ngd:workflow:start (generated from shared/snippets/workflow.md; edit there and run `node scripts/sync-shared.mjs` from the repository root) -->
## The NGD workflow (shared by every ngd skill)

Work through the phases in order. Each one ends with something the user can see or approve, so they stay in control and nothing gets built on a guess.

**Paths.** `references/…` and `assets/…` are files in this skill's directory (`<skill-dir>`, shown as the base directory when the skill loads; `${CLAUDE_SKILL_DIR}` in Claude Code). Run the helper scripts from the **project folder** with their full path, `node <skill-dir>/scripts/<script>.mjs …`, so that their output (`design/…`, `app/…`) lands in the project, never in the skill's directory.

| Phase | You produce | Read |
|---|---|---|
| 0. Orient | what exists, which tools and environment you have, which ngd skills apply | this section |
| 1. Discover | interview answers → `DESIGN.md` | `references/core/discovery.md` |
| 2. Research | keyword plan + competitor notes → `design/seo-plan.md` (panels: domain research → `design/panel-plan.md`) | `references/core/seo.md` (panels: the ngd-panel SKILL.md) |
| 3. Presets | five skeleton directions in one HTML file; the user picks | `references/core/presets.md`, `references/core/design-language.md`; for the draft copy, form and motion idea also `copywriting.md`, `forms.md`, `motion.md` and `imagery.md` in `references/core/` |
| 4. Foundation | latest React Router on Cloudflare Workers, tokens, global layer, layout, SEO plumbing | `references/core/architecture.md`, `assets/starter/` (panels: also `assets/starter-panel/`) |
| 5. Build | every page or screen with real content, forms, images, motion | this skill's references, plus `references/core/` forms, copywriting, imagery and motion |
| 6. Verify | checks pass, screenshots reviewed, fixes made | `references/core/quality.md` |
| 7. Hand over | run/deploy instructions and what's left for the user | `references/core/quality.md` |

### Phase 0: orient (before your first question)
- **Resume if possible.** If `DESIGN.md` exists in the project root, read it, tell the user where things stand, and continue from its *Next step* instead of interviewing again.
- **Look at what exists:** an existing codebase (package.json, React Router and Wrangler config), a live site to replace (fetch it: content, structure, URLs that need redirects), brand assets, and any images the user supplied. Reference images outrank the default style: save image files to `design/references/`; for images pasted into the conversation, analyse what you see directly (`references/core/design-language.md`, section 12) and ask for the files only if they're needed in the project.
- **Inventory your tools**, because they change what you can offer: structured questions (such as AskUserQuestion), web search and fetch (keyword research), image generation (any connected tool that creates images), a browser or Playwright (screenshots), a way to show HTML (artifact or preview). Count tools that are listed by name and loaded on demand too. Never offer what you can't do, and when what you find contradicts what the user said (they expect no image tool, but one is connected), mention it once and follow the user.
- **Check the environment** and pick the matching mode:
  - *Full* (a shell with Node and network access, such as Claude Code on a machine or cloud container): every phase as written.
  - *Sandbox without network* (some API and hosted code-execution environments): no installs, scaffolding or web research. Run the interview and presets as written (the scripts need only Node), assemble the project by hand from `assets/starter/`, deliver it as files or a zip with the exact commands the user runs (`npm install`, `npm run build`, deploy), and list every check you couldn't run.
  - *No code execution* (plain chat): run the interview, show the presets as an HTML artifact or file, then deliver the project files with instructions.
  Wherever you are, never claim a check passed that you didn't run.
- **Check which ngd skills apply** (see "Working with other ngd skills" below).
- **Quick mock-up only?** If the user explicitly wants a quick static mock-up (no build, no deployment), say so, run a short interview, and let the presets file be the deliverable; skip phases 4–7 unless they ask for more.

### Phase 1: discover
Run the interview in `references/core/discovery.md`, adding this skill's extra questions (below): three short rounds (a fourth for type-specific details if needed), nothing you could infer, and a recommended default for every question. The theme color either comes from the user or is picked from three options you propose and validate with `node <skill-dir>/scripts/palette.mjs --candidates …`. Ask about images (provided, generated if an image tool is connected, stock, or none, and where to find them) and, separately, entrance and scroll animations. Create `DESIGN.md` from `assets/DESIGN.template.md` and play back a short summary with your assumptions.

### Phase 2: research
For anything that will be indexed, research keywords for the niche, location and language, scan competitors, and map one keyword cluster to each page in `design/seo-plan.md` (`references/core/seo.md`). Share the sitemap and top keywords in a few lines, because it may change what gets built. Then continue straight to the presets; wait for a reply only when a finding needs the user's decision (the site's language, a page or market they didn't plan for). Panels skip keyword research but still research the domain (typical entities, workflows, metrics).

### Phase 3: five skeleton presets
Build five clearly different directions in ONE file, `design/presets/round-1.html`, one preset at a time: write each as small files in `design/presets/round-1/` and assemble them with `node <skill-dir>/scripts/build-presets.mjs design/presets/round-1`. Use real draft copy and the generated tokens, check the file with `node <skill-dir>/scripts/screenshot.mjs design/presets/round-1.html --presets` and look at the screenshots, then show it and ask the user to pick one, mix, tweak, or request five more (`references/core/presets.md`). Write no production code before a direction is chosen. The choice is the user's, and building early wastes their time if they choose differently.

### Phase 4: foundation
Scaffold the latest React Router (framework mode, SSR) on Cloudflare Workers, or upgrade the existing project. Apply the verified starter in `assets/starter/`, generate `app/styles/tokens.css` with `node <skill-dir>/scripts/palette.mjs`, then set up fonts, the small `global.css`, the layout shell, UI primitives and SEO plumbing (`references/core/architecture.md`). Reproduce the chosen preset faithfully: same typography, spacing rhythm, shape language and signature details.

### Phase 5: build
Build every page or screen with this skill's guidance. Every indexed page is rendered on the server: at request time (SSR) or at build time (prerendering, the same complete HTML served as a static file), with complete metadata and structured data. In non-indexed app areas, never block the shell on data: stream or lazy-load it behind skeletons. Extract shared code as you go (a second use becomes a component), keep component and page styles in `.module.css` files, and write real copy in the site's language, including the interface text in `app/lib/site.ts` (`references/core/copywriting.md`). Lorem ipsum never ships.

### Phase 6: verify
Run everything in `references/core/quality.md`: typecheck, build, `node <skill-dir>/scripts/ngd-audit.mjs .`, a Worker dry-run, screenshots at 390/768/1440 (plus dark mode if offered), Lighthouse on key pages, the lead form end to end, and an honest side-by-side review against the chosen preset. Fix what you find, then re-run.

### Phase 7: hand over
Summarise what was built, how to run and deploy it, what needs the user's input (secrets, DNS, content, Search Console), and the verification results, including anything you couldn't check. Update DESIGN.md's status.

### Working with other ngd skills
The ngd skills (**ngd-standard** for landing pages and content sites, **ngd-webstore** for shops, **ngd-panel** for admin and user panels) share this workflow and the files in `references/core/`, `scripts/` and `assets/`. Those files are identical in every ngd skill, so read each one once, from whichever skill you loaded first. When a request spans several surfaces (a shop with an admin panel, a marketing site with a customer portal, a brand site with a shop):
- Load every relevant ngd skill and run this workflow **once**: one interview with the extra questions merged, one `DESIGN.md` with a section per surface, one research pass covering all indexed pages, one project and one design system.
- **Presets:** start with the public surface (webstore or standard), because it defines the brand. Once it's chosen, run a second round of five presets for the panel. They inherit the chosen tokens and typography and vary the app-shell structure and density, and they can be lighter (shell, dashboard, one list). For standard plus webstore, one round whose presets show both a content page and the shop views.
- **Build order:** shared foundation, then the public surface, then the panel.
- The sibling skills sit next to this one (`<skill-dir>/../ngd-panel/SKILL.md` and so on). If a request needs one that isn't loaded, read its SKILL.md from there; if it isn't installed at all, say so and apply the closest guidance from the core references.

### When guidance conflicts
1. The user's explicit answers and instructions.
2. Reference images or brand guidelines the user supplied.
3. Existing brand assets (logo, current site), unless the user wants a rebrand.
4. This skill's defaults (design language, preset archetypes).

Theme color, color mode, fonts, motion level and imagery are always the user's decision: this skill tells you how to ask and how to apply the answer, never what the answer is.
<!-- ngd:workflow:end -->

## What's specific to webstores

### Extra discovery questions
Merge these into the core rounds; a short fourth round for payments and shipping is fine. Skip whatever the request already answers.

**Ask:**
- **What you sell:** physical goods, digital products, subscriptions or services? How many products and variants, and how often does the catalogue change? (With round 1's "what are we building".)
- **Where products live today:** Shopify, WooCommerce, another platform, a spreadsheet, nowhere yet? If migrating: product URLs (redirects), customers, orders and reviews. Who runs the store day to day? (Non-technical staff need a real admin: the platform's, or an ngd-panel admin.)
- **Payments and markets:** countries, currencies, languages, payment methods customers expect (cards, wallets, iDEAL/Wero, Bancontact, Klarna, PayPal), B2B invoicing?
- **Shipping and returns:** carriers, zones, costs, free-shipping threshold, delivery times and cut-off, pickup points, return window, return costs.
- **Product content:** photography per variant? Descriptions, specs, size guides, safety information? (With round 3's image question.)
- **Company details** for the imprint, terms, returns policy and withdrawal information (ask for them when you reach the legal pages if the user prefers).

**Assume and state in the playback** (the user corrects in one line):
- **Taxes:** prices include VAT; the payment or commerce provider calculates cross-border VAT (OSS) if they sell abroad.
- **Reviews:** start collecting fresh unless they have a source to import or display.
- **Accounts:** guest checkout plus optional accounts.
- **Promotions:** discount codes only at launch; sales, gift cards and loyalty later.
- **Fulfilment:** own stock with the platform's inventory, unless they mentioned a 3PL or dropshipping.

Then propose the commerce backend (`references/commerce.md`, section 1) in the playback, with a one-line reason and the main trade-off, so the user can correct it without an extra round. Ask outright only when two options are genuinely close. Record the decision and reasons in DESIGN.md.
### Read before designing and building
- `references/store-ux.md`: page-by-page UX for home, category, product, cart, checkout, account, search, reviews and promotions, with mobile and accessibility specifics. Use it to plan the presets and the build.
- `references/commerce.md`: backend options, catalogue rendering and caching, cart, checkout, webhooks, search, media, money and tax, store SEO, EU compliance, analytics and performance.

### Preset archetypes for stores
Pick five that suit the brand and catalogue and that differ strongly (`references/core/presets.md`):
1. **Catalogue First:** a search-pill hero, category chips and a dense product grid straight away, soft shapes. Suits broad catalogues and marketplaces.
2. **Brand Story:** full-bleed lifestyle hero, editorial collection stories, a shoppable lookbook, editorial shapes. Suits fashion, interiors and premium DTC.
3. **Hero Product:** one flagship product as the homepage, with product-page depth (benefits, details, reviews, comparison). Suits single-product brands and launches.
4. **Drop Culture:** bold type, high contrast, oversized product shots, limited collections, often dark. Suits streetwear, sneakers and collectibles.
5. **Minimal Premium:** lots of whitespace, few large products per row, serif accents, a slow, confident pace. Suits luxury, jewellery and craft.
6. **Bento Collections:** collections and categories in a playful bento grid with mixed image sizes. Suits lifestyle, gifts and food.
7. **Guided Finder:** a short quiz in the hero ("Find your roast") that leads to recommended products. Suits coffee, skincare, mattresses and anything where choice paralysis kills sales.

**What each preset shows:** one long page in two parts. First the **homepage** (header with search and cart, USP bar, hero, category entry points, a product rail or grid with real-looking cards and prices, proof, footer). Then, after a `<div class="ngd-part" data-part="Product page"></div>` divider (the screenshot script captures each part), the **product page** (gallery, buy box with variant picker, price, delivery and returns reassurance, details accordion, reviews summary). Add the open cart drawer if the direction has a distinctive one. Both parts use the full width (no centred container), the product page has no breadcrumb trail, and no heading has a pill or chip above it (`references/core/design-language.md`, sections 5 and 7).

### Build notes
- **Commerce module first:** `app/lib/commerce.server.ts` wraps the chosen provider. Pages use its typed functions, never the provider SDK directly.
- **Shared commerce components:** `ProductCard`, `Price` (handles currency, VAT label, sale plus prior price), `VariantPicker` (radio groups), `AddToCart` (fetcher with an optimistic count), `CartDrawer`, `Rating`, `UspBar`. Each has its own `.module.css`.
- **Routes:** home, `/collections/:handle` (or localized equivalents), `/products/:handle`, `/cart`, `/search` (noindex), `/account/*` (ngd-panel patterns, noindex), withdrawal page, policy pages, `/feeds/google.xml`, webhooks.
- **Rendering:** prerender small, stable catalogues; otherwise SSR with Workers Cache and tag purging on product-update webhooks (`references/commerce.md`, section 2). Cart, checkout and account are always `private, no-store` and `noindex`.
- **Structured data:** `Product`/`ProductGroup` with offers on every product page, `BreadcrumbList` (data only, no visible trail), and `Organization` with return and shipping policies. Validate.
- **Images:** consistent aspect ratio, variant images, accurate `sizes`, only the first row eager, a card-to-product view transition.
- **Test mode end to end:** add to cart, checkout (success, failure, cancel), webhook records the order, confirmation email.

### Definition of done (in addition to `references/core/quality.md`)
- [ ] Product pages: valid `Product` structured data (price, currency, availability) and price including VAT, delivery and returns reassurance and payment methods next to the add-to-cart button.
- [ ] Discounted prices show the 30-day prior price; shipping costs are known before checkout.
- [ ] The EU withdrawal function and returns policy are implemented and linked (footer, account, confirmation email), if selling to EU consumers.
- [ ] Checkout tested in test mode: success, failure and cancellation, with webhook-recorded orders and confirmation emails.
- [ ] Faceted URLs are controlled (robots/noindex), pagination is crawlable, and cart, checkout, account and search are `noindex`.
- [ ] The product feed validates (if agreed); the Merchant Center setup is listed in the handover.
- [ ] Category and product pages score Lighthouse mobile ≥ 95, with no layout shift from images or banners.
